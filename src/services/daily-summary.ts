import { supabase } from "@/integrations/supabase/client";

export interface DailySummary {
  date: string;
  tasks: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    items: Array<{ id: string; title: string; status: string; priority: string; due_date?: string }>;
  };
  reminders: {
    total: number;
    pending: number;
    completed: number;
    items: Array<{ id: string; text: string; due_time: string; status: string }>;
  };
  notes: {
    total: number;
    recentCount: number;
    items: Array<{ id: string; title: string; created_at: string }>;
  };
  calendar: {
    total: number;
    upcoming: number;
    items: Array<{ id: string; title: string; start_time: string; end_time: string; location?: string }>;
  };
  messages: {
    unread: number;
    drafts: number;
  };
  notifications: {
    unread: number;
  };
}

export async function getDailySummary(userId: string): Promise<DailySummary> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59).toISOString();

  // Fetch tasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("due_date", { ascending: true });

  const pendingTasks = tasks?.filter(t => t.status === "pending") || [];
  const completedTasks = tasks?.filter(t => t.status === "completed") || [];
  const overdueTasks = pendingTasks.filter(t => t.due_date && new Date(t.due_date) < now);

  // Fetch reminders
  const { data: reminders } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", userId)
    .order("due_time", { ascending: true });

  const pendingReminders = reminders?.filter(r => r.status === "pending") || [];

  // Fetch notes (recent ones from today)
  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", startOfDay)
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch all notes count
  const { count: totalNotes } = await supabase
    .from("notes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // Fetch calendar events for today and tomorrow
  const { data: events } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId)
    .gte("start_time", startOfDay)
    .lte("start_time", tomorrow)
    .order("start_time", { ascending: true });

  // Fetch unread notifications
  const { count: unreadNotifications } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  // Fetch email drafts
  const { count: emailDrafts } = await supabase
    .from("email_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "draft");

  // Fetch SMS drafts
  const { count: smsDrafts } = await supabase
    .from("sms_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "draft");

  return {
    date: now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    tasks: {
      total: tasks?.length || 0,
      completed: completedTasks.length,
      pending: pendingTasks.length,
      overdue: overdueTasks.length,
      items: pendingTasks.slice(0, 5).map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
      })),
    },
    reminders: {
      total: reminders?.length || 0,
      pending: pendingReminders.length,
      completed: (reminders?.length || 0) - pendingReminders.length,
      items: pendingReminders.slice(0, 5).map(r => ({
        id: r.id,
        text: r.text,
        due_time: r.due_time,
        status: r.status,
      })),
    },
    notes: {
      total: totalNotes || 0,
      recentCount: notes?.length || 0,
      items: (notes || []).map(n => ({
        id: n.id,
        title: n.title,
        created_at: n.created_at,
      })),
    },
    calendar: {
      total: events?.length || 0,
      upcoming: events?.filter(e => new Date(e.start_time) > now).length || 0,
      items: (events || []).map(e => ({
        id: e.id,
        title: e.title,
        start_time: e.start_time,
        end_time: e.end_time,
        location: e.location,
      })),
    },
    messages: {
      unread: 0, // Would need inbox integration
      drafts: (emailDrafts || 0) + (smsDrafts || 0),
    },
    notifications: {
      unread: unreadNotifications || 0,
    },
  };
}

export function formatSummaryForVoice(summary: DailySummary): string {
  const parts: string[] = [];
  
  parts.push(`Here's your summary for ${summary.date}.`);
  
  // Tasks
  if (summary.tasks.pending > 0) {
    parts.push(`You have ${summary.tasks.pending} pending task${summary.tasks.pending > 1 ? 's' : ''}.`);
    if (summary.tasks.overdue > 0) {
      parts.push(`${summary.tasks.overdue} ${summary.tasks.overdue > 1 ? 'are' : 'is'} overdue.`);
    }
    if (summary.tasks.items.length > 0) {
      const topTasks = summary.tasks.items.slice(0, 3).map(t => t.title).join(", ");
      parts.push(`Top tasks: ${topTasks}.`);
    }
  } else {
    parts.push("You have no pending tasks. Great job!");
  }
  
  // Reminders
  if (summary.reminders.pending > 0) {
    parts.push(`You have ${summary.reminders.pending} pending reminder${summary.reminders.pending > 1 ? 's' : ''}.`);
    if (summary.reminders.items.length > 0) {
      const nextReminder = summary.reminders.items[0];
      const reminderTime = new Date(nextReminder.due_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      parts.push(`Next reminder: "${nextReminder.text}" at ${reminderTime}.`);
    }
  }
  
  // Calendar
  if (summary.calendar.total > 0) {
    parts.push(`You have ${summary.calendar.total} event${summary.calendar.total > 1 ? 's' : ''} today and tomorrow.`);
    if (summary.calendar.items.length > 0) {
      const nextEvent = summary.calendar.items[0];
      const eventTime = new Date(nextEvent.start_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      parts.push(`Next: "${nextEvent.title}" at ${eventTime}${nextEvent.location ? ` at ${nextEvent.location}` : ''}.`);
    }
  } else {
    parts.push("Your calendar is clear for today and tomorrow.");
  }
  
  // Notes
  if (summary.notes.recentCount > 0) {
    parts.push(`You created ${summary.notes.recentCount} note${summary.notes.recentCount > 1 ? 's' : ''} today.`);
  }
  
  // Notifications
  if (summary.notifications.unread > 0) {
    parts.push(`You have ${summary.notifications.unread} unread notification${summary.notifications.unread > 1 ? 's' : ''}.`);
  }
  
  // Drafts
  if (summary.messages.drafts > 0) {
    parts.push(`You have ${summary.messages.drafts} message draft${summary.messages.drafts > 1 ? 's' : ''} waiting to be sent.`);
  }
  
  return parts.join(" ");
}

export async function getTasksReadout(userId: string, status: string = "pending"): Promise<string> {
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("status", status === "all" ? undefined : status)
    .order("priority", { ascending: false })
    .order("due_date", { ascending: true })
    .limit(10);

  if (!tasks || tasks.length === 0) {
    return status === "pending" 
      ? "You have no pending tasks. Your to-do list is clear!"
      : `You have no ${status} tasks.`;
  }

  const taskList = tasks.map((t, i) => {
    let desc = `${i + 1}. ${t.title}`;
    if (t.priority === "urgent" || t.priority === "high") {
      desc += ` (${t.priority} priority)`;
    }
    if (t.due_date) {
      const due = new Date(t.due_date);
      const isOverdue = due < new Date();
      desc += isOverdue ? " - overdue" : ` - due ${due.toLocaleDateString()}`;
    }
    return desc;
  }).join(". ");

  return `You have ${tasks.length} ${status} task${tasks.length > 1 ? 's' : ''}. ${taskList}`;
}

export async function getRemindersReadout(userId: string): Promise<string> {
  const { data: reminders } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("due_time", { ascending: true })
    .limit(10);

  if (!reminders || reminders.length === 0) {
    return "You have no pending reminders.";
  }

  const reminderList = reminders.map((r, i) => {
    const time = new Date(r.due_time).toLocaleString("en-US", { 
      weekday: "short", 
      hour: "numeric", 
      minute: "2-digit" 
    });
    return `${i + 1}. ${r.text} at ${time}`;
  }).join(". ");

  return `You have ${reminders.length} pending reminder${reminders.length > 1 ? 's' : ''}. ${reminderList}`;
}

export async function getNotesReadout(userId: string, limit: number = 5): Promise<string> {
  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!notes || notes.length === 0) {
    return "You have no notes yet.";
  }

  const noteList = notes.map((n, i) => {
    const preview = n.content.length > 50 ? n.content.substring(0, 50) + "..." : n.content;
    return `${i + 1}. "${n.title}": ${preview}`;
  }).join(". ");

  return `Here are your ${notes.length} most recent note${notes.length > 1 ? 's' : ''}. ${noteList}`;
}

export async function getCalendarReadout(userId: string, days: number = 2): Promise<string> {
  const now = new Date();
  const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const { data: events } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId)
    .gte("start_time", now.toISOString())
    .lte("start_time", endDate.toISOString())
    .order("start_time", { ascending: true })
    .limit(10);

  if (!events || events.length === 0) {
    return `You have no events scheduled for the next ${days} day${days > 1 ? 's' : ''}.`;
  }

  const eventList = events.map((e, i) => {
    const start = new Date(e.start_time);
    const timeStr = start.toLocaleString("en-US", { 
      weekday: "short", 
      hour: "numeric", 
      minute: "2-digit" 
    });
    let desc = `${i + 1}. ${e.title} on ${timeStr}`;
    if (e.location) desc += ` at ${e.location}`;
    return desc;
  }).join(". ");

  return `You have ${events.length} upcoming event${events.length > 1 ? 's' : ''}. ${eventList}`;
}