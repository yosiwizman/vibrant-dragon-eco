import { supabase } from "@/integrations/supabase/client";

export interface MemoryItem {
  id: string;
  category: string;
  key: string;
  value: string;
  importance: "low" | "medium" | "high";
  created_at: string;
}

// Save a memory
export async function saveMemory(
  userId: string,
  category: string,
  key: string,
  value: string,
  importance: "low" | "medium" | "high" = "medium"
): Promise<{ success: boolean; data?: MemoryItem; error?: string }> {
  try {
    // Check if memory with same key exists
    const { data: existing } = await supabase
      .from("knowledge")
      .select("*")
      .eq("user_id", userId)
      .eq("category", category)
      .eq("key", key)
      .single();

    if (existing) {
      // Update existing memory
      const { data, error } = await supabase
        .from("knowledge")
        .update({ value })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: data as MemoryItem };
    }

    // Create new memory
    const { data, error } = await supabase
      .from("knowledge")
      .insert({
        user_id: userId,
        category,
        key,
        value,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: data as MemoryItem };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to save memory";
    return { success: false, error: errorMessage };
  }
}

// Get all memories for a user
export async function getMemories(
  userId: string,
  category?: string
): Promise<MemoryItem[]> {
  try {
    let query = supabase
      .from("knowledge")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as MemoryItem[];
  } catch (error) {
    console.error("Failed to get memories:", error);
    return [];
  }
}

// Search memories
export async function searchMemories(
  userId: string,
  query: string
): Promise<MemoryItem[]> {
  try {
    const { data, error } = await supabase
      .from("knowledge")
      .select("*")
      .eq("user_id", userId)
      .or(`key.ilike.%${query}%,value.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    return (data || []) as MemoryItem[];
  } catch (error) {
    console.error("Failed to search memories:", error);
    return [];
  }
}

// Delete a memory
export async function deleteMemory(
  userId: string,
  memoryId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("knowledge")
      .delete()
      .eq("id", memoryId)
      .eq("user_id", userId);

    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete memory";
    return { success: false, error: errorMessage };
  }
}

// Get memory context for AI (returns formatted string of relevant memories)
export async function getMemoryContext(userId: string): Promise<string> {
  try {
    const memories = await getMemories(userId);
    
    if (memories.length === 0) {
      return "";
    }

    // Group by category
    const grouped: Record<string, MemoryItem[]> = {};
    for (const memory of memories) {
      if (!grouped[memory.category]) {
        grouped[memory.category] = [];
      }
      grouped[memory.category].push(memory);
    }

    // Format for AI context
    let context = "\n\nUSER MEMORIES (things the user has asked you to remember):\n";
    for (const [category, items] of Object.entries(grouped)) {
      context += `\n${category.toUpperCase()}:\n`;
      for (const item of items.slice(0, 5)) {
        context += `- ${item.key}: ${item.value}\n`;
      }
    }

    return context;
  } catch (error) {
    console.error("Failed to get memory context:", error);
    return "";
  }
}

// Parse memory save request from user input
export function parseMemorySaveRequest(text: string): { category: string; key: string; value: string } | null {
  // Patterns for saving memories
  const patterns = [
    /remember\s+(?:that\s+)?(?:my\s+)?(.+?)\s+is\s+(.+)/i,
    /save\s+(?:this\s+)?(?:memory|info|information)?\s*:?\s*(.+)/i,
    /don't\s+forget\s+(?:that\s+)?(.+)/i,
    /keep\s+in\s+mind\s+(?:that\s+)?(.+)/i,
    /note\s+(?:that\s+)?(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match.length === 3) {
        // Pattern with key and value
        return {
          category: "personal",
          key: match[1].trim(),
          value: match[2].trim(),
        };
      } else if (match.length === 2) {
        // Pattern with just value
        const content = match[1].trim();
        return {
          category: "general",
          key: content.substring(0, 50),
          value: content,
        };
      }
    }
  }

  return null;
}

// Check if user is asking to save a memory
export function isMemorySaveRequest(text: string): boolean {
  const keywords = [
    "remember",
    "save this",
    "don't forget",
    "keep in mind",
    "note that",
    "save memory",
    "remember this",
  ];
  
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword));
}