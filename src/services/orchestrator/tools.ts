import { ToolDefinition } from './types';

// Tool definitions for the AI
export const AVAILABLE_TOOLS: ToolDefinition[] = [
  // Time
  {
    name: "get_current_time",
    description: "Get the current date, time, and timezone information",
    parameters: {},
    category: "time",
  },
  // System
  {
    name: "undo_last_action",
    description: "Undo the last action (create, update, delete) performed within the last 5 minutes",
    parameters: {},
    category: "system",
  },
  {
    name: "get_system_status",
    description: "Get overall system status including counts of tasks, reminders, notes, and other items",
    parameters: {},
    category: "system",
  },
  {
    name: "get_productivity_stats",
    description: "Get productivity statistics including completion rates, streaks, and patterns",
    parameters: { days: "number (default: 7)" },
    category: "system",
  },
  // Recurring
  {
    name: "create_recurring_reminder",
    description: "Create a reminder that repeats on a schedule",
    parameters: { text: "string", due_time: "ISO datetime", recurrence: "daily|weekly|biweekly|monthly|yearly", interval: "number (optional, default 1)" },
    category: "recurring",
  },
  {
    name: "create_recurring_task",
    description: "Create a task that repeats on a schedule",
    parameters: { title: "string", due_date: "ISO datetime", recurrence: "daily|weekly|biweekly|monthly|yearly", interval: "number (optional, default 1)", priority: "low|medium|high|urgent" },
    category: "recurring",
  },
  {
    name: "get_recurring_items",
    description: "Get all recurring tasks and reminders",
    parameters: {},
    category: "recurring",
  },
  {
    name: "cancel_recurring_series",
    description: "Cancel all future occurrences of a recurring task or reminder",
    parameters: { item_type: "task|reminder", item_id: "string" },
    category: "recurring",
  },
  // Knowledge
  {
    name: "search_knowledge_base",
    description: "Search the user's knowledge base and documents for relevant information",
    parameters: { query: "string", category: "string (optional)" },
    category: "knowledge",
  },
  {
    name: "add_to_knowledge_base",
    description: "Add new information or a document to the knowledge base",
    parameters: { title: "string", content: "string", category: "string (optional)", tags: "string[] (optional)" },
    category: "knowledge",
  },
  // Search
  {
    name: "web_search",
    description: "Search the web for current information, news, or any topic",
    parameters: { query: "string" },
    category: "search",
  },
  {
    name: "get_weather",
    description: "Get current weather for a location. If no location specified, uses user's current location.",
    parameters: { location: "string (optional, e.g., 'New York' or 'London, UK')" },
    category: "search",
  },
  {
    name: "find_nearby",
    description: "Find nearby places like restaurants, gas stations, pharmacies, etc.",
    parameters: { query: "string (e.g., 'coffee shop', 'gas station', 'pharmacy')" },
    category: "search",
  },
  // Reminders
  {
    name: "create_reminder",
    description: "Create a reminder for a specific time",
    parameters: { text: "string", due_time: "ISO datetime string", channel: "push|sms|email" },
    category: "reminders",
  },
  {
    name: "get_reminders",
    description: "Get user's pending reminders",
    parameters: { status: "pending|completed|all (default: pending)" },
    category: "reminders",
  },
  {
    name: "delete_reminder",
    description: "Delete or dismiss a reminder",
    parameters: { reminder_id: "string", or: "reminder_text: string (to find by text)" },
    category: "reminders",
  },
  {
    name: "update_reminder",
    description: "Update a reminder's text or time",
    parameters: { reminder_id: "string (optional)", reminder_text: "string (optional, to find by text)", new_text: "string (optional)", new_due_time: "ISO datetime (optional)" },
    category: "reminders",
  },
  {
    name: "get_upcoming_reminders",
    description: "Get reminders due in the next few hours",
    parameters: { hours: "number (default: 24)" },
    category: "reminders",
  },
  {
    name: "snooze_reminder",
    description: "Snooze a reminder for a specified duration",
    parameters: { reminder_id: "string (optional)", reminder_text: "string (optional)", snooze_minutes: "number (default: 15)" },
    category: "reminders",
  },
  // Tasks
  {
    name: "create_task",
    description: "Create a to-do task",
    parameters: { title: "string", description: "string", priority: "low|medium|high|urgent", due_date: "ISO datetime string", tags: "string[] (optional)" },
    category: "tasks",
  },
  {
    name: "get_tasks",
    description: "Get user's tasks",
    parameters: { status: "pending|completed|all", priority: "low|medium|high|urgent (optional)", limit: "number (optional)" },
    category: "tasks",
  },
  {
    name: "complete_task",
    description: "Mark a task as completed",
    parameters: { task_id: "string", or: "task_title: string (to find by title)" },
    category: "tasks",
  },
  {
    name: "update_task",
    description: "Update a task's title, description, or priority",
    parameters: { task_id: "string (optional)", task_title: "string (optional, to find by title)", new_title: "string (optional)", new_description: "string (optional)", new_priority: "low|medium|high|urgent (optional)" },
    category: "tasks",
  },
  {
    name: "reschedule_task",
    description: "Reschedule a task to a new date",
    parameters: { task_id: "string (optional)", task_title: "string (optional, to find by title)", new_due_date: "ISO datetime string" },
    category: "tasks",
  },
  {
    name: "get_overdue_tasks",
    description: "Get all overdue tasks",
    parameters: {},
    category: "tasks",
  },
  {
    name: "delete_task",
    description: "Delete a task permanently",
    parameters: { task_id: "string (optional)", task_title: "string (optional, to find by title)" },
    category: "tasks",
  },
  {
    name: "get_task_stats",
    description: "Get task statistics including completion rate and priority breakdown",
    parameters: { days: "number (default: 7)" },
    category: "tasks",
  },
  // Notes
  {
    name: "create_note",
    description: "Create a note or save information",
    parameters: { title: "string", content: "string", tags: "string[]", pinned: "boolean (optional)" },
    category: "notes",
  },
  {
    name: "get_notes",
    description: "Get user's notes with optional search",
    parameters: { search: "string (optional)", limit: "number (default: 10)", pinned_only: "boolean (optional)" },
    category: "notes",
  },
  {
    name: "search_notes",
    description: "Search through notes by keyword",
    parameters: { query: "string" },
    category: "notes",
  },
  {
    name: "update_note",
    description: "Update a note's title, content, or tags",
    parameters: { note_id: "string (optional)", note_title: "string (optional)", new_title: "string (optional)", new_content: "string (optional)", new_tags: "string[] (optional)" },
    category: "notes",
  },
  {
    name: "delete_note",
    description: "Delete a note",
    parameters: { note_id: "string (optional)", note_title: "string (optional)" },
    category: "notes",
  },
  {
    name: "pin_note",
    description: "Pin or unpin a note",
    parameters: { note_id: "string (optional)", note_title: "string (optional)", pinned: "boolean" },
    category: "notes",
  },
  // Calendar
  {
    name: "create_calendar_event",
    description: "Create a calendar event",
    parameters: { title: "string", start_time: "ISO datetime", end_time: "ISO datetime", location: "string", description: "string", attendees: "string[] (optional)" },
    category: "calendar",
  },
  {
    name: "get_calendar",
    description: "Get calendar events for a date range",
    parameters: { start_date: "ISO date", end_date: "ISO date" },
    category: "calendar",
  },
  {
    name: "update_calendar_event",
    description: "Update a calendar event",
    parameters: { event_id: "string (optional)", event_title: "string (optional)", new_title: "string (optional)", new_start_time: "ISO datetime (optional)", new_end_time: "ISO datetime (optional)", new_location: "string (optional)" },
    category: "calendar",
  },
  {
    name: "delete_calendar_event",
    description: "Delete a calendar event",
    parameters: { event_id: "string (optional)", event_title: "string (optional)" },
    category: "calendar",
  },
  // Notifications
  {
    name: "send_notification",
    description: "Send a notification to the user",
    parameters: { title: "string", body: "string", type: "reminder|task|message|system" },
    category: "notifications",
  },
  {
    name: "get_notifications",
    description: "Get user's notifications",
    parameters: { unread_only: "boolean (default: false)", limit: "number (default: 20)" },
    category: "notifications",
  },
  {
    name: "mark_notification_read",
    description: "Mark a notification as read",
    parameters: { notification_id: "string", or: "mark_all: boolean" },
    category: "notifications",
  },
  {
    name: "clear_notifications",
    description: "Clear all read notifications",
    parameters: {},
    category: "notifications",
  },
  // Contacts
  {
    name: "create_contact",
    description: "Add a new contact to the address book",
    parameters: { name: "string", phone: "string", email: "string (optional)", notes: "string (optional)" },
    category: "contacts",
  },
  {
    name: "get_contacts",
    description: "Get the user's contacts",
    parameters: { search: "string (optional)", limit: "number (optional)" },
    category: "contacts",
  },
  {
    name: "search_contacts",
    description: "Search for a contact by name or phone",
    parameters: { query: "string" },
    category: "contacts",
  },
  {
    name: "update_contact",
    description: "Update a contact's information",
    parameters: { contact_id: "string (optional)", contact_name: "string (optional)", new_name: "string (optional)", new_phone: "string (optional)", new_email: "string (optional)", new_notes: "string (optional)" },
    category: "contacts",
  },
  {
    name: "delete_contact",
    description: "Delete a contact",
    parameters: { contact_id: "string (optional)", contact_name: "string (optional)" },
    category: "contacts",
  },
  {
    name: "call_contact",
    description: "Initiate a phone call to a contact",
    parameters: { contact_name: "string" },
    category: "contacts",
  },
  {
    name: "send_message_to_contact",
    description: "Draft a message to a contact",
    parameters: { contact_name: "string", message: "string" },
    category: "contacts",
  },
  // Messages
  {
    name: "draft_email",
    description: "Draft an email based on user's request",
    parameters: { prompt: "string (what the email should say)", to: "string (optional recipient)", subject: "string (optional)" },
    category: "messages",
  },
  {
    name: "draft_sms",
    description: "Draft a text message based on user's request",
    parameters: { prompt: "string (what the message should say)", to: "string (optional recipient name or number)" },
    category: "messages",
  },
  {
    name: "get_drafts",
    description: "Get all message drafts (email and SMS)",
    parameters: { type: "email|sms|all (default: all)" },
    category: "messages",
  },
  {
    name: "delete_draft",
    description: "Delete a message draft",
    parameters: { draft_id: "string", type: "email|sms" },
    category: "messages",
  },
  // Knowledge/Memory
  {
    name: "get_knowledge",
    description: "Retrieve stored knowledge/facts about the user",
    parameters: { category: "string (optional)", search: "string (optional)" },
    category: "knowledge",
  },
  {
    name: "add_knowledge",
    description: "Store a new fact or preference about the user",
    parameters: { category: "string", key: "string", value: "string" },
    category: "knowledge",
  },
  {
    name: "save_memory",
    description: "Save important information the user wants you to remember. Use when user says 'remember', 'save this', 'don't forget', etc.",
    parameters: { category: "string (e.g., 'personal', 'preferences', 'contacts', 'health', 'work')", key: "string (what to remember)", value: "string (the information)" },
    category: "knowledge",
  },
  {
    name: "get_memories",
    description: "Retrieve saved memories/information about the user",
    parameters: { category: "string (optional)", search: "string (optional)" },
    category: "knowledge",
  },
  // Navigation
  {
    name: "navigate_to",
    description: "Navigate to a page in the app. Use this when user says 'open', 'go to', 'show me' followed by a page name.",
    parameters: { page: "string (e.g., 'tasks', 'reminders', 'notes', 'calendar', 'contacts', 'messages', 'settings', 'home', 'listening-sessions')" },
    category: "navigation",
  },
  // Daily Summary & Readouts
  {
    name: "get_daily_summary",
    description: "Get a comprehensive summary of the user's day including tasks, reminders, calendar events, and notes",
    parameters: {},
    category: "system",
  },
  {
    name: "read_tasks",
    description: "Read out the user's tasks in a voice-friendly format",
    parameters: { status: "pending|completed|all (default: pending)" },
    category: "system",
  },
  {
    name: "read_reminders",
    description: "Read out the user's pending reminders in a voice-friendly format",
    parameters: {},
    category: "system",
  },
  {
    name: "read_notes",
    description: "Read out the user's recent notes in a voice-friendly format",
    parameters: { limit: "number (default: 5)" },
    category: "system",
  },
  {
    name: "read_calendar",
    description: "Read out upcoming calendar events in a voice-friendly format",
    parameters: { days: "number (default: 2)" },
    category: "system",
  },
  // Appointments
  {
    name: "create_appointment",
    description: "Create a new appointment or booking",
    parameters: { contact_name: "string (optional)", contact_phone: "string (optional)", start_time: "ISO datetime", end_time: "ISO datetime (optional)", notes: "string (optional)" },
    category: "appointments",
  },
  {
    name: "get_appointments",
    description: "Get upcoming appointments",
    parameters: { days: "number (default: 7)" },
    category: "appointments",
  },
  {
    name: "cancel_appointment",
    description: "Cancel an appointment",
    parameters: { appointment_id: "string (optional)", contact_name: "string (optional, to find by contact)" },
    category: "appointments",
  },
  {
    name: "reschedule_appointment",
    description: "Reschedule an appointment to a new time",
    parameters: { appointment_id: "string (optional)", contact_name: "string (optional)", new_start_time: "ISO datetime", new_end_time: "ISO datetime (optional)" },
    category: "appointments",
  },
  // Smart Scheduling Tools
  {
    name: "check_schedule_conflicts",
    description: "Check if a proposed time conflicts with existing events, tasks, or appointments. Use this BEFORE creating any scheduled item.",
    parameters: { start_time: "ISO datetime", end_time: "ISO datetime", title: "string", estimated_duration: "number (minutes, optional)" },
    category: "scheduling",
  },
  {
    name: "get_scheduling_suggestions",
    description: "Get AI-powered suggestions for the best time to schedule a task or event based on user's patterns and availability",
    parameters: { task_title: "string", estimated_duration: "number (minutes, default 30)", preferred_date: "ISO date (optional)" },
    category: "scheduling",
  },
  {
    name: "get_schedule_analysis",
    description: "Get a comprehensive analysis of the user's daily schedule including busy hours, free slots, and pattern-based alerts",
    parameters: {},
    category: "scheduling",
  },
  {
    name: "learn_user_patterns",
    description: "Analyze user's behavior patterns for scheduling optimization. Returns learned routines and preferences.",
    parameters: {},
    category: "scheduling",
  },
  {
    name: "create_pattern_reminder",
    description: "Create an automatic reminder based on a learned pattern (e.g., 'pick up daughter from school every Wednesday at 2pm')",
    parameters: { activity: "string", day_of_week: "number (0-6, Sunday-Saturday)", time: "HH:mm format", lead_time_minutes: "number (default: 30)" },
    category: "scheduling",
  },
  // Settings Control Tools
  {
    name: "change_voice",
    description: "Change the assistant's voice. Use when user says 'change your voice', 'use a different voice', 'sound like [voice name]'.",
    parameters: { voice: "alloy|echo|fable|onyx|nova|shimmer" },
    category: "settings",
  },
  {
    name: "toggle_wake_word",
    description: "Enable or disable wake word detection. Use when user says 'enable wake word', 'turn on hey echo', 'disable wake word'.",
    parameters: { enabled: "boolean" },
    category: "settings",
  },
  {
    name: "set_assistant_name",
    description: "Change the assistant's name. Use when user says 'I'll call you [name]', 'your name is [name]', 'change your name to [name]'.",
    parameters: { name: "string" },
    category: "settings",
  },
  {
    name: "toggle_memory",
    description: "Enable or disable memory. Use when user says 'enable memory', 'turn on memory', 'disable memory'.",
    parameters: { enabled: "boolean" },
    category: "settings",
  },
  {
    name: "get_settings",
    description: "Get current settings. Use when user asks 'what are my settings', 'show settings', 'what's configured'.",
    parameters: {},
    category: "settings",
  },
  {
    name: "adjust_voice_speed",
    description: "Adjust speaking speed. Use when user says 'speak faster', 'slow down', 'talk slower', 'speed up'.",
    parameters: { speed: "number (0.5 to 2.0)" },
    category: "settings",
  },
  {
    name: "toggle_private_mode",
    description: "Enable or disable private mode. Use when user says 'enable private mode', 'go private', 'disable private mode'.",
    parameters: { enabled: "boolean" },
    category: "settings",
  },
  // Widget Control Tools
  {
    name: "add_widget",
    description: "Add a widget to the dashboard. Use when user says 'add', 'show', or 'open' followed by a widget name.",
    parameters: { widget_type: "string (e.g., 'stocks', 'news', 'tasks', 'weather', 'calendar')" },
    category: "widgets",
  },
  {
    name: "remove_widget",
    description: "Remove a widget from the dashboard. Use when user says 'remove', 'delete', 'hide', or 'close' followed by a widget name.",
    parameters: { widget_type: "string" },
    category: "widgets",
  },
  {
    name: "list_widgets",
    description: "List all widgets currently on the dashboard. Use when user asks 'what widgets', 'show widgets', or 'list widgets'.",
    parameters: {},
    category: "widgets",
  },
  {
    name: "move_widget",
    description: "Move a widget to a specific position or direction. Use when user says 'move [widget] to [position]' or 'move [widget] [direction]'.",
    parameters: { 
      widget_type: "string (e.g., 'stocks', 'clock')",
      destination: "string (e.g., 'top right', 'bottom', 'up', 'left')" 
    },
    category: "widgets",
  },
  {
    name: "switch_layout",
    description: "Switch dashboard to a preset layout. Use when user says 'switch to [mode] mode', 'reset dashboard', 'use [layout] layout'.",
    parameters: {
      layout: "string (e.g. 'productivity', 'finance', 'morning', 'default')"
    },
    category: "widgets"
  },
  // Quiet/Listening Mode Tools
  {
    name: "start_listening_mode",
    description: "Enter quiet/listening mode where the assistant only listens and records without interrupting. Use when user says 'go quiet', 'listening mode', 'just listen', 'meeting mode', etc.",
    parameters: { context: "string (optional, e.g., 'team meeting', 'doctor appointment')" },
    category: "listening",
  },
  {
    name: "end_listening_mode",
    description: "Exit quiet mode and get a summary of the recorded conversation. Use when user says 'summarize', 'what did you hear', 'end listening mode', etc.",
    parameters: {},
    category: "listening",
  },
  {
    name: "get_listening_status",
    description: "Check if listening mode is active and get current session info",
    parameters: {},
    category: "listening",
  },
  {
    name: "get_listening_sessions",
    description: "Get past listening sessions with their summaries",
    parameters: { limit: "number (default: 10)" },
    category: "listening",
  },
];

// Get tool by name
export function getToolByName(name: string): ToolDefinition | undefined {
  return AVAILABLE_TOOLS.find(t => t.name === name);
}

// Get tools by category
export function getToolsByCategory(category: string): ToolDefinition[] {
  return AVAILABLE_TOOLS.filter(t => t.category === category);
}

// Get all tool names
export function getAllToolNames(): string[] {
  return AVAILABLE_TOOLS.map(t => t.name);
}