import { supabase } from "@/integrations/supabase/client";

export interface EmailDraft {
  to: string;
  subject: string;
  body: string;
  htmlBody?: string;
}

export interface EmailLog {
  id: string;
  user_id: string;
  direction: "inbound" | "outbound";
  status: "draft" | "sent" | "failed";
  from_email?: string;
  to_email?: string;
  subject?: string;
  body?: string;
  html_body?: string;
  summary?: string;
  created_at: string;
}

// Save email draft to database
export async function saveEmailDraft(
  userId: string,
  draft: EmailDraft
): Promise<EmailLog | null> {
  const { data, error } = await supabase
    .from("email_logs")
    .insert({
      user_id: userId,
      direction: "outbound",
      status: "draft",
      to_email: draft.to,
      subject: draft.subject,
      body: draft.body,
      html_body: draft.htmlBody,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to save email draft:", error);
    return null;
  }

  return data;
}

// Get email drafts
export async function getEmailDrafts(userId: string): Promise<EmailLog[]> {
  const { data, error } = await supabase
    .from("email_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "draft")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to get email drafts:", error);
    return [];
  }

  return data || [];
}

// Get sent emails
export async function getSentEmails(userId: string, limit = 20): Promise<EmailLog[]> {
  const { data, error } = await supabase
    .from("email_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "sent")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to get sent emails:", error);
    return [];
  }

  return data || [];
}

// Delete email draft
export async function deleteEmailDraft(userId: string, emailId: string): Promise<boolean> {
  const { error } = await supabase
    .from("email_logs")
    .delete()
    .eq("id", emailId)
    .eq("user_id", userId);

  return !error;
}

// Open email client with pre-filled content
export function openEmailClient(draft: EmailDraft): void {
  const mailtoUrl = `mailto:${encodeURIComponent(draft.to)}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
  window.location.href = mailtoUrl;
}

// Copy email to clipboard
export async function copyEmailToClipboard(draft: EmailDraft): Promise<boolean> {
  try {
    const text = `To: ${draft.to}\nSubject: ${draft.subject}\n\n${draft.body}`;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}