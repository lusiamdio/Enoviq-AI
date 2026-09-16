import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { ChatRequestError, parseChatRequest, toGeminiContents } from "./server/chatRequest.js";

const REQUEST_TIMEOUT_MS = 30_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

type RateLimitEntry = { count: number; resetAt: number };
const requestCounts = new Map<string, RateLimitEntry>();

function rateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const now = Date.now();
  const key = req.ip || 'unknown';
  const entry = requestCounts.get(key);
  const active = entry && entry.resetAt > now ? entry : { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  active.count += 1;
  requestCounts.set(key, active);

  if (active.count > RATE_LIMIT_MAX_REQUESTS) {
    res.set('Retry-After', String(Math.ceil((active.resetAt - now) / 1000)));
    return res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
  }
  next();
}

async function fetchWithTimeout(url: string, options: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use((_, res, next) => {
    res.set({
      'Content-Security-Policy': "default-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; script-src 'self' 'unsafe-inline'",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=()',
    });
    next();
  });
  app.use(express.json({ limit: "10mb" }));

  // API Route for AI Chat (Supports OpenRouter or falls back to Gemini)
  app.post("/api/chat", rateLimit, async (req, res) => {
    try {
      const payload = parseChatRequest(req.body);

      const openRouterKey = process.env.OPENROUTER_API_KEY;

      if (openRouterKey) {
        const apiPayload = {
          ...payload,
          // The server, not the browser, controls model selection and spending.
          model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini"
        };
        // Use OpenRouter if key is available
        const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
            "X-Title": process.env.APP_NAME || "AfriSommelier"
          },
          body: JSON.stringify(apiPayload)
        });

        if (response.ok) {
          const data = await response.json();
          return res.json(data);
        }
        
        const body = await response.text();
        console.warn(`OpenRouter failed with status ${response.status}. Falling back to Gemini. ${body.slice(0, 500)}`);
      }

      // Fallback to Gemini API
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        return res.status(500).json({ error: "Both OPENROUTER_API_KEY and GEMINI_API_KEY environment variables are missing." });
      }

      // Use the imported GoogleGenAI SDK
      const ai = new GoogleGenAI({ 
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Convert OpenAI-style messages to Gemini style
      const { systemInstruction, contents } = toGeminiContents(payload.messages);

      const config: any = {};
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }
      
      if (payload.response_format?.type === 'json_object') {
        config.responseMimeType = "application/json";
      }

      if (payload.temperature !== undefined) {
        config.temperature = payload.temperature;
      }

      // Route based on requested model family if specified, otherwise default to flash
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

      const response = await ai.models.generateContent({
        model,
        contents,
        config
      });

      // Format response to match OpenAI style (which frontend expects)
      const formattedResponse = {
        choices: [
          {
            message: {
              content: response.text || "{}"
            }
          }
        ]
      };

      res.json(formattedResponse);
    } catch (error) {
      if (error instanceof ChatRequestError) return res.status(400).json({ error: error.message });
      console.error("API Chat Error:", error);
      res.status(502).json({ error: "The AI service is temporarily unavailable. Please try again." });
    }
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof SyntaxError && 'body' in error) {
      return res.status(400).json({ error: 'Request body must be valid JSON.' });
    }
    console.error('Unhandled request error:', error);
    return res.status(500).json({ error: 'Unexpected server error.' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { maxAge: '1h', index: false }));
    // Support Express v4 & v5 fallback
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
