import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

// Save a chat message
export async function saveChatMessage(
  userId: string,
  role: "user" | "assistant",
  content: string
): Promise<{ success: boolean; data?: ChatMessage; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        user_id: userId,
        role,
        content,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: data as ChatMessage };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to save message";
    return { success: false, error: errorMessage };
  }
}

// Get chat history
export async function getChatHistory(
  userId: string,
  limit: number = 50
): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    // Return in chronological order
    return ((data || []) as ChatMessage[]).reverse();
  } catch (error) {
    console.error("Failed to get chat history:", error);
    return [];
  }
}

// Get recent chat context for AI (last N messages)
export async function getChatContext(
  userId: string,
  messageCount: number = 10
): Promise<{ role: "user" | "assistant"; content: string }[]> {
  try {
    const messages = await getChatHistory(userId, messageCount);
    return messages.map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
  } catch (error) {
    console.error("Failed to get chat context:", error);
    return [];
  }
}

// Clear chat history
export async function clearChatHistory(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to clear history";
    return { success: false, error: errorMessage };
  }
}

// Get chat history stats
export async function getChatHistoryStats(userId: string): Promise<{
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  oldestMessage?: string;
  newestMessage?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("role, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const messages = data || [];
    const userMessages = messages.filter(m => m.role === "user").length;
    const assistantMessages = messages.filter(m => m.role === "assistant").length;

    return {
      totalMessages: messages.length,
      userMessages,
      assistantMessages,
      oldestMessage: messages[0]?.created_at,
      newestMessage: messages[messages.length - 1]?.created_at,
    };
  } catch (error) {
    console.error("Failed to get chat stats:", error);
    return {
      totalMessages: 0,
      userMessages: 0,
      assistantMessages: 0,
    };
  }
}