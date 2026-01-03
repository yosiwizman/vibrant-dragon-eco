import { supabase } from "@/integrations/supabase/client";
import { searchWeb, getWeather, findNearbyPlaces, geocodeAddress } from "./search";
import { getCurrentLocation } from "./location";
import { getDailySummary, formatSummaryForVoice, getTasksReadout, getRemindersReadout, getNotesReadout, getCalendarReadout } from "./daily-summary";
import { findRouteByVoiceCommand, APP_ROUTES } from "./voice-navigation";
import { undoLastAction, recordAction } from "./action-history";
import { createRecurringReminder, createRecurringTask, getRecurringItems, cancelRecurringSeries } from "./recurrence";
import { searchKnowledge, addDocument, getKnowledgeContext } from "./rag-knowledge";
import { parseNaturalTime, recurrenceToString } from "./smart-time-parser";
import { checkScheduleConflicts, getSchedulingSuggestions, getDailyScheduleAnalysis, learnUserPatterns, createPatternBasedReminder } from "./smart-scheduling";
import { startListeningSession, endListeningSession, addTranscript, getSessionStatus, formatSummaryForVoice as formatListeningSummary, isEnterPhrase, isExitPhrase } from "./quiet-mode";

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
    name: "undo_last_action",
    description: "Undo the last action (create, update, delete) performed within the last 5 minutes",
    parameters: {},
  },
  {
    name: "create_recurring_reminder",
    description: "Create a reminder that repeats on a schedule",
    parameters: { text: "string", due_time: "ISO datetime", recurrence: "daily|weekly|biweekly|monthly|yearly", interval: "number (optional, default 1)" },
  },
  {
    name: "create_recurring_task",
    description: "Create a task that repeats on a schedule",
    parameters: { title: "string", due_date: "ISO datetime", recurrence: "daily|weekly|biweekly|monthly|yearly", interval: "number (optional, default 1)", priority: "low|medium|high|urgent" },
  },
  {
    name: "get_recurring_items",
    description: "Get all recurring tasks and reminders",
    parameters: {},
  },
  {
    name: "cancel_recurring_series",
    description: "Cancel all future occurrences of a recurring task or reminder",
    parameters: { item_type: "task|reminder", item_id: "string" },
  },
  {
    name: "search_knowledge_base",
    description: "Search the user's knowledge base and documents for relevant information",
    parameters: { query: "string", category: "string (optional)" },
  },
  {
    name: "add_to_knowledge_base",
    description: "Add new information or a document to the knowledge base",
    parameters: { title: "string", content: "string", category: "string (optional)", tags: "string[] (optional)" },
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
    name: "save_memory",
    description: "Save important information the user wants you to remember. Use when user says 'remember', 'save this', 'don't forget', etc.",
    parameters: { category: "string (e.g., 'personal', 'preferences', 'contacts', 'health', 'work')", key: "string (what to remember)", value: "string (the information)" },
  },
  {
    name: "get_memories",
    description: "Retrieve saved memories/information about the user",
    parameters: { category: "string (optional)", search: "string (optional)" },
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
  {
    name: "search_contacts",
    description: "Search for a contact by name or phone",
    parameters: { query: "string" },
  },
  {
    name: "call_contact",
    description: "Initiate a phone call to a contact",
    parameters: { contact_name: "string" },
  },
  {
    name: "send_message_to_contact",
    description: "Draft a message to a contact",
    parameters: { contact_name: "string", message: "string" },
  },
  {
    name: "create_appointment",
    description: "Create a new appointment or booking",
    parameters: { contact_name: "string (optional)", contact_phone: "string (optional)", start_time: "ISO datetime", end_time: "ISO datetime (optional)", notes: "string (optional)" },
  },
  {
    name: "get_appointments",
    description: "Get upcoming appointments",
    parameters: { days: "number (default: 7)" },
  },
  {
    name: "cancel_appointment",
    description: "Cancel an appointment",
    parameters: { appointment_id: "string (optional)", contact_name: "string (optional, to find by contact)" },
  },
  // Smart Scheduling Tools
  {
    name: "check_schedule_conflicts",
    description: "Check if a proposed time conflicts with existing events, tasks, or appointments. Use this BEFORE creating any scheduled item.",
    parameters: { start_time: "ISO datetime", end_time: "ISO datetime", title: "string", estimated_duration: "number (minutes, optional)" },
  },
  {
    name: "get_scheduling_suggestions",
    description: "Get AI-powered suggestions for the best time to schedule a task or event based on user's patterns and availability",
    parameters: { task_title: "string", estimated_duration: "number (minutes, default 30)", preferred_date: "ISO date (optional)" },
  },
  {
    name: "get_schedule_analysis",
    description: "Get a comprehensive analysis of the user's daily schedule including busy hours, free slots, and pattern-based alerts",
    parameters: {},
  },
  {
    name: "learn_user_patterns",
    description: "Analyze user's behavior patterns for scheduling optimization. Returns learned routines and preferences.",
    parameters: {},
  },
  {
    name: "create_pattern_reminder",
    description: "Create an automatic reminder based on a learned pattern (e.g., 'pick up daughter from school every Wednesday at 2pm')",
    parameters: { activity: "string", day_of_week: "number (0-6, Sunday-Saturday)", time: "HH:mm format", lead_time_minutes: "number (default 30)" },
  },
  // Quiet/Listening Mode Tools
  {
    name: "start_listening_mode",
    description: "Enter quiet/listening mode where the assistant only listens and records without interrupting. Use when user says 'go quiet', 'listening mode', 'just listen', 'meeting mode', etc.",
    parameters: { context: "string (optional, e.g., 'team meeting', 'doctor appointment')" },
  },
  {
    name: "end_listening_mode",
    description: "Exit quiet mode and get a summary of the recorded conversation. Use when user says 'summarize', 'what did you hear', 'end listening mode', etc.",
    parameters: {},
  },
  {
    name: "get_listening_status",
    description: "Check if listening mode is active and get current session info",
    parameters: {},
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

export async function executeSaveMemory(
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

export async function executeSearchContacts(
  userId: string,
  query: string
): Promise<ActionResult> {
  try {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", userId)
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
      .order("name", { ascending: true })
      .limit(10);

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        tool: "search_contacts",
        success: true,
        data: {
          contacts: [],
          voiceText: `I couldn't find any contacts matching "${query}".`,
        },
      };
    }

    const voiceText = `Found ${data.length} contact${data.length > 1 ? 's' : ''} matching "${query}". ${data.slice(0, 3).map((c, i) => `${i + 1}. ${c.name}`).join(". ")}`;

    return {
      tool: "search_contacts",
      success: true,
      data: {
        contacts: data,
        voiceText,
      },
    };
  } catch (error: any) {
    return {
      tool: "search_contacts",
      success: false,
      error: error.message,
    };
  }
}

export async function executeCallContact(
  userId: string,
  contactName: string
): Promise<ActionResult> {
  try {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", userId)
      .ilike("name", `%${contactName}%`)
      .limit(1)
      .single();

    if (error || !data) {
      return {
        tool: "call_contact",
        success: false,
        error: `Contact "${contactName}" not found`,
      };
    }

    return {
      tool: "call_contact",
      success: true,
      data: {
        contact: data,
        phoneUrl: `tel:${data.phone}`,
        voiceText: `Ready to call ${data.name} at ${data.phone}. Opening phone dialer.`,
      },
    };
  } catch (error: any) {
    return {
      tool: "call_contact",
      success: false,
      error: error.message,
    };
  }
}

export async function executeSendMessageToContact(
  userId: string,
  contactName: string,
  message: string
): Promise<ActionResult> {
  try {
    // Find the contact
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", userId)
      .ilike("name", `%${contactName}%`)
      .limit(1)
      .single();

    if (contactError || !contact) {
      return {
        tool: "send_message_to_contact",
        success: false,
        error: `Contact "${contactName}" not found`,
      };
    }

    // Create SMS draft
    const { data, error } = await supabase.from("sms_logs").insert({
      user_id: userId,
      direction: "outbound",
      status: "draft",
      to_number: contact.phone,
      text: message,
    }).select().single();

    if (error) throw error;

    return {
      tool: "send_message_to_contact",
      success: true,
      data: {
        draft: data,
        contact,
        voiceText: `Message draft created for ${contact.name}. You can review and send it from Messages.`,
      },
    };
  } catch (error: any) {
    return {
      tool: "send_message_to_contact",
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

// Appointment management functions
export async function executeCreateAppointment(
  userId: string,
  startTime: string,
  contactName?: string,
  contactPhone?: string,
  endTime?: string,
  notes?: string
): Promise<ActionResult> {
  try {
    const { data, error } = await supabase.from("appointments").insert({
      user_id: userId,
      contact_name: contactName || null,
      contact_phone: contactPhone || null,
      start_time: startTime,
      end_time: endTime || null,
      notes: notes || null,
      status: "scheduled",
      source: "voice",
    }).select().single();

    if (error) throw error;

    const appointmentDate = new Date(startTime).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const appointmentTime = new Date(startTime).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    return {
      tool: "create_appointment",
      success: true,
      data: {
        appointment: data,
        voiceText: `Appointment scheduled for ${appointmentDate} at ${appointmentTime}${contactName ? ` with ${contactName}` : ""}.`,
      },
    };
  } catch (error: any) {
    return { tool: "create_appointment", success: false, error: error.message };
  }
}

export async function executeGetAppointments(
  userId: string,
  days: number = 7
): Promise<ActionResult> {
  try {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", userId)
      .gte("start_time", now.toISOString())
      .lte("start_time", future.toISOString())
      .neq("status", "cancelled")
      .order("start_time", { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        tool: "get_appointments",
        success: true,
        data: {
          appointments: [],
          voiceText: `You have no appointments scheduled in the next ${days} days.`,
        },
      };
    }

    const voiceText = `You have ${data.length} appointment${data.length > 1 ? 's' : ''} coming up. ${data.slice(0, 3).map((a, i) => {
      const date = new Date(a.start_time);
      const dateStr = date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
      const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      return `${i + 1}. ${dateStr} at ${timeStr}${a.contact_name ? ` with ${a.contact_name}` : ""}`;
    }).join(". ")}`;

    return {
      tool: "get_appointments",
      success: true,
      data: { appointments: data, voiceText },
    };
  } catch (error: any) {
    return { tool: "get_appointments", success: false, error: error.message };
  }
}

export async function executeCancelAppointment(
  userId: string,
  appointmentId?: string,
  contactName?: string
): Promise<ActionResult> {
  try {
    let query = supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("user_id", userId);

    if (appointmentId) {
      query = query.eq("id", appointmentId);
    } else if (contactName) {
      query = query.ilike("contact_name", `%${contactName}%`);
    } else {
      throw new Error("Either appointment_id or contact_name is required");
    }

    const { data, error } = await query.select().single();

    if (error) throw error;

    return {
      tool: "cancel_appointment",
      success: true,
      data: {
        appointment: data,
        voiceText: `Appointment${data.contact_name ? ` with ${data.contact_name}` : ""} has been cancelled.`,
      },
    };
  } catch (error: any) {
    return { tool: "cancel_appointment", success: false, error: error.message };
  }
}

// Build system prompt with tools
export function buildSystemPrompt(userLocation?: { lat: number; lng: number; city?: string }, assistantName?: string, memoryContext?: string): string {
  const name = assistantName || "Echo";
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

  return `You are ${name}, a personal AI voice assistant. You are helpful, friendly, conversational, and proactive. You are designed for VOICE-FIRST interaction - keep responses concise and natural for spoken conversation.

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
${memoryContext || ""}

MEMORY COMMANDS:
When the user says "remember", "save this", "don't forget", or similar phrases, use the save_memory tool to store the information.
Examples:
- "Remember that my favorite color is blue" → save_memory with category="preferences", key="favorite color", value="blue"
- "Save this: my doctor's name is Dr. Smith" → save_memory with category="contacts", key="doctor's name", value="Dr. Smith"
- "Don't forget I'm allergic to peanuts" → save_memory with category="health", key="allergy", value="peanuts"

VOICE INTERACTION GUIDELINES:
1. Keep responses SHORT and conversational - this is voice, not text
2. Use natural speech patterns, contractions, and casual language
3. Avoid bullet points, numbered lists, or formatting - speak naturally
4. When reading lists (tasks, reminders, etc.), limit to 3-5 items unless asked for more
5. Confirm actions briefly: "Done!", "Got it!", "All set!"
6. Be tolerant of speech recognition errors - understand intent even with typos
7. For navigation requests, use navigate_to tool and confirm where you're going

CAPABILITIES:
- Navigate to any page in the app (tasks, reminders, notes, calendar, contacts, messages, appointments, settings, knowledge base, etc.)
- Create, view, and cancel appointments
- Read out tasks, reminders, notes, and calendar events
- Provide daily summaries of all activities
- Web searching for current information
- Getting weather (current conditions and forecasts)
- Finding nearby places (restaurants, gas stations, pharmacies, etc.)
- Managing reminders and alarms (including RECURRING reminders - daily, weekly, monthly)
- Creating and tracking tasks/to-dos (including RECURRING tasks)
- Taking notes
- Managing calendar events
- Rescheduling tasks to new dates
- Sending notifications
- Managing contacts
- Drafting emails and SMS messages
- Storing and retrieving personal knowledge/preferences
- UNDO last action (within 5 minutes)
- Search and query the user's KNOWLEDGE BASE (RAG documents)
- Add new information to the knowledge base
- SMART SCHEDULING: Detect conflicts, suggest optimal times, learn user patterns
- QUIET/LISTENING MODE: Listen silently during meetings and summarize later

RECURRING ITEMS:
When user says "every day", "daily", "every week", "weekly", "every Monday", "every month", etc., use the recurring tools:
- create_recurring_reminder for repeating reminders
- create_recurring_task for repeating tasks
- get_recurring_items to list all recurring items
- cancel_recurring_series to stop a recurring series

UNDO CAPABILITY:
When user says "undo", "undo that", "cancel the last thing", "revert", use undo_last_action.
Only works within 5 minutes of the original action.

KNOWLEDGE BASE (RAG):
When user asks about topics that might be in their knowledge base, use search_knowledge_base.
When user wants to save information for later, use add_to_knowledge_base.
The knowledge base contains documents the user has added, including technical guides and personal notes.

SMART SCHEDULING:
ALWAYS check for conflicts before creating events, tasks with due dates, or appointments:
1. Use check_schedule_conflicts FIRST when user wants to schedule something
2. If conflicts exist, inform the user and suggest alternatives
3. Use get_scheduling_suggestions to recommend optimal times based on learned patterns
4. Use learn_user_patterns to understand the user's routines
5. When user mentions recurring activities (e.g., "I pick up my daughter every Wednesday at 2pm"), use create_pattern_reminder to set up automatic reminders with lead time

Examples:
- "Schedule a meeting tomorrow at 2pm" → First check_schedule_conflicts, then create if clear
- "When should I do this task?" → Use get_scheduling_suggestions
- "Remember I pick up my daughter Wednesdays at 2pm" → Use create_pattern_reminder with day_of_week=3, time="14:00", lead_time=30

QUIET/LISTENING MODE:
When user wants you to just listen without interrupting (meetings, conversations, etc.):
1. Trigger phrases: "go quiet", "listening mode", "just listen", "don't interrupt", "meeting mode", "observe mode"
2. Use start_listening_mode to enter quiet mode
3. In quiet mode, you only record what you hear - NO responses or interruptions
4. Exit phrases: "echo wake up", "summarize", "what did you hear", "end listening mode"
5. Use end_listening_mode to get a summary with bullet points and action items

Example flow:
- User: "Echo, go quiet, I'm walking into a meeting"
- You: start_listening_mode with context="meeting"
- [User has meeting, you silently record]
- User: "Echo, summarize"
- You: end_listening_mode → provide summary, bullet points, action items

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

// New tool execution functions
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

export async function executeCreateRecurringTask(
  userId: string,
  title: string,
  dueDate: string,
  recurrence: string,
  interval: number = 1,
  priority: string = "medium"
): Promise<ActionResult> {
  try {
    const recurrenceRule = {
      frequency: recurrence as any,
      interval,
    };
    
    const result = await createRecurringTask(
      userId,
      title,
      undefined,
      new Date(dueDate),
      recurrenceRule,
      priority
    );
    
    if (!result.success) {
      return { tool: "create_recurring_task", success: false, error: result.error };
    }
    
    const recurrenceText = recurrenceToString(recurrenceRule);
    return {
      tool: "create_recurring_task",
      success: true,
      data: {
        task: result.data,
        voiceText: `Created recurring task: "${title}", ${recurrenceText}`,
      },
    };
  } catch (error: any) {
    return { tool: "create_recurring_task", success: false, error: error.message };
  }
}

export async function executeGetRecurringItems(userId: string): Promise<ActionResult> {
  try {
    const items = await getRecurringItems(userId);
    
    if (items.length === 0) {
      return {
        tool: "get_recurring_items",
        success: true,
        data: {
          items: [],
          voiceText: "You don't have any recurring tasks or reminders.",
        },
      };
    }
    
    const tasks = items.filter(i => i.type === "task");
    const reminders = items.filter(i => i.type === "reminder");
    
    let voiceText = `You have ${items.length} recurring item${items.length > 1 ? 's' : ''}. `;
    if (tasks.length > 0) {
      voiceText += `${tasks.length} recurring task${tasks.length > 1 ? 's' : ''}: ${tasks.slice(0, 3).map(t => t.title).join(", ")}. `;
    }
    if (reminders.length > 0) {
      voiceText += `${reminders.length} recurring reminder${reminders.length > 1 ? 's' : ''}: ${reminders.slice(0, 3).map(r => r.title).join(", ")}.`;
    }
    
    return {
      tool: "get_recurring_items",
      success: true,
      data: { items, voiceText },
    };
  } catch (error: any) {
    return { tool: "get_recurring_items", success: false, error: error.message };
  }
}

export async function executeCancelRecurringSeries(
  userId: string,
  itemType: "task" | "reminder",
  itemId: string
): Promise<ActionResult> {
  const result = await cancelRecurringSeries(userId, itemType, itemId);
  return {
    tool: "cancel_recurring_series",
    success: result.success,
    data: result.success ? {
      voiceText: `Cancelled the recurring ${itemType} series.`,
    } : undefined,
    error: result.error,
  };
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

// Smart Scheduling execution functions
export async function executeCheckScheduleConflicts(
  userId: string,
  startTime: string,
  endTime: string,
  title: string,
  estimatedDuration?: number
): Promise<ActionResult> {
  try {
    const conflicts = await checkScheduleConflicts(
      userId,
      new Date(startTime),
      new Date(endTime),
      title,
      estimatedDuration
    );

    if (conflicts.length === 0) {
      return {
        tool: "check_schedule_conflicts",
        success: true,
        data: {
          hasConflicts: false,
          conflicts: [],
          voiceText: "This time slot is available. No conflicts found.",
        },
      };
    }

    const conflictMessages = conflicts.map(c => c.message).join(" Also, ");
    const suggestions = conflicts.flatMap(c => c.suggestions).slice(0, 3);

    return {
      tool: "check_schedule_conflicts",
      success: true,
      data: {
        hasConflicts: true,
        conflicts,
        suggestions,
        voiceText: `I found some scheduling issues. ${conflictMessages}. ${suggestions.length > 0 ? `Alternative times: ${suggestions.join(", ")}` : ""}`,
      },
    };
  } catch (error: any) {
    return { tool: "check_schedule_conflicts", success: false, error: error.message };
  }
}

export async function executeGetSchedulingSuggestions(
  userId: string,
  taskTitle: string,
  estimatedDuration: number = 30,
  preferredDate?: string
): Promise<ActionResult> {
  try {
    const suggestions = await getSchedulingSuggestions(
      userId,
      taskTitle,
      estimatedDuration,
      preferredDate ? new Date(preferredDate) : undefined
    );

    if (suggestions.length === 0) {
      return {
        tool: "get_scheduling_suggestions",
        success: true,
        data: {
          suggestions: [],
          voiceText: "I don't have enough data yet to make scheduling suggestions. Keep using the app and I'll learn your patterns!",
        },
      };
    }

    const topSuggestions = suggestions.slice(0, 3);
    const voiceText = topSuggestions.map(s => s.message).join(" ");

    return {
      tool: "get_scheduling_suggestions",
      success: true,
      data: {
        suggestions: topSuggestions,
        voiceText,
      },
    };
  } catch (error: any) {
    return { tool: "get_scheduling_suggestions", success: false, error: error.message };
  }
}

export async function executeGetScheduleAnalysis(userId: string): Promise<ActionResult> {
  try {
    const analysis = await getDailyScheduleAnalysis(userId);

    let voiceText = `Today you have ${analysis.totalEvents} scheduled items taking about ${analysis.busyHours} hours. `;
    
    if (analysis.freeSlots.length > 0) {
      const freeSlot = analysis.freeSlots[0];
      const startTime = freeSlot.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      const endTime = freeSlot.end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      voiceText += `Your next free slot is from ${startTime} to ${endTime}. `;
    }

    if (analysis.patternAlerts.length > 0) {
      voiceText += analysis.patternAlerts.join(" ");
    }

    return {
      tool: "get_schedule_analysis",
      success: true,
      data: {
        ...analysis,
        voiceText,
      },
    };
  } catch (error: any) {
    return { tool: "get_schedule_analysis", success: false, error: error.message };
  }
}

export async function executeLearnUserPatterns(userId: string): Promise<ActionResult> {
  try {
    const patterns = await learnUserPatterns(userId);

    if (patterns.length === 0) {
      return {
        tool: "learn_user_patterns",
        success: true,
        data: {
          patterns: [],
          voiceText: "I haven't learned enough patterns yet. Keep using the app and I'll start recognizing your routines!",
        },
      };
    }

    const highConfidencePatterns = patterns.filter(p => p.confidence > 0.6);
    let voiceText = `I've learned ${patterns.length} patterns about your schedule. `;
    
    if (highConfidencePatterns.length > 0) {
      const examples = highConfidencePatterns.slice(0, 2).map(p =>
        `${p.activity} on ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][p.dayOfWeek || 0]}s at ${p.timeOfDay}`
      );
      voiceText += `For example: ${examples.join(", and ")}.`;
    }

    return {
      tool: "learn_user_patterns",
      success: true,
      data: {
        patterns,
        voiceText,
      },
    };
  } catch (error: any) {
    return { tool: "learn_user_patterns", success: false, error: error.message };
  }
}

export async function executeCreatePatternReminder(
  userId: string,
  activity: string,
  dayOfWeek: number,
  time: string,
  leadTimeMinutes: number = 30,
  openaiApiKey?: string
): Promise<ActionResult> {
  try {
    const pattern = {
      id: `manual-${Date.now()}`,
      userId,
      patternType: "recurring_activity" as const,
      dayOfWeek,
      timeOfDay: time,
      activity,
      confidence: 1,
      occurrences: 1,
      lastSeen: new Date(),
    };

    const result = await createPatternBasedReminder(userId, pattern, leadTimeMinutes);

    if (!result.success) {
      return { tool: "create_pattern_reminder", success: false, error: result.error };
    }

    const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek];

    return {
      tool: "create_pattern_reminder",
      success: true,
      data: {
        reminderId: result.reminderId,
        voiceText: `Got it! I'll remind you ${leadTimeMinutes} minutes before "${activity}" every ${dayName} at ${time}. I've also saved this pattern so I'll learn to remind you automatically.`,
      },
    };
  } catch (error: any) {
    return { tool: "create_pattern_reminder", success: false, error: error.message };
  }
}

// Quiet/Listening Mode execution functions
export async function executeStartListeningMode(
  userId: string,
  context?: string
): Promise<ActionResult> {
  try {
    const session = startListeningSession(userId, context);

    return {
      tool: "start_listening_mode",
      success: true,
      data: {
        sessionId: session.id,
        voiceText: `Entering listening mode${context ? ` for ${context}` : ""}. I'll stay quiet and just listen. Say "Echo, summarize" or "end listening mode" when you're done.`,
        isListeningMode: true,
      },
    };
  } catch (error: any) {
    return { tool: "start_listening_mode", success: false, error: error.message };
  }
}

export async function executeEndListeningMode(
  userId: string,
  openaiApiKey: string
): Promise<ActionResult> {
  try {
    const result = await endListeningSession(userId, openaiApiKey);

    if (!result.success) {
      return {
        tool: "end_listening_mode",
        success: false,
        error: result.error || "Failed to end listening session",
      };
    }

    let voiceText = result.summary || "No conversation was recorded.";
    
    if (result.bulletPoints && result.bulletPoints.length > 0) {
      voiceText += ` Key points: ${result.bulletPoints.slice(0, 3).join(". ")}.`;
    }
    
    if (result.actionItems && result.actionItems.length > 0) {
      voiceText += ` Action items: ${result.actionItems.join(". ")}.`;
    }

    if (result.duration) {
      voiceText = `After ${result.duration} minutes of listening, here's what I captured. ${voiceText}`;
    }

    return {
      tool: "end_listening_mode",
      success: true,
      data: {
        summary: result.summary,
        bulletPoints: result.bulletPoints,
        actionItems: result.actionItems,
        duration: result.duration,
        voiceText,
        isListeningMode: false,
      },
    };
  } catch (error: any) {
    return { tool: "end_listening_mode", success: false, error: error.message };
  }
}

export async function executeGetListeningStatus(userId: string): Promise<ActionResult> {
  try {
    const status = getSessionStatus(userId);

    if (!status.isActive) {
      return {
        tool: "get_listening_status",
        success: true,
        data: {
          isActive: false,
          voiceText: "Listening mode is not active. Say 'go quiet' or 'listening mode' to start.",
        },
      };
    }

    return {
      tool: "get_listening_status",
      success: true,
      data: {
        isActive: true,
        duration: status.duration,
        transcriptCount: status.transcriptCount,
        voiceText: `Listening mode has been active for ${status.duration} minutes. I've captured ${status.transcriptCount} segments so far. Say "summarize" when you're ready.`,
      },
    };
  } catch (error: any) {
    return { tool: "get_listening_status", success: false, error: error.message };
  }
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
    case "undo_last_action":
      return executeUndoLastAction(userId);
    case "create_recurring_reminder":
      return executeCreateRecurringReminder(userId, parameters.text, parameters.due_time, parameters.recurrence, parameters.interval);
    case "create_recurring_task":
      return executeCreateRecurringTask(userId, parameters.title, parameters.due_date, parameters.recurrence, parameters.interval, parameters.priority);
    case "get_recurring_items":
      return executeGetRecurringItems(userId);
    case "cancel_recurring_series":
      return executeCancelRecurringSeries(userId, parameters.item_type, parameters.item_id);
    case "search_knowledge_base":
      return executeSearchKnowledgeBase(userId, parameters.query, parameters.category);
    case "add_to_knowledge_base":
      return executeAddToKnowledgeBase(userId, parameters.title, parameters.content, parameters.category, parameters.tags);
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
    case "save_memory":
      return executeSaveMemory(userId, parameters.category, parameters.key, parameters.value);
    case "get_memories":
      return executeGetMemories(userId, parameters.category, parameters.search);
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
    case "search_contacts":
      return executeSearchContacts(userId, parameters.query);
    case "call_contact":
      return executeCallContact(userId, parameters.contact_name);
    case "send_message_to_contact":
      return executeSendMessageToContact(userId, parameters.contact_name, parameters.message);
    case "create_appointment":
      return executeCreateAppointment(userId, parameters.start_time, parameters.contact_name, parameters.contact_phone, parameters.end_time, parameters.notes);
    case "get_appointments":
      return executeGetAppointments(userId, parameters.days);
    case "cancel_appointment":
      return executeCancelAppointment(userId, parameters.appointment_id, parameters.contact_name);
    // Smart Scheduling tools
    case "check_schedule_conflicts":
      return executeCheckScheduleConflicts(userId, parameters.start_time, parameters.end_time, parameters.title, parameters.estimated_duration);
    case "get_scheduling_suggestions":
      return executeGetSchedulingSuggestions(userId, parameters.task_title, parameters.estimated_duration, parameters.preferred_date);
    case "get_schedule_analysis":
      return executeGetScheduleAnalysis(userId);
    case "learn_user_patterns":
      return executeLearnUserPatterns(userId);
    case "create_pattern_reminder":
      return executeCreatePatternReminder(userId, parameters.activity, parameters.day_of_week, parameters.time, parameters.lead_time_minutes);
    // Quiet/Listening Mode tools
    case "start_listening_mode":
      return executeStartListeningMode(userId, parameters.context);
    case "end_listening_mode":
      // Note: openaiApiKey needs to be passed from the calling context
      return executeEndListeningMode(userId, parameters.openai_api_key || "");
    case "get_listening_status":
      return executeGetListeningStatus(userId);
    default:
      return { tool, success: false, error: `Unknown tool: ${tool}` };
  }
}