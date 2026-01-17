import type { Message } from "@/types/models";
import { DEMO_MODE_SENTINEL_KEY } from "@/services/demo-mode";
import { proxyChat } from "@/services/ai-proxy";

export interface ChatRequest {
  messages: { role: Message["role"]; content: string }[];
  model?: string;
  maxTokens?: number;
}

export interface ChatResponse {
  content: string;
  citations?: { title: string; url: string }[];
}

// Chat with custom Brain API
async function chatWithBrain(
  baseUrl: string,
  req: ChatRequest,
  token?: string
): Promise<ChatResponse> {
  const res = await fetch(`${baseUrl}/v1/brain/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brain API error: ${res.status} ${text}`);
  }
  return res.json();
}

// Chat with OpenAI directly
async function chatWithOpenAI(
  apiKey: string,
  req: ChatRequest
): Promise<ChatResponse> {
  // Demo Mode: use secure server-side proxy instead of client key
  if (apiKey === DEMO_MODE_SENTINEL_KEY) {
    const result = await proxyChat({
      model: req.model || 'gpt-4o-mini',
      messages: req.messages as any,
      max_tokens: req.maxTokens || 1024,
    });
    return { content: result.content };
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: req.model || "gpt-4o-mini",
      messages: req.messages,
      max_tokens: req.maxTokens || 1024,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return {
    content: data.choices[0].message.content,
  };
}

// Main chat function - uses Brain API if configured, otherwise OpenAI
export async function chat(
  baseUrl: string,
  req: ChatRequest,
  token?: string,
  openaiApiKey?: string
): Promise<ChatResponse> {
  // If Brain URL is configured, use it
  if (baseUrl) {
    return chatWithBrain(baseUrl, req, token);
  }
  
  // Otherwise, use OpenAI directly
  if (openaiApiKey) {
    return chatWithOpenAI(openaiApiKey, req);
  }
  
  throw new Error("No AI provider configured. Please set your OpenAI API key in Settings.");
}

// Export individual functions for direct use
export { chatWithOpenAI, chatWithBrain };