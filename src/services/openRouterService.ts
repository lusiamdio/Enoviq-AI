export async function callOpenRouter({
  prompt,
  messages,
  model = "openai/gpt-4o-mini",
  systemPrompt,
  responseFormat,
  temperature
}: {
  prompt?: string,
  messages?: any[],
  model?: string,
  systemPrompt?: string,
  responseFormat?: any,
  temperature?: number
}) {
  let finalMessages = messages || [];
  
  if (!messages) {
    if (systemPrompt) {
      finalMessages.push({ role: "system", content: systemPrompt });
    }
    if (prompt) {
      finalMessages.push({ role: "user", content: prompt });
    }
  }

  const payload: any = {
    model: model,
    messages: finalMessages,
  };

  if (responseFormat) {
    payload.response_format = responseFormat;
  }
  if (temperature !== undefined) {
    payload.temperature = temperature;
  }

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to call OpenRouter API");
  }

  return data.choices[0].message.content;
}
