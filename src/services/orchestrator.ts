import { supabase } from "@/integrations/supabase/client";
import { searchWeb } from "./search";

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
    name: "web_search",
    description: "Search the web for current information, news, or any topic",
    parameters: { query: "string" },
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
];

// Tool execution functions
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

// Build system prompt with tools
export function buildSystemPrompt(): string {
  return `You are Echo, a personal AI assistant. You help the user with various tasks including:
- Web searching for information
- Managing reminders and alarms
- Creating and tracking tasks/to-dos
- Taking notes
- Managing calendar events
- Sending notifications

You have access to the following tools:
${AVAILABLE_TOOLS.map(t => `- ${t.name}: ${t.description}`).join("\n")}

When the user asks you to do something that requires a tool, respond with a JSON block like this:
\`\`\`json
{
  "tool": "tool_name",
  "parameters": { ... }
}
\`\`\`

After using a tool, provide a natural language response summarizing what you did.

Be helpful, concise, and proactive. If the user mentions a time, date, or deadline, offer to create a reminder or calendar event.
Current date/time: ${new Date().toISOString()}`;
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
    case "web_search":
      return executeWebSearch(parameters.query, userId);
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
    default:
      return { tool, success: false, error: `Unknown tool: ${tool}` };
  }
}