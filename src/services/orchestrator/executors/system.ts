import { supabase } from "@/integrations/supabase/client";
import { ActionResult } from '../types';
import { undoLastAction } from "@/services/action-history";
import { getDailySummary, formatSummaryForVoice, getTasksReadout, getRemindersReadout, getNotesReadout, getCalendarReadout } from "@/services/daily-summary";

export async function executeGetSystemStatus(userId: string): Promise<ActionResult> {
  try {
    const [
      { count: taskCount },
      { count: pendingTaskCount },
      { count: reminderCount },
      { count: noteCount },
      { count: contactCount },
      { count: notificationCount },
      { count: appointmentCount },
    ] = await Promise.all([
      supabase.from("tasks").select("*", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("tasks").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "pending"),
      supabase.from("reminders").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "pending"),
      supabase.from("notes").select("*", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("read", false),
      supabase.from("appointments").select("*", { count: "exact", head: true }).eq("user_id", userId).neq("status", "cancelled"),
    ]);

    const status = {
      tasks: { total: taskCount || 0, pending: pendingTaskCount || 0 },
      reminders: { pending: reminderCount || 0 },
      notes: { total: noteCount || 0 },
      contacts: { total: contactCount || 0 },
      notifications: { unread: notificationCount || 0 },
      appointments: { upcoming: appointmentCount || 0 },
    };

    return {
      tool: "get_system_status",
      success: true,
      data: {
        ...status,
        voiceText: `You have ${pendingTaskCount || 0} pending tasks, ${reminderCount || 0} reminders, ${noteCount || 0} notes, and ${notificationCount || 0} unread notifications.`,
      },
    };
  } catch (error: any) {
    return { tool: "get_system_status", success: false, error: error.message };
  }
}

export async function executeGetProductivityStats(userId: string, days: number = 7): Promise<ActionResult> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: completedTasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("completed_at", startDate.toISOString());

    const { data: allTasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString());

    const completionRate = allTasks?.length ? ((completedTasks?.length || 0) / allTasks.length * 100).toFixed(1) : 0;

    // Calculate streak
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dayStart = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const { count } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("completed_at", dayStart.toISOString())
        .lt("completed_at", dayEnd.toISOString());

      if (count && count > 0) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    const stats = {
      period: `${days} days`,
      tasksCompleted: completedTasks?.length || 0,
      tasksCreated: allTasks?.length || 0,
      completionRate: `${completionRate}%`,
      currentStreak: streak,
    };

    return {
      tool: "get_productivity_stats",
      success: true,
      data: {
        ...stats,
        voiceText: `In the last ${days} days, you completed ${stats.tasksCompleted} tasks with a ${completionRate}% completion rate. Your current streak is ${streak} day${streak !== 1 ? 's' : ''}.`,
      },
    };
  } catch (error: any) {
    return { tool: "get_productivity_stats", success: false, error: error.message };
  }
}

export async function executeUndoLastAction(userId: string): Promise<ActionResult> {
  const result = await undoLastAction(userId);
  return {
    tool: "undo_last_action",
    success: result.success,
    data: result.success ? {
      message: result.message,
      voiceText: result.message,
    } : undefined,
    error: result.success ? undefined : result.message,
  };
}

export async function executeGetDailySummary(userId: string): Promise<ActionResult> {
  try {
    const summary = await getDailySummary(userId);
    const voiceText = formatSummaryForVoice(summary);
    
    return {
      tool: "get_daily_summary",
      success: true,
      data: {
        summary,
        voiceText,
      },
    };
  } catch (error: any) {
    return {
      tool: "get_daily_summary",
      success: false,
      error: error.message,
    };
  }
}

export async function executeReadTasks(userId: string, status: string = "pending"): Promise<ActionResult> {
  try {
    const readout = await getTasksReadout(userId, status);
    
    return {
      tool: "read_tasks",
      success: true,
      data: {
        voiceText: readout,
      },
    };
  } catch (error: any) {
    return {
      tool: "read_tasks",
      success: false,
      error: error.message,
    };
  }
}

export async function executeReadReminders(userId: string): Promise<ActionResult> {
  try {
    const readout = await getRemindersReadout(userId);
    
    return {
      tool: "read_reminders",
      success: true,
      data: {
        voiceText: readout,
      },
    };
  } catch (error: any) {
    return {
      tool: "read_reminders",
      success: false,
      error: error.message,
    };
  }
}

export async function executeReadNotes(userId: string, limit: number = 5): Promise<ActionResult> {
  try {
    const readout = await getNotesReadout(userId, limit);
    
    return {
      tool: "read_notes",
      success: true,
      data: {
        voiceText: readout,
      },
    };
  } catch (error: any) {
    return {
      tool: "read_notes",
      success: false,
      error: error.message,
    };
  }
}

export async function executeReadCalendar(userId: string, days: number = 2): Promise<ActionResult> {
  try {
    const readout = await getCalendarReadout(userId, days);
    
    return {
      tool: "read_calendar",
      success: true,
      data: {
        voiceText: readout,
      },
    };
  } catch (error: any) {
    return {
      tool: "read_calendar",
      success: false,
      error: error.message,
    };
  }
}