import { supabase } from "@/integrations/supabase/client";
import { ActionResult } from '../types';
import { recordAction } from "@/services/action-history";
import { createRecurringReminder } from "@/services/recurrence";
import { recurrenceToString } from "@/services/smart-time-parser";

export async function executeCreateReminder(
  userId: string,
  text: string,
  dueTime: string,
  channel: string = "push"
): Promise<ActionResult> {
  try {
    const { data, error } = await supabase.from("reminders").insert({
      user_id: userId,
      text,
      due_time: dueTime,
      channel,
      status: "pending",
    }).select().single();

    if (error) throw error;

    await recordAction(userId, "create", "reminder", data.id, null, data);

    const dueDate = new Date(dueTime);
    const voiceText = `Reminder set: "${text}" for ${dueDate.toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })}.`;

    return {
      tool: "create_reminder",
      success: true,
      data: { ...data, voiceText },
    };
  } catch (error: any) {
    return {
      tool: "create_reminder",
      success: false,
      error: error.message,
    };
  }
}

export async function executeGetReminders(userId: string, status: string = "pending"): Promise<ActionResult> {
  try {
    let query = supabase.from("reminders").select("*").eq("user_id", userId);
    
    if (status !== "all") {
      query = query.eq("status", status);
    }
    
    const { data, error } = await query.order("due_time", { ascending: true });

    if (error) throw error;

    const voiceText = data && data.length > 0
      ? `You have ${data.length} ${status} reminder${data.length > 1 ? 's' : ''}.`
      : `You have no ${status} reminders.`;

    return {
      tool: "get_reminders",
      success: true,
      data: { reminders: data, voiceText },
    };
  } catch (error: any) {
    return {
      tool: "get_reminders",
      success: false,
      error: error.message,
    };
  }
}

export async function executeDeleteReminder(
  userId: string,
  reminderId?: string,
  reminderText?: string
): Promise<ActionResult> {
  try {
    let query = supabase.from("reminders").select("*").eq("user_id", userId);
    
    if (reminderId) {
      query = query.eq("id", reminderId);
    } else if (reminderText) {
      query = query.ilike("text", `%${reminderText}%`);
    } else {
      return { tool: "delete_reminder", success: false, error: "Either reminder_id or reminder_text is required" };
    }
    
    const { data: reminder, error: fetchError } = await query.single();
    if (fetchError || !reminder) {
      return { tool: "delete_reminder", success: false, error: "Reminder not found" };
    }

    await recordAction(userId, "update", "reminder", reminder.id, reminder, { ...reminder, status: "dismissed" });

    const { data, error } = await supabase.from("reminders").update({ status: "dismissed" }).eq("id", reminder.id).select().single();

    if (error) throw error;

    return {
      tool: "delete_reminder",
      success: true,
      data: { ...data, voiceText: `Dismissed reminder: "${reminder.text}".` },
    };
  } catch (error: any) {
    return {
      tool: "delete_reminder",
      success: false,
      error: error.message,
    };
  }
}

export async function executeUpdateReminder(
  userId: string,
  reminderId?: string,
  reminderText?: string,
  newText?: string,
  newDueTime?: string
): Promise<ActionResult> {
  try {
    let query = supabase.from("reminders").select("*").eq("user_id", userId);
    
    if (reminderId) {
      query = query.eq("id", reminderId);
    } else if (reminderText) {
      query = query.ilike("text", `%${reminderText}%`);
    } else {
      return { tool: "update_reminder", success: false, error: "Either reminder_id or reminder_text is required" };
    }
    
    const { data: reminder, error: fetchError } = await query.single();
    if (fetchError || !reminder) {
      return { tool: "update_reminder", success: false, error: "Reminder not found" };
    }

    const updates: any = {};
    if (newText) updates.text = newText;
    if (newDueTime) updates.due_time = newDueTime;

    if (Object.keys(updates).length === 0) {
      return { tool: "update_reminder", success: false, error: "No updates provided" };
    }

    const { data, error } = await supabase.from("reminders").update(updates).eq("id", reminder.id).select().single();

    if (error) throw error;

    await recordAction(userId, "update", "reminder", reminder.id, reminder, data);

    return {
      tool: "update_reminder",
      success: true,
      data: {
        reminder: data,
        voiceText: `Reminder updated successfully.`,
      },
    };
  } catch (error: any) {
    return {
      tool: "update_reminder",
      success: false,
      error: error.message,
    };
  }
}

export async function executeGetUpcomingReminders(
  userId: string,
  hours: number = 24
): Promise<ActionResult> {
  try {
    const now = new Date();
    const future = new Date(now.getTime() + hours * 60 * 60 * 1000);
    
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .gte("due_time", now.toISOString())
      .lte("due_time", future.toISOString())
      .order("due_time", { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        tool: "get_upcoming_reminders",
        success: true,
        data: {
          reminders: [],
          voiceText: `You have no reminders in the next ${hours} hours.`,
        },
      };
    }

    const voiceText = `You have ${data.length} reminder${data.length > 1 ? 's' : ''} coming up. ${data.slice(0, 3).map((r, i) => {
      const time = new Date(r.due_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      return `${i + 1}. "${r.text}" at ${time}`;
    }).join(". ")}`;

    return {
      tool: "get_upcoming_reminders",
      success: true,
      data: {
        reminders: data,
        voiceText,
      },
    };
  } catch (error: any) {
    return {
      tool: "get_upcoming_reminders",
      success: false,
      error: error.message,
    };
  }
}

export async function executeSnoozeReminder(
  userId: string,
  reminderId?: string,
  reminderText?: string,
  snoozeMinutes: number = 15
): Promise<ActionResult> {
  try {
    let query = supabase.from("reminders").select("*").eq("user_id", userId).eq("status", "pending");
    
    if (reminderId) {
      query = query.eq("id", reminderId);
    } else if (reminderText) {
      query = query.ilike("text", `%${reminderText}%`);
    } else {
      query = query.order("due_time", { ascending: true }).limit(1);
    }

    const { data: reminder, error: fetchError } = await query.single();
    if (fetchError || !reminder) {
      return { tool: "snooze_reminder", success: false, error: "Reminder not found" };
    }

    const newDueTime = new Date(new Date(reminder.due_time).getTime() + snoozeMinutes * 60 * 1000);

    const { data, error } = await supabase
      .from("reminders")
      .update({ due_time: newDueTime.toISOString() })
      .eq("id", reminder.id)
      .select()
      .single();

    if (error) throw error;

    await recordAction(userId, "update", "reminder", reminder.id, reminder, data);

    return {
      tool: "snooze_reminder",
      success: true,
      data: {
        reminder: data,
        voiceText: `Snoozed "${reminder.text}" for ${snoozeMinutes} minutes. It will remind you at ${newDueTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}.`,
      },
    };
  } catch (error: any) {
    return { tool: "snooze_reminder", success: false, error: error.message };
  }
}

export async function executeCreateRecurringReminder(
  userId: string,
  text: string,
  dueTime: string,
  recurrence: string,
  interval: number = 1
): Promise<ActionResult> {
  try {
    const recurrenceRule = {
      frequency: recurrence as any,
      interval,
    };
    
    const result = await createRecurringReminder(
      userId,
      text,
      new Date(dueTime),
      recurrenceRule
    );
    
    if (!result.success) {
      return { tool: "create_recurring_reminder", success: false, error: result.error };
    }
    
    const recurrenceText = recurrenceToString(recurrenceRule);
    return {
      tool: "create_recurring_reminder",
      success: true,
      data: {
        reminder: result.data,
        voiceText: `Created recurring reminder: "${text}", ${recurrenceText}`,
      },
    };
  } catch (error: any) {
    return { tool: "create_recurring_reminder", success: false, error: error.message };
  }
}