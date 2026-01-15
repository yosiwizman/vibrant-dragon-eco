import { supabase } from "@/integrations/supabase/client";
import { ActionResult } from '../types';

export async function executeDraftEmail(
  userId: string,
  prompt: string,
  to?: string,
  subject?: string
): Promise<ActionResult> {
  try {
    const { data, error } = await supabase.from("email_logs").insert({
      user_id: userId,
      direction: "outbound",
      status: "draft",
      to_email: to || "[recipient]",
      subject: subject || "New Email",
      body: prompt,
    }).select().single();

    if (error) throw error;

    return {
      tool: "draft_email",
      success: true,
      data: {
        draft: data,
        voiceText: `Email draft created${to ? ` to ${to}` : ""}. You can find it in Messages.`,
      },
    };
  } catch (error: any) {
    return {
      tool: "draft_email",
      success: false,
      error: error.message,
    };
  }
}

export async function executeDraftSMS(
  userId: string,
  prompt: string,
  to?: string
): Promise<ActionResult> {
  try {
    const { data, error } = await supabase.from("sms_logs").insert({
      user_id: userId,
      direction: "outbound",
      status: "draft",
      to_number: to || "[recipient]",
      text: prompt,
    }).select().single();

    if (error) throw error;

    return {
      tool: "draft_sms",
      success: true,
      data: {
        draft: data,
        voiceText: `SMS draft created${to ? ` to ${to}` : ""}. You can find it in Messages.`,
      },
    };
  } catch (error: any) {
    return {
      tool: "draft_sms",
      success: false,
      error: error.message,
    };
  }
}

export async function executeGetDrafts(
  userId: string,
  type: string = "all"
): Promise<ActionResult> {
  try {
    const drafts: any[] = [];

    if (type === "all" || type === "email") {
      const { data: emails } = await supabase
        .from("email_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "draft")
        .order("created_at", { ascending: false });
      
      if (emails) {
        drafts.push(...emails.map(e => ({ ...e, type: "email" })));
      }
    }

    if (type === "all" || type === "sms") {
      const { data: sms } = await supabase
        .from("sms_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "draft")
        .order("created_at", { ascending: false });
      
      if (sms) {
        drafts.push(...sms.map(s => ({ ...s, type: "sms" })));
      }
    }

    const voiceText = drafts.length > 0
      ? `You have ${drafts.length} draft${drafts.length > 1 ? 's' : ''}.`
      : "You have no drafts.";

    return {
      tool: "get_drafts",
      success: true,
      data: { drafts, voiceText },
    };
  } catch (error: any) {
    return { tool: "get_drafts", success: false, error: error.message };
  }
}

export async function executeDeleteDraft(
  userId: string,
  draftId: string,
  type: string
): Promise<ActionResult> {
  try {
    const tableName = type === "email" ? "email_logs" : "sms_logs";
    
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq("id", draftId)
      .eq("user_id", userId);

    if (error) throw error;

    return {
      tool: "delete_draft",
      success: true,
      data: { voiceText: `${type === "email" ? "Email" : "SMS"} draft deleted.` },
    };
  } catch (error: any) {
    return { tool: "delete_draft", success: false, error: error.message };
  }
}