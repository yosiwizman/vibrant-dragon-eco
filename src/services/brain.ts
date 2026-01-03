import type { Message } from "@/types/models";

export interface ChatRequest {
  messages: { role: Message["role"]; content: string }[];
}

export interface ChatResponse {
  content: string;
  citations?: { title: string; url: string }[];
}

export async function chat(
  baseUrl: string,
  req: ChatRequest,
  token?: string
): Promise<ChatResponse> {
  if (!baseUrl) throw new Error("BASE_URL is not set in Settings");
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