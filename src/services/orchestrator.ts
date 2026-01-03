import { supabase } from "@/integrations/supabase/client";
import { searchWeb, getWeather, findNearbyPlaces, geocodeAddress } from "./search";
import { getCurrentLocation } from "./location";

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

  return `You are Echo, a personal AI assistant. You are helpful, friendly, and proactive.

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

CAPABILITIES:
- Web searching for current information
- Getting weather (current conditions and forecasts)
- Finding nearby places (restaurants, gas stations, pharmacies, etc.)
- Managing reminders and alarms
- Creating and tracking tasks/to-dos
- Taking notes
- Managing calendar events
- Sending notifications
- Managing contacts
- Drafting emails and SMS messages
- Storing and retrieving personal knowledge/preferences

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

GUIDELINES:
1. Be proactive - if the user mentions a time/date, offer to create a reminder or event
2. Use location context when available for weather and nearby searches
3. For relative times ("tomorrow at 3pm"), calculate the actual ISO datetime
4. Keep responses concise but helpful
5. After using a tool, summarize what you did in natural language
6. If multiple tools are needed, use them one at a time
7. For drafting emails/SMS, create the draft and let the user know they can find it in Messages`;
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
    default:
      return { tool, success: false, error: `Unknown tool: ${tool}` };
  }
}