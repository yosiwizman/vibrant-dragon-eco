import { supabase } from "@/integrations/supabase/client";
import { searchWeb, getWeather, findNearbyPlaces, geocodeAddress } from "./search";
import { getCurrentLocation } from "./location";
import { getDailySummary, formatSummaryForVoice, getTasksReadout, getRemindersReadout, getNotesReadout, getCalendarReadout } from "./daily-summary";
import { findRouteByVoiceCommand, APP_ROUTES } from "./voice-navigation";

export interface OrchestrationContext {
  userId: string;
  userMessage: string;
  conversationHistory: { role: string; content: string }[];
}

export interface OrchestrationResult {
  response: string;
  actions: ActionResult[];
  toolsUsed: string[];
}

export interface ActionResult {
  tool: string;
  success: boolean;
  data?: any;
  error?: string;
}

// Tool definitions for the AI
export const AVAILABLE_TOOLS = [
  {
    name: "get_current_time",
    description: "Get the current date, time, and timezone information",
    parameters: {},
  },
  {
    name: "web_search",
    description: "Search the web for current information, news, or any topic",
    parameters: { query: "string" },
  },
  {
    name: "get_weather",
    description: "Get current weather for a location. If no location specified, uses user's current location.",
    parameters: { location: "string (optional, e.g., 'New York' or 'London, UK')" },
  },
  {
    name: "find_nearby",
    description: "Find nearby places like restaurants, gas stations, pharmacies, etc.",
    parameters: { query: "string (e.g., 'coffee shop', 'gas station', 'pharmacy')" },
  },
  {
    name: "create_reminder",
    description: "Create a reminder for a specific time",
    parameters: { text: "string", due_time: "ISO datetime string", channel: "push|sms|email" },
  },
  {
    name: "create_task",
    description: "Create a to-do task",
    parameters: { title: "string", description: "string", priority: "low|medium|high|urgent", due_date: "ISO datetime string" },
  },
  {
    name: "create_note",
    description: "Create a note or save information",
    parameters: { title: "string", content: "string", tags: "string[]" },
  },
  {
    name: "create_calendar_event",
    description: "Create a calendar event",
    parameters: { title: "string", start_time: "ISO datetime", end_time: "ISO datetime", location: "string", description: "string" },
  },
  {
    name: "get_reminders",
    description: "Get user's pending reminders",
    parameters: {},
  },
  {
    name: "get_tasks",
    description: "Get user's tasks",
    parameters: { status: "pending|completed|all" },
  },
  {
    name: "get_calendar",
    description: "Get calendar events for a date range",
    parameters: { start_date: "ISO date", end_date: "ISO date" },
  },
  {
    name: "send_notification",
    description: "Send a notification to the user",
    parameters: { title: "string", body: "string", type: "reminder|task|message|system" },
  },
  {
    name: "create_contact",
    description: "Add a new contact to the address book",
    parameters: { name: "string", phone: "string", notes: "string (optional)" },
  },
  {
    name: "get_contacts",
    description: "Get the user's contacts",
    parameters: { search: "string (optional)" },
  },
  {
    name: "complete_task",
    description: "Mark a task as completed",
    parameters: { task_id: "string", or: "task_title: string (to find by title)" },
  },
  {
    name: "delete_reminder",
    description: "Delete or dismiss a reminder",
    parameters: { reminder_id: "string", or: "reminder_text: string (to find by text)" },
  },
  {
    name: "draft_email",
    description: "Draft an email based on user's request",
    parameters: { prompt: "string (what the email should say)", to: "string (optional recipient)" },
  },
  {
    name: "draft_sms",
    description: "Draft a text message based on user's request",
    parameters: { prompt: "string (what the message should say)", to: "string (optional recipient name or number)" },
  },
  {
    name: "get_knowledge",
    description: "Retrieve stored knowledge/facts about the user",
    parameters: { category: "string (optional)", search: "string (optional)" },
  },
  {
    name: "add_knowledge",
    description: "Store a new fact or preference about the user",
    parameters: { category: "string", key: "string", value: "string" },
  },
  {
    name: "navigate_to",
    description: "Navigate to a page in the app. Use this when user says 'open', 'go to', 'show me' followed by a page name.",
    parameters: { page: "string (e.g., 'tasks', 'reminders', 'notes', 'calendar', 'contacts', 'messages', 'settings', 'home')" },
  },
  {
    name: "get_daily_summary",
    description: "Get a comprehensive summary of the user's day including tasks, reminders, calendar events, and notes",
    parameters: {},
  },
  {
    name: "read_tasks",
    description: "Read out the user's tasks in a voice-friendly format",
    parameters: { status: "pending|completed|all (default: pending)" },
  },
  {
    name: "read_reminders",
    description: "Read out the user's pending reminders in a voice-friendly format",
    parameters: {},
  },
  {
    name: "read_notes",
    description: "Read out the user's recent notes in a voice-friendly format",
    parameters: { limit: "number (default: 5)" },
  },
  {
    name: "read_calendar",
    description: "Read out upcoming calendar events in a voice-friendly format",
    parameters: { days: "number (default: 2)" },
  },
  {
    name: "reschedule_task",
    description: "Reschedule a task to a new date",
    parameters: { task_id: "string (optional)", task_title: "string (optional, to find by title)", new_due_date: "ISO datetime string" },
  },
  {
    name: "get_notes",
    description: "Get user's notes with optional search",
    parameters: { search: "string (optional)", limit: "number (default: 10)" },
  },
  {
    name: "update_task",
    description: "Update a task's title, description, or priority",
    parameters: { task_id: "string (optional)", task_title: "string (optional, to find by title)", new_title: "string (optional)", new_description: "string (optional)", new_priority: "low|medium|high|urgent (optional)" },
  },
  {
    name: "search_notes",
    description: "Search through notes by keyword",
    parameters: { query: "string" },
  },
  {
    name: "update_reminder",
    description: "Update a reminder's text or time",
    parameters: { reminder_id: "string (optional)", reminder_text: "string (optional, to find by text)", new_text: "string (optional)", new_due_time: "ISO datetime (optional)" },
  },
  {
    name: "get_overdue_tasks",
    description: "Get all overdue tasks",
    parameters: {},
  },
  {
    name: "get_upcoming_reminders",
    description: "Get reminders due in the next few hours",
    parameters: { hours: "number (default: 24)" },
  },
];

// Tool execution functions
export function executeGetCurrentTime(): ActionResult {
  const now = new Date();
  const timeInfo = {
    iso: now.toISOString(),
    local: now.toLocaleString(),
    date: now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    }),
    time: now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    }),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dayOfWeek: now.toLocaleDateString("en-US", { weekday: "long" }),
    hour: now.getHours(),
    minute: now.getMinutes(),
    isWeekend: now.getDay() === 0 || now.getDay() === 6,
  };

  return {
    tool: "get_current_time",
    success: true,
    data: timeInfo,
  };
}

export async function executeGetWeather(location?: string): Promise<ActionResult> {
  try {
    let lat: number, lon: number;
    let locationName = "your location";
    
    if (location) {
      const geocoded = await geocodeAddress(location);
      if (!geocoded) {
        return {
          tool: "get_weather",
          success: false,
          error: `Could not find location: ${location}`,
        };
      }
      lat = geocoded.lat;
      lon = geocoded.lon;
      locationName = location;
    } else {
      const currentLoc = await getCurrentLocation();
      lat = currentLoc.lat;
      lon = currentLoc.lng;
    }
    
    const weather = await getWeather(lat, lon);
    
    return {
      tool: "get_weather",
      success: true,
      data: {
        ...weather,
        location: locationName,
        summary: `${weather.description}, ${weather.temperature}°C (feels like ${weather.feelsLike}°C), humidity ${weather.humidity}%, wind ${weather.windSpeed} km/h`,
      },
    };
  } catch (error: any) {
    return {
      tool: "get_weather",
      success: false,
      error: error.message,
    };
  }
}

export async function executeFindNearby(query: string): Promise<ActionResult> {
  try {
    const currentLoc = await getCurrentLocation();
    const places = await findNearbyPlaces(query, currentLoc, 5);
    
    return {
      tool: "find_nearby",
      success: true,
      data: places.map(p => ({
        name: p.name.split(",")[0],
        distance: `${(p.distanceMeters / 1000).toFixed(1)} km`,
        fullAddress: p.name,
        type: p.type,
      })),
    };
  } catch (error: any) {
    return {
      tool: "find_nearby",
      success: false,
      error: error.message,
    };
  }
}

export async function executeWebSearch(query: string, userId: string): Promise<ActionResult> {
  try {
    const results = await searchWeb(query);
    
    // Log the search
    await supabase.from("web_logs").insert({
      user_id: userId,
      query,
      results_summary: results.map(r => r.title).join(", "),
      sources: results,
    });

    return {
      tool: "web_search",
      success: true,
      data: results,
    };
  } catch (error: any) {
    return {
      tool: "web_search",
      success: false,
      error: error.message,
    };
  }
}

export async function createReminder(
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

    return {
      tool: "create_reminder",
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      tool: "create_reminder",
      success: false,
      error: error.message,
    };
  }
}

export async function createTask(
  userId: string,
  title: string,
  description?: string,
  priority: string = "medium",
  dueDate?: string,
  tags?: string[]
): Promise<ActionResult> {
  try {
    const { data, error } = await supabase.from("tasks").insert({
      user_id: userId,
      title,
      description,
      priority,
      due_date: dueDate,
      tags,
      status: "pending",
    }).select().single();

    if (error) throw error;

    return {
      tool: "create_task",
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      tool: "create_task",
      success: false,
      error: error.message,
    };
  }
}

export async function createNote(
  userId: string,
  title: string,
  content: string,
  tags?: string[]
): Promise<ActionResult> {
  try {
    const { data, error } = await supabase.from("notes").insert({
      user_id: userId,
      title,
      content,
      tags,
    }).select().single();

    if (error) throw error;

    return {
      tool: "create_note",
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      tool: "create_note",
      success: false,
      error: error.message,
    };
  }
}

export async function createCalendarEvent(
  userId: string,
  title: string,
  startTime: string,
  endTime: string,
  location?: string,
  description?: string
): Promise<ActionResult> {
  try {
    const { data, error } = await supabase.from("calendar_events").insert({
      user_id: userId,
      title,
      start_time: startTime,
      end_time: endTime,
      location,
      description,
    }).select().single();

    if (error) throw error;

    return {
      tool: "create_calendar_event",
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      tool: "create_calendar_event",
      success: false,
      error: error.message,
    };
  }
}

export async function getReminders(userId: string): Promise<ActionResult> {
  try {
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("due_time", { ascending: true });

    if (error) throw error;

    return {
      tool: "get_reminders",
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      tool: "get_reminders",
      success: false,
      error: error.message,
    };
  }
}

export async function getTasks(userId: string, status: string = "all"): Promise<ActionResult> {
  try {
    let query = supabase.from("tasks").select("*").eq("user_id", userId);
    
    if (status !== "all") {
      query = query.eq("status", status);
    }
    
    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    return {
      tool: "get_tasks",
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      tool: "get_tasks",
      success: false,
      error: error.message,
    };
  }
}

export async function getCalendarEvents(
  userId: string,
  startDate: string,
  endDate: string
): Promise<ActionResult> {
  try {
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", userId)
      .gte("start_time", startDate)
      .lte("end_time", endDate)
      .order("start_time", { ascending: true });

    if (error) throw error;

    return {
      tool: "get_calendar",
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      tool: "get_calendar",
      success: false,
      error: error.message,
    };
  }
}

export async function sendNotification(
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
      data,
    };
  } catch (error: any) {
    return {
      tool: "send_notification",
      success: false,
      error: error.message,
    };
  }
}

export async function createContact(
  userId: string,
  name: string,
  phone: string,
  notes?: string
): Promise<ActionResult> {
  try {
    const { data, error } = await supabase.from("contacts").insert({
      user_id: userId,
      name,
      phone,
      notes: notes || null,
    }).select().single();

    if (error) throw error;

    return {
      tool: "create_contact",
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      tool: "create_contact",
      success: false,
      error: error.message,
    };
  }
}

export async function completeTask(
  userId: string,
  taskId?: string,
  taskTitle?: string
): Promise<ActionResult> {
  try {
    let query = supabase.from("tasks").update({
      status: "completed",
      completed_at: new Date().toISOString()
    }).eq("user_id", userId);
    
    if (taskId) {
      query = query.eq("id", taskId);
    } else if (taskTitle) {
      query = query.ilike("title", `%${taskTitle}%`);
    } else {
      throw new Error("Either task_id or task_title is required");
    }
    
    const { data, error } = await query.select().single();

    if (error) throw error;

    return {
      tool: "complete_task",
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      tool: "complete_task",
      success: false,
      error: error.message,
    };
  }
}

export async function deleteReminder(
  userId: string,
  reminderId?: string,
  reminderText?: string
): Promise<ActionResult> {
  try {
    let query = supabase.from("reminders").update({ status: "dismissed" }).eq("user_id", userId);
    
    if (reminderId) {
      query = query.eq("id", reminderId);
    } else if (reminderText) {
      query = query.ilike("text", `%${reminderText}%`);
    } else {
      throw new Error("Either reminder_id or reminder_text is required");
    }
    
    const { data, error } = await query.select().single();

    if (error) throw error;

    return {
      tool: "delete_reminder",
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      tool: "delete_reminder",
      success: false,
      error: error.message,
    };
  }
}

export async function getContacts(userId: string, search?: string): Promise<ActionResult> {
  try {
    let query = supabase.from("contacts").select("*").eq("user_id", userId);
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    
    const { data, error } = await query.order("name", { ascending: true });

    if (error) throw error;

    return {
      tool: "get_contacts",
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      tool: "get_contacts",
      success: false,
      error: error.message,
    };
  }
}

export async function executeDraftEmail(
  userId: string,
  prompt: string,
  to?: string
): Promise<ActionResult> {
  try {
    // Save a basic draft
    const { data, error } = await supabase.from("email_logs").insert({
      user_id: userId,
      direction: "outbound",
      status: "draft",
      to_email: to || "[recipient]",
      subject: "New Email",
      body: prompt,
    }).select().single();

    if (error) throw error;

    return {
      tool: "draft_email",
      success: true,
      data: {
        draft: data,
        message: `Email draft created. You can find it in Messages.`,
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

export async function getKnowledge(
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

    return {
      tool: "get_knowledge",
      success: true,
      data: data?.map(k => ({ category: k.category, key: k.key, value: k.value })) || [],
    };
  } catch (error: any) {
    return {
      tool: "get_knowledge",
      success: false,
      error: error.message,
    };
  }
}

export async function addKnowledge(
  userId: string,
  category: string,
  key: string,
  value: string
): Promise<ActionResult> {
  try {
    const { data, error } = await supabase.from("knowledge").insert({
      user_id: userId,
      category,
      key,
      value,
    }).select().single();

    if (error) throw error;

    return {
      tool: "add_knowledge",
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      tool: "add_knowledge",
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
        message: `SMS draft created. You can find it in Messages.`,
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

export function executeNavigateTo(page: string): ActionResult {
  const route = findRouteByVoiceCommand(page);
  
  if (route) {
    return {
      tool: "navigate_to",
      success: true,
      data: {
        path: route.path,
        description: route.description,
        message: `Navigating to ${route.description}`,
      },
    };
  }
  
  // Return available pages if not found
  const availablePages = APP_ROUTES.map(r => r.aliases[0]).join(", ");
  return {
    tool: "navigate_to",
    success: false,
    error: `Page "${page}" not found. Available pages: ${availablePages}`,
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

export async function executeRescheduleTask(
  userId: string,
  newDueDate: string,
  taskId?: string,
  taskTitle?: string
): Promise<ActionResult> {
  try {
    let query = supabase.from("tasks").update({
      due_date: newDueDate,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);
    
    if (taskId) {
      query = query.eq("id", taskId);
    } else if (taskTitle) {
      query = query.ilike("title", `%${taskTitle}%`);
    } else {
      throw new Error("Either task_id or task_title is required");
    }
    
    const { data, error } = await query.select().single();

    if (error) throw error;

    const newDate = new Date(newDueDate).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    return {
      tool: "reschedule_task",
      success: true,
      data: {
        task: data,
        message: `Task "${data.title}" rescheduled to ${newDate}`,
      },
    };
  } catch (error: any) {
    return {
      tool: "reschedule_task",
      success: false,
      error: error.message,
    };
  }
}

export async function executeGetNotes(
  userId: string,
  search?: string,
  limit: number = 10
): Promise<ActionResult> {
  try {
    let query = supabase.from("notes").select("*").eq("user_id", userId);
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }
    
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return {
      tool: "get_notes",
      success: true,
      data: data?.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content.substring(0, 200) + (n.content.length > 200 ? "..." : ""),
        tags: n.tags,
        created_at: n.created_at,
      })) || [],
    };
  } catch (error: any) {
    return {
      tool: "get_notes",
      success: false,
      error: error.message,
    };
  }
}

export async function executeUpdateTask(
  userId: string,
  taskId?: string,
  taskTitle?: string,
  newTitle?: string,
  newDescription?: string,
  newPriority?: string
): Promise<ActionResult> {
  try {
    const updates: any = { updated_at: new Date().toISOString() };
    if (newTitle) updates.title = newTitle;
    if (newDescription) updates.description = newDescription;
    if (newPriority) updates.priority = newPriority;

    if (Object.keys(updates).length === 1) {
      throw new Error("No updates provided");
    }

    let query = supabase.from("tasks").update(updates).eq("user_id", userId);
    
    if (taskId) {
      query = query.eq("id", taskId);
    } else if (taskTitle) {
      query = query.ilike("title", `%${taskTitle}%`);
    } else {
      throw new Error("Either task_id or task_title is required");
    }
    
    const { data, error } = await query.select().single();

    if (error) throw error;

    return {
      tool: "update_task",
      success: true,
      data: {
        task: data,
        message: `Task "${data.title}" updated successfully`,
      },
    };
  } catch (error: any) {
    return {
      tool: "update_task",
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

export async function executeUpdateReminder(
  userId: string,
  reminderId?: string,
  reminderText?: string,
  newText?: string,
  newDueTime?: string
): Promise<ActionResult> {
  try {
    const updates: any = {};
    if (newText) updates.text = newText;
    if (newDueTime) updates.due_time = newDueTime;

    if (Object.keys(updates).length === 0) {
      throw new Error("No updates provided");
    }

    let query = supabase.from("reminders").update(updates).eq("user_id", userId);
    
    if (reminderId) {
      query = query.eq("id", reminderId);
    } else if (reminderText) {
      query = query.ilike("text", `%${reminderText}%`);
    } else {
      throw new Error("Either reminder_id or reminder_text is required");
    }
    
    const { data, error } = await query.select().single();

    if (error) throw error;

    return {
      tool: "update_reminder",
      success: true,
      data: {
        reminder: data,
        message: `Reminder updated successfully`,
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

export async function executeGetOverdueTasks(userId: string): Promise<ActionResult> {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .lt("due_date", now)
      .order("due_date", { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        tool: "get_overdue_tasks",
        success: true,
        data: {
          tasks: [],
          voiceText: "Great news! You have no overdue tasks.",
        },
      };
    }

    const voiceText = `You have ${data.length} overdue task${data.length > 1 ? 's' : ''}. ${data.slice(0, 3).map((t, i) => `${i + 1}. ${t.title}`).join(". ")}`;

    return {
      tool: "get_overdue_tasks",
      success: true,
      data: {
        tasks: data,
        voiceText,
      },
    };
  } catch (error: any) {
    return {
      tool: "get_overdue_tasks",
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

// Build system prompt with tools
export function buildSystemPrompt(userLocation?: { lat: number; lng: number; city?: string }): string {
  const now = new Date();
  const timeInfo = {
    iso: now.toISOString(),
    local: now.toLocaleString(),
    date: now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dayOfWeek: now.toLocaleDateString("en-US", { weekday: "long" }),
    hour: now.getHours(),
  };

  const getTimeOfDay = () => {
    const hour = timeInfo.hour;
    if (hour < 6) return "night";
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    if (hour < 21) return "evening";
    return "night";
  };

  let locationContext = "";
  if (userLocation) {
    locationContext = `
USER LOCATION:
- Coordinates: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}
- City: ${userLocation.city || "Unknown"}
- You can use this for weather, nearby places, and local context without asking.`;
  } else {
    locationContext = `
USER LOCATION: Not available. If the user asks for weather or nearby places without specifying a location, ask them for their location or use the get_weather/find_nearby tools which will request permission.`;
  }

  return `You are Echo, a personal AI voice assistant. You are helpful, friendly, conversational, and proactive. You are designed for VOICE-FIRST interaction - keep responses concise and natural for spoken conversation.

CURRENT TIME & DATE:
- Date: ${timeInfo.date}
- Time: ${timeInfo.time} (${timeInfo.timezone})
- Day: ${timeInfo.dayOfWeek}
- Time of day: ${getTimeOfDay()}
- ISO: ${timeInfo.iso}

Use this time context naturally in conversations. For example:
- Greet appropriately ("Good morning!", "Good evening!")
- When creating reminders/events, understand relative times ("tomorrow", "next week", "in 2 hours")
- Be aware of business hours, weekends, etc.
${locationContext}

VOICE INTERACTION GUIDELINES:
1. Keep responses SHORT and conversational - this is voice, not text
2. Use natural speech patterns, contractions, and casual language
3. Avoid bullet points, numbered lists, or formatting - speak naturally
4. When reading lists (tasks, reminders, etc.), limit to 3-5 items unless asked for more
5. Confirm actions briefly: "Done!", "Got it!", "All set!"
6. Be tolerant of speech recognition errors - understand intent even with typos
7. For navigation requests, use navigate_to tool and confirm where you're going

CAPABILITIES:
- Navigate to any page in the app (tasks, reminders, notes, calendar, contacts, messages, settings, etc.)
- Read out tasks, reminders, notes, and calendar events
- Provide daily summaries of all activities
- Web searching for current information
- Getting weather (current conditions and forecasts)
- Finding nearby places (restaurants, gas stations, pharmacies, etc.)
- Managing reminders and alarms
- Creating and tracking tasks/to-dos
- Taking notes
- Managing calendar events
- Rescheduling tasks to new dates
- Sending notifications
- Managing contacts
- Drafting emails and SMS messages
- Storing and retrieving personal knowledge/preferences

NAVIGATION:
When user says "open", "go to", "show me", "take me to" followed by a page name, use the navigate_to tool.
Available pages: home, tasks, reminders, notes, calendar, contacts, messages, notifications, knowledge, tools, settings, profile, integrations, history, voice, chat

READING DATA:
- Use read_tasks to read tasks aloud
- Use read_reminders to read reminders aloud
- Use read_notes to read recent notes aloud
- Use read_calendar to read upcoming events aloud
- Use get_daily_summary for a comprehensive day overview

AVAILABLE TOOLS:
${AVAILABLE_TOOLS.map(t => `- ${t.name}: ${t.description}`).join("\n")}

TOOL USAGE:
When you need to use a tool, respond with a JSON block:
\`\`\`json
{
  "tool": "tool_name",
  "parameters": { ... }
}
\`\`\`

IMPORTANT GUIDELINES:
1. Be proactive - if the user mentions a time/date, offer to create a reminder or event
2. Use location context when available for weather and nearby searches
3. For relative times ("tomorrow at 3pm"), calculate the actual ISO datetime
4. Keep responses BRIEF for voice - 1-3 sentences max unless reading data
5. After using a tool, give a SHORT spoken confirmation
6. If multiple tools are needed, use them one at a time
7. For drafting emails/SMS, create the draft and briefly confirm
8. When user asks to "read" or "tell me" their tasks/reminders/notes, use the read_* tools
9. When user asks for a "summary" or "how's my day", use get_daily_summary
10. Understand common speech patterns: "to do" = "todo", "remind me" = create reminder, etc.`;
}

// Parse tool calls from AI response
export function parseToolCalls(response: string): { tool: string; parameters: any }[] {
  const toolCalls: { tool: string; parameters: any }[] = [];
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/g;
  
  let match;
  while ((match = jsonRegex.exec(response)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.tool) {
        toolCalls.push(parsed);
      }
    } catch (e) {
      // Invalid JSON, skip
    }
  }
  
  return toolCalls;
}

// Execute a tool call
export async function executeTool(
  userId: string,
  toolCall: { tool: string; parameters: any }
): Promise<ActionResult> {
  const { tool, parameters } = toolCall;
  
  switch (tool) {
    case "get_current_time":
      return executeGetCurrentTime();
    case "web_search":
      return executeWebSearch(parameters.query, userId);
    case "get_weather":
      return executeGetWeather(parameters.location);
    case "find_nearby":
      return executeFindNearby(parameters.query);
    case "create_reminder":
      return createReminder(userId, parameters.text, parameters.due_time, parameters.channel);
    case "create_task":
      return createTask(userId, parameters.title, parameters.description, parameters.priority, parameters.due_date, parameters.tags);
    case "create_note":
      return createNote(userId, parameters.title, parameters.content, parameters.tags);
    case "create_calendar_event":
      return createCalendarEvent(userId, parameters.title, parameters.start_time, parameters.end_time, parameters.location, parameters.description);
    case "get_reminders":
      return getReminders(userId);
    case "get_tasks":
      return getTasks(userId, parameters.status);
    case "get_calendar":
      return getCalendarEvents(userId, parameters.start_date, parameters.end_date);
    case "send_notification":
      return sendNotification(userId, parameters.title, parameters.body, parameters.type);
    case "create_contact":
      return createContact(userId, parameters.name, parameters.phone, parameters.notes);
    case "get_contacts":
      return getContacts(userId, parameters.search);
    case "complete_task":
      return completeTask(userId, parameters.task_id, parameters.task_title);
    case "delete_reminder":
      return deleteReminder(userId, parameters.reminder_id, parameters.reminder_text);
    case "draft_email":
      return executeDraftEmail(userId, parameters.prompt, parameters.to);
    case "draft_sms":
      return executeDraftSMS(userId, parameters.prompt, parameters.to);
    case "get_knowledge":
      return getKnowledge(userId, parameters.category, parameters.search);
    case "add_knowledge":
      return addKnowledge(userId, parameters.category, parameters.key, parameters.value);
    case "navigate_to":
      return executeNavigateTo(parameters.page);
    case "get_daily_summary":
      return executeGetDailySummary(userId);
    case "read_tasks":
      return executeReadTasks(userId, parameters.status);
    case "read_reminders":
      return executeReadReminders(userId);
    case "read_notes":
      return executeReadNotes(userId, parameters.limit);
    case "read_calendar":
      return executeReadCalendar(userId, parameters.days);
    case "reschedule_task":
      return executeRescheduleTask(userId, parameters.new_due_date, parameters.task_id, parameters.task_title);
    case "get_notes":
      return executeGetNotes(userId, parameters.search, parameters.limit);
    case "update_task":
      return executeUpdateTask(userId, parameters.task_id, parameters.task_title, parameters.new_title, parameters.new_description, parameters.new_priority);
    case "search_notes":
      return executeSearchNotes(userId, parameters.query);
    case "update_reminder":
      return executeUpdateReminder(userId, parameters.reminder_id, parameters.reminder_text, parameters.new_text, parameters.new_due_time);
    case "get_overdue_tasks":
      return executeGetOverdueTasks(userId);
    case "get_upcoming_reminders":
      return executeGetUpcomingReminders(userId, parameters.hours);
    default:
      return { tool, success: false, error: `Unknown tool: ${tool}` };
  }
}