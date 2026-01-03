import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// Get the user's configured AI provider
export async function getAIProvider(userId: string): Promise<{
  provider: string;
  apiKey: string;
  model: string;
} | null> {
  // First check for OpenAI
  const { data: openai } = await supabase
    .from("api_providers")
    .select("*")
    .eq("user_id", userId)
    .eq("provider_name", "openai")
    .eq("is_enabled", true)
    .single();

  if (openai?.api_key) {
    const config = openai.config as any;
    return {
      provider: "openai",
      apiKey: openai.api_key,
      model: config?.model || "gpt-4o-mini",
    };
  }

  // Check for Anthropic
  const { data: anthropic } = await supabase
    .from("api_providers")
    .select("*")
    .eq("user_id", userId)
    .eq("provider_name", "anthropic")
    .eq("is_enabled", true)
    .single();

  if (anthropic?.api_key) {
    const config = anthropic.config as any;
    return {
      provider: "anthropic",
      apiKey: anthropic.api_key,
      model: config?.model || "claude-3-5-sonnet-20241022",
    };
  }

  return null;
}

// Chat with OpenAI
export async function chatWithOpenAI(
  messages: ChatMessage[],
  apiKey: string,
  options: ChatOptions = {}
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model || "gpt-4o-mini",
      messages,
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Chat with Anthropic Claude
export async function chatWithAnthropic(
  messages: ChatMessage[],
  apiKey: string,
  options: ChatOptions = {}
): Promise<string> {
  // Extract system message
  const systemMessage = messages.find(m => m.role === "system")?.content || "";
  const chatMessages = messages.filter(m => m.role !== "system");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: options.model || "claude-3-5-sonnet-20241022",
      max_tokens: options.maxTokens || 1024,
      system: systemMessage,
      messages: chatMessages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// Universal chat function that uses the appropriate provider
export async function chat(
  messages: ChatMessage[],
  apiKey: string,
  provider: string = "openai",
  options: ChatOptions = {}
): Promise<string> {
  switch (provider) {
    case "anthropic":
      return chatWithAnthropic(messages, apiKey, options);
    case "openai":
    default:
      return chatWithOpenAI(messages, apiKey, options);
  }
}

// Log AI interaction to database
export async function logAIInteraction(
  userId: string,
  type: string,
  title: string,
  content: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await supabase.from("ai_logs").insert({
      user_id: userId,
      type,
      title,
      content,
      metadata: metadata || {},
    });
  } catch (error) {
    console.error("Failed to log AI interaction:", error);
  }
}