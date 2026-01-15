import { supabase } from "@/integrations/supabase/client";
import { ActionResult } from '../types';
import { recordAction } from "@/services/action-history";

export async function executeCreateNote(
  userId: string,
  title: string,
  content: string,
  tags?: string[],
  pinned: boolean = false
): Promise<ActionResult> {
  try {
    const { data, error } = await supabase.from("notes").insert({
      user_id: userId,
      title,
      content,
      tags,
      pinned,
    }).select().single();

    if (error) throw error;

    await recordAction(userId, "create", "note", data.id, null, data);

    return {
      tool: "create_note",
      success: true,
      data: {
        ...data,
        voiceText: `Note created: "${title}"${pinned ? " and pinned" : ""}.`,
      },
    };
  } catch (error: any) {
    return {
      tool: "create_note",
      success: false,
      error: error.message,
    };
  }
}

export async function executeGetNotes(
  userId: string,
  search?: string,
  limit: number = 10,
  pinnedOnly: boolean = false
): Promise<ActionResult> {
  try {
    let query = supabase.from("notes").select("*").eq("user_id", userId);
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }
    
    if (pinnedOnly) {
      query = query.eq("pinned", true);
    }
    
    const { data, error } = await query
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const voiceText = data && data.length > 0
      ? `Found ${data.length} note${data.length > 1 ? 's' : ''}${search ? ` matching "${search}"` : ""}.`
      : `No notes found${search ? ` matching "${search}"` : ""}.`;

    return {
      tool: "get_notes",
      success: true,
      data: {
        notes: data?.map(n => ({
          id: n.id,
          title: n.title,
          content: n.content.substring(0, 200) + (n.content.length > 200 ? "..." : ""),
          tags: n.tags,
          pinned: n.pinned,
          created_at: n.created_at,
        })) || [],
        voiceText,
      },
    };
  } catch (error: any) {
    return {
      tool: "get_notes",
      success: false,
      error: error.message,
    };
  }
}

export async function executeSearchNotes(
  userId: string,
  query: string
): Promise<ActionResult> {
  try {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order("updated_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        tool: "search_notes",
        success: true,
        data: {
          notes: [],
          voiceText: `I couldn't find any notes matching "${query}".`,
        },
      };
    }

    const voiceText = `Found ${data.length} note${data.length > 1 ? 's' : ''} matching "${query}". ${data.slice(0, 3).map((n, i) => `${i + 1}. "${n.title}"`).join(". ")}`;

    return {
      tool: "search_notes",
      success: true,
      data: {
        notes: data.map(n => ({
          id: n.id,
          title: n.title,
          preview: n.content.substring(0, 100),
        })),
        voiceText,
      },
    };
  } catch (error: any) {
    return {
      tool: "search_notes",
      success: false,
      error: error.message,
    };
  }
}

export async function executeUpdateNote(
  userId: string,
  noteId?: string,
  noteTitle?: string,
  newTitle?: string,
  newContent?: string,
  newTags?: string[]
): Promise<ActionResult> {
  try {
    let query = supabase.from("notes").select("*").eq("user_id", userId);
    
    if (noteId) {
      query = query.eq("id", noteId);
    } else if (noteTitle) {
      query = query.ilike("title", `%${noteTitle}%`);
    } else {
      return { tool: "update_note", success: false, error: "Either note_id or note_title is required" };
    }

    const { data: note, error: fetchError } = await query.single();
    if (fetchError || !note) {
      return { tool: "update_note", success: false, error: "Note not found" };
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (newTitle) updates.title = newTitle;
    if (newContent) updates.content = newContent;
    if (newTags) updates.tags = newTags;

    const { data, error } = await supabase
      .from("notes")
      .update(updates)
      .eq("id", note.id)
      .select()
      .single();

    if (error) throw error;

    await recordAction(userId, "update", "note", note.id, note, data);

    return {
      tool: "update_note",
      success: true,
      data: {
        note: data,
        voiceText: `Updated note: "${data.title}".`,
      },
    };
  } catch (error: any) {
    return { tool: "update_note", success: false, error: error.message };
  }
}

export async function executeDeleteNote(
  userId: string,
  noteId?: string,
  noteTitle?: string
): Promise<ActionResult> {
  try {
    let query = supabase.from("notes").select("*").eq("user_id", userId);
    
    if (noteId) {
      query = query.eq("id", noteId);
    } else if (noteTitle) {
      query = query.ilike("title", `%${noteTitle}%`);
    } else {
      return { tool: "delete_note", success: false, error: "Either note_id or note_title is required" };
    }

    const { data: note, error: fetchError } = await query.single();
    if (fetchError || !note) {
      return { tool: "delete_note", success: false, error: "Note not found" };
    }

    await recordAction(userId, "delete", "note", note.id, note, null);

    const { error } = await supabase.from("notes").delete().eq("id", note.id);
    if (error) throw error;

    return {
      tool: "delete_note",
      success: true,
      data: {
        note,
        voiceText: `Deleted note: "${note.title}".`,
      },
    };
  } catch (error: any) {
    return { tool: "delete_note", success: false, error: error.message };
  }
}

export async function executePinNote(
  userId: string,
  noteId?: string,
  noteTitle?: string,
  pinned: boolean = true
): Promise<ActionResult> {
  try {
    let query = supabase.from("notes").select("*").eq("user_id", userId);
    
    if (noteId) {
      query = query.eq("id", noteId);
    } else if (noteTitle) {
      query = query.ilike("title", `%${noteTitle}%`);
    } else {
      return { tool: "pin_note", success: false, error: "Either note_id or note_title is required" };
    }

    const { data: note, error: fetchError } = await query.single();
    if (fetchError || !note) {
      return { tool: "pin_note", success: false, error: "Note not found" };
    }

    const { data, error } = await supabase
      .from("notes")
      .update({ pinned, updated_at: new Date().toISOString() })
      .eq("id", note.id)
      .select()
      .single();

    if (error) throw error;

    await recordAction(userId, "update", "note", note.id, note, data);

    return {
      tool: "pin_note",
      success: true,
      data: {
        note: data,
        voiceText: `${pinned ? "Pinned" : "Unpinned"} note: "${data.title}".`,
      },
    };
  } catch (error: any) {
    return { tool: "pin_note", success: false, error: error.message };
  }
}