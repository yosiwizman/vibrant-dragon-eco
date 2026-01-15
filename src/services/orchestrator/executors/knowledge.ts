import { supabase } from "@/integrations/supabase/client";
import { ActionResult } from '../types';
import { searchKnowledge, addDocument } from "@/services/rag-knowledge";

export async function executeGetKnowledge(
  userId: string,
  category?: string,
  search?: string
): Promise<ActionResult> {
  try {
    let query = supabase.from("knowledge").select("*").eq("user_id", userId);
    
    if (category) {
      query = query.eq("category", category);
    }
    
    if (search) {
      query = query.or(`key.ilike.%${search}%,value.ilike.%${search}%`);
    }
    
    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    const voiceText = data && data.length > 0
      ? `I found ${data.length} piece${data.length > 1 ? 's' : ''} of information${search ? ` about "${search}"` : ""}.`
      : `I don't have any information${search ? ` about "${search}"` : ""} stored.`;

    return {
      tool: "get_knowledge",
      success: true,
      data: {
        knowledge: data?.map(k => ({ category: k.category, key: k.key, value: k.value })) || [],
        voiceText,
      },
    };
  } catch (error: any) {
    return {
      tool: "get_knowledge",
      success: false,
      error: error.message,
    };
  }
}

export async function executeSaveMemory(
  userId: string,
  category: string,
  key: string,
  value: string
): Promise<ActionResult> {
  try {
    // Check if this memory already exists
    const { data: existing } = await supabase
      .from("knowledge")
      .select("*")
      .eq("user_id", userId)
      .eq("category", category)
      .eq("key", key)
      .single();

    let data;
    if (existing) {
      // Update existing
      const { data: updated, error } = await supabase
        .from("knowledge")
        .update({ value })
        .eq("id", existing.id)
        .select()
        .single();
      
      if (error) throw error;
      data = updated;
    } else {
      // Create new
      const { data: created, error } = await supabase.from("knowledge").insert({
        user_id: userId,
        category,
        key,
        value,
      }).select().single();

      if (error) throw error;
      data = created;
    }

    return {
      tool: "save_memory",
      success: true,
      data: {
        memory: data,
        voiceText: `Got it! I'll remember that ${key} is ${value}.`,
      },
    };
  } catch (error: any) {
    return {
      tool: "save_memory",
      success: false,
      error: error.message,
    };
  }
}

export async function executeGetMemories(
  userId: string,
  category?: string,
  search?: string
): Promise<ActionResult> {
  try {
    let query = supabase.from("knowledge").select("*").eq("user_id", userId);
    
    if (category) {
      query = query.eq("category", category);
    }
    
    if (search) {
      query = query.or(`key.ilike.%${search}%,value.ilike.%${search}%`);
    }
    
    const { data, error } = await query.order("created_at", { ascending: false }).limit(10);

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        tool: "get_memories",
        success: true,
        data: {
          memories: [],
          voiceText: search
            ? `I don't have any memories about "${search}".`
            : "I don't have any saved memories yet.",
        },
      };
    }

    const voiceText = `I remember ${data.length} thing${data.length > 1 ? 's' : ''}. ${data.slice(0, 3).map(m => `${m.key}: ${m.value}`).join(". ")}`;

    return {
      tool: "get_memories",
      success: true,
      data: {
        memories: data,
        voiceText,
      },
    };
  } catch (error: any) {
    return {
      tool: "get_memories",
      success: false,
      error: error.message,
    };
  }
}

export async function executeSearchKnowledgeBase(
  userId: string,
  query: string,
  category?: string
): Promise<ActionResult> {
  try {
    const results = await searchKnowledge(userId, query, { category, limit: 5 });
    
    if (results.length === 0) {
      return {
        tool: "search_knowledge_base",
        success: true,
        data: {
          results: [],
          voiceText: `I couldn't find anything in your knowledge base about "${query}".`,
        },
      };
    }
    
    const topResult = results[0];
    const voiceText = `Found ${results.length} result${results.length > 1 ? 's' : ''} about "${query}". The most relevant is from "${topResult.document.title}": ${topResult.chunk.content.substring(0, 200)}...`;
    
    return {
      tool: "search_knowledge_base",
      success: true,
      data: {
        results: results.map(r => ({
          title: r.document.title,
          content: r.chunk.content,
          relevance: r.relevanceScore,
        })),
        voiceText,
      },
    };
  } catch (error: any) {
    return { tool: "search_knowledge_base", success: false, error: error.message };
  }
}

export async function executeAddToKnowledgeBase(
  userId: string,
  title: string,
  content: string,
  category?: string,
  tags?: string[]
): Promise<ActionResult> {
  try {
    const result = await addDocument(userId, {
      title,
      content,
      sourceType: "manual",
      metadata: { category, tags },
    });
    
    if (!result.success) {
      return { tool: "add_to_knowledge_base", success: false, error: result.error };
    }
    
    return {
      tool: "add_to_knowledge_base",
      success: true,
      data: {
        document: result.document,
        voiceText: `Added "${title}" to your knowledge base.`,
      },
    };
  } catch (error: any) {
    return { tool: "add_to_knowledge_base", success: false, error: error.message };
  }
}

// Alias for backward compatibility
export const executeAddKnowledge = executeSaveMemory;