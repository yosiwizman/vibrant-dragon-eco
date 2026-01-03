"use client";

import { supabase } from "@/integrations/supabase/client";

export interface AILogEntry {
  type: "chat" | "voice" | "tool" | "summary" | "error";
  title?: string;
  content?: string;
  refId?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an AI interaction
 */
export async function logAIInteraction(
  userId: string,
  entry: AILogEntry
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("ai_logs")
      .insert({
        user_id: userId,
        type: entry.type,
        title: entry.title || null,
        content: entry.content || null,
        ref_id: entry.refId || null,
        metadata: entry.metadata || {},
      })
      .select("id")
      .single();

    if (error) throw error;

    return { success: true, id: data.id };
  } catch (error: any) {
    console.error("Failed to log AI interaction:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Log a voice command
 */
export async function logVoiceCommand(
  userId: string,
  transcript: string,
  response: string,
  toolsUsed?: string[]
): Promise<void> {
  await logAIInteraction(userId, {
    type: "voice",
    title: transcript.substring(0, 100),
    content: response,
    metadata: {
      transcript,
      toolsUsed: toolsUsed || [],
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log a chat message
 */
export async function logChatMessage(
  userId: string,
  userMessage: string,
  assistantResponse: string
): Promise<void> {
  await logAIInteraction(userId, {
    type: "chat",
    title: userMessage.substring(0, 100),
    content: assistantResponse,
    metadata: {
      userMessage,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log a tool execution
 */
export async function logToolExecution(
  userId: string,
  toolName: string,
  parameters: Record<string, any>,
  result: { success: boolean; data?: any; error?: string }
): Promise<void> {
  await logAIInteraction(userId, {
    type: "tool",
    title: `Tool: ${toolName}`,
    content: result.success ? "Success" : `Error: ${result.error}`,
    metadata: {
      toolName,
      parameters,
      result,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log an error
 */
export async function logAIError(
  userId: string,
  errorMessage: string,
  context?: Record<string, any>
): Promise<void> {
  await logAIInteraction(userId, {
    type: "error",
    title: "AI Error",
    content: errorMessage,
    metadata: {
      context,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Get recent AI logs
 */
export async function getRecentLogs(
  userId: string,
  limit: number = 20
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("ai_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Failed to get AI logs:", error);
    return [];
  }
}

/**
 * Get AI usage stats
 */
export async function getAIUsageStats(
  userId: string,
  days: number = 7
): Promise<{
  totalInteractions: number;
  voiceCommands: number;
  chatMessages: number;
  toolCalls: number;
  errors: number;
}> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await supabase
      .from("ai_logs")
      .select("type")
      .eq("user_id", userId)
      .gte("created_at", since.toISOString());

    if (error) throw error;

    const logs = data || [];
    return {
      totalInteractions: logs.length,
      voiceCommands: logs.filter((l) => l.type === "voice").length,
      chatMessages: logs.filter((l) => l.type === "chat").length,
      toolCalls: logs.filter((l) => l.type === "tool").length,
      errors: logs.filter((l) => l.type === "error").length,
    };
  } catch (error) {
    console.error("Failed to get AI usage stats:", error);
    return {
      totalInteractions: 0,
      voiceCommands: 0,
      chatMessages: 0,
      toolCalls: 0,
      errors: 0,
    };
  }
}