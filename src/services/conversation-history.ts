import { supabase } from "@/integrations/supabase/client";
import type { Message } from "@/types/models";

export interface ConversationSession {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

const LOCAL_STORAGE_KEY = "echo:voice-history";
const MAX_LOCAL_SESSIONS = 10;

// Save conversation to local storage (for quick access)
export function saveConversationLocally(session: ConversationSession) {
  try {
    const existing = getLocalConversations();
    const updated = [session, ...existing.filter(s => s.id !== session.id)].slice(0, MAX_LOCAL_SESSIONS);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save conversation locally:", error);
  }
}

// Get conversations from local storage
export function getLocalConversations(): ConversationSession[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Clear local conversations
export function clearLocalConversations() {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}

// Save message to database
export async function saveMessageToDatabase(
  userId: string,
  role: string,
  content: string
): Promise<void> {
  try {
    await supabase.from("chat_messages").insert({
      user_id: userId,
      role,
      content,
    });
  } catch (error) {
    console.error("Failed to save message to database:", error);
  }
}

// Get recent messages from database
export async function getRecentMessages(
  userId: string,
  limit: number = 50
): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).reverse().map(m => ({
      id: m.id,
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
      createdAt: new Date(m.created_at).getTime(),
    }));
  } catch (error) {
    console.error("Failed to get messages from database:", error);
    return [];
  }
}

// Generate a title for a conversation based on the first message
export function generateConversationTitle(messages: Message[]): string {
  const firstUserMessage = messages.find(m => m.role === "user");
  if (!firstUserMessage) return "New Conversation";
  
  const content = firstUserMessage.content;
  if (content.length <= 40) return content;
  
  // Truncate and add ellipsis
  return content.substring(0, 37) + "...";
}

// Create a new conversation session
export function createConversationSession(userId: string): ConversationSession {
  return {
    id: crypto.randomUUID(),
    userId,
    title: "New Conversation",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// Add message to session
export function addMessageToSession(
  session: ConversationSession,
  message: Message
): ConversationSession {
  const updatedMessages = [...session.messages, message];
  const title = session.messages.length === 0 && message.role === "user"
    ? generateConversationTitle([message])
    : session.title;
  
  return {
    ...session,
    title,
    messages: updatedMessages,
    updatedAt: Date.now(),
  };
}

// Get conversation context for AI (last N messages)
export function getConversationContext(
  messages: Message[],
  maxMessages: number = 10
): { role: string; content: string }[] {
  return messages.slice(-maxMessages).map(m => ({
    role: m.role,
    content: m.content,
  }));
}