export type ChatRole = 'system' | 'user' | 'assistant';

export type ChatContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export type ChatMessage = {
  role: ChatRole;
  content: string | ChatContentPart[];
};

export type ChatRequest = {
  messages: ChatMessage[];
  response_format?: { type?: string };
  temperature?: number;
};

const MAX_MESSAGES = 20;
const MAX_TEXT_LENGTH = 8_000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const DATA_IMAGE_PATTERN = /^data:(image\/(?:png|jpe?g|webp));base64,([A-Za-z0-9+/]+={0,2})$/i;

export class ChatRequestError extends Error {}

function validateText(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > MAX_TEXT_LENGTH) {
    throw new ChatRequestError(`${field} must be a non-empty string of at most ${MAX_TEXT_LENGTH} characters.`);
  }
}

function validateContent(content: unknown): asserts content is ChatMessage['content'] {
  if (typeof content === 'string') {
    validateText(content, 'Message content');
    return;
  }

  if (!Array.isArray(content) || content.length === 0 || content.length > 10) {
    throw new ChatRequestError('Message content must contain between 1 and 10 parts.');
  }

  for (const part of content) {
    if (!part || typeof part !== 'object') throw new ChatRequestError('Invalid message content part.');
    const candidate = part as Record<string, unknown>;
    if (candidate.type === 'text') {
      validateText(candidate.text, 'Text content');
      continue;
    }
    if (candidate.type === 'image_url' && candidate.image_url && typeof candidate.image_url === 'object') {
      const url = (candidate.image_url as Record<string, unknown>).url;
      if (typeof url !== 'string') throw new ChatRequestError('Image content must include a data URL.');
      const match = url.match(DATA_IMAGE_PATTERN);
      if (!match || Buffer.byteLength(match[2], 'base64') > MAX_IMAGE_BYTES) {
        throw new ChatRequestError('Images must be PNG, JPEG, or WebP data URLs no larger than 5 MB.');
      }
      continue;
    }
    throw new ChatRequestError('Unsupported message content part.');
  }
}

/** Validates and narrows untrusted client input before it reaches an AI provider. */
export function parseChatRequest(payload: unknown): ChatRequest {
  if (!payload || typeof payload !== 'object' || !Array.isArray((payload as Record<string, unknown>).messages)) {
    throw new ChatRequestError('Request body must include a messages array.');
  }

  const input = payload as Record<string, unknown>;
  const rawMessages = input.messages;
  if (!Array.isArray(rawMessages)) {
    throw new ChatRequestError('Request body must include a messages array.');
  }
  if (rawMessages.length === 0 || rawMessages.length > MAX_MESSAGES) {
    throw new ChatRequestError(`messages must contain between 1 and ${MAX_MESSAGES} entries.`);
  }

  const messages = rawMessages.map((message): ChatMessage => {
    if (!message || typeof message !== 'object') throw new ChatRequestError('Invalid message.');
    const candidate = message as Record<string, unknown>;
    if (candidate.role !== 'system' && candidate.role !== 'user' && candidate.role !== 'assistant') {
      throw new ChatRequestError('Message role must be system, user, or assistant.');
    }
    validateContent(candidate.content);
    return { role: candidate.role, content: candidate.content };
  });

  const temperature = input.temperature;
  if (temperature !== undefined && (typeof temperature !== 'number' || !Number.isFinite(temperature) || temperature < 0 || temperature > 2)) {
    throw new ChatRequestError('temperature must be a number between 0 and 2.');
  }

  const responseFormat = input.response_format;
  if (responseFormat !== undefined && (!responseFormat || typeof responseFormat !== 'object' || (responseFormat as Record<string, unknown>).type !== 'json_object')) {
    throw new ChatRequestError('Only response_format.type=json_object is supported.');
  }

  return {
    messages,
    temperature: temperature as number | undefined,
    response_format: responseFormat as ChatRequest['response_format'],
  };
}

export function toGeminiContents(messages: ChatMessage[]) {
  let systemInstruction: string | undefined;
  const contents: Array<{ role: 'user' | 'model'; parts: Array<Record<string, unknown>> }> = [];

  for (const message of messages) {
    if (message.role === 'system') {
      const text = typeof message.content === 'string'
        ? message.content
        : message.content.filter((part) => part.type === 'text').map((part) => part.text).join('\n');
      systemInstruction = systemInstruction ? `${systemInstruction}\n${text}` : text;
      continue;
    }

    const parts = typeof message.content === 'string'
      ? [{ text: message.content }]
      : message.content.map((part) => {
          if (part.type === 'text') return { text: part.text };
          const match = part.image_url.url.match(DATA_IMAGE_PATTERN)!;
          return { inlineData: { mimeType: match[1], data: match[2] } };
        });
    contents.push({ role: message.role === 'assistant' ? 'model' : 'user', parts });
  }

  return { systemInstruction, contents };
}
