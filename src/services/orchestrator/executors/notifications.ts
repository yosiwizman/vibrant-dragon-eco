import { supabase } from "@/integrations/supabase/client";
import { ActionResult } from '../types';

export async function executeSendNotification(
  userId: string,
  title: string,
  body: string,
  type: string = "system"
): Promise<ActionResult> {
  try {
    const { data, error } = await supabase.from("notifications").insert({
      user_id: userId,
      title,
      body,
      type,
      read: false,
    }).select().single();

    if (error) throw error;

    return {
      tool: "send_notification",
      success: true,
      data: { ...data, voiceText: `Notification sent: "${title}".` },
    };
  } catch (error: any) {
    return {
      tool: "send_notification",
      success: false,
      error: error.message,
    };
  }
}

export async function executeGetNotifications(
  userId: string,
  unreadOnly: boolean = false,
  limit: number = 20
): Promise<ActionResult> {
  try {
    let query = supabase.from("notifications").select("*").eq("user_id", userId);
    
    if (unreadOnly) {
      query = query.eq("read", false);
    }
    
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const unreadCount = data?.filter(n => !n.read).length || 0;
    const voiceText = unreadCount > 0
      ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}.`
      : "You have no unread notifications.";

    return {
      tool: "get_notifications",
      success: true,
      data: { notifications: data, unreadCount, voiceText },
    };
  } catch (error: any) {
    return { tool: "get_notifications", success: false, error: error.message };
  }
}

export async function executeMarkNotificationRead(
  userId: string,
  notificationId?: string,
  markAll: boolean = false
): Promise<ActionResult> {
  try {
    if (markAll) {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false);

      if (error) throw error;

      return {
        tool: "mark_notification_read",
        success: true,
        data: { voiceText: "All notifications marked as read." },
      };
    }

    if (!notificationId) {
      return { tool: "mark_notification_read", success: false, error: "notification_id is required" };
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) throw error;

    return {
      tool: "mark_notification_read",
      success: true,
      data: { voiceText: "Notification marked as read." },
    };
  } catch (error: any) {
    return { tool: "mark_notification_read", success: false, error: error.message };
  }
}

export async function executeClearNotifications(userId: string): Promise<ActionResult> {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId)
      .eq("read", true);

    if (error) throw error;

    return {
      tool: "clear_notifications",
      success: true,
      data: { voiceText: "Cleared all read notifications." },
    };
  } catch (error: any) {
    return { tool: "clear_notifications", success: false, error: error.message };
  }
}