import { supabase } from "@/integrations/supabase/client";

export interface SMSDraft {
  to: string;
  text: string;
}

export interface SMSLog {
  id: string;
  user_id: string;
  direction: "inbound" | "outbound";
  status: "draft" | "sent" | "failed";
  from_number?: string;
  to_number?: string;
  text?: string;
  created_at: string;
}

// Save SMS draft to database
export async function saveSMSDraft(
  userId: string,
  draft: SMSDraft
): Promise<SMSLog | null> {
  const { data, error } = await supabase
    .from("sms_logs")
    .insert({
      user_id: userId,
      direction: "outbound",
      status: "draft",
      to_number: draft.to,
      text: draft.text,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to save SMS draft:", error);
    return null;
  }

  return data;
}

// Get SMS drafts
export async function getSMSDrafts(userId: string): Promise<SMSLog[]> {
  const { data, error } = await supabase
    .from("sms_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "draft")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to get SMS drafts:", error);
    return [];
  }

  return data || [];
}

// Delete SMS draft
export async function deleteSMSDraft(userId: string, smsId: string): Promise<boolean> {
  const { error } = await supabase
    .from("sms_logs")
    .delete()
    .eq("id", smsId)
    .eq("user_id", userId);

  return !error;
}

// Open SMS app with pre-filled content (mobile)
export function openSMSApp(draft: SMSDraft): void {
  // Different URL schemes for iOS and Android
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  if (isIOS) {
    window.location.href = `sms:${draft.to}&body=${encodeURIComponent(draft.text)}`;
  } else {
    window.location.href = `sms:${draft.to}?body=${encodeURIComponent(draft.text)}`;
  }
}

// Copy SMS to clipboard
export async function copySMSToClipboard(draft: SMSDraft): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(draft.text);
    return true;
  } catch {
    return false;
  }
}

// Format phone number for display
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
}