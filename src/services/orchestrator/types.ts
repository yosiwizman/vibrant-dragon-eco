// Orchestrator types and interfaces

export interface OrchestrationContext {
  userId: string;
  userMessage: string;
  conversationHistory: { role: string; content: string }[];
  preferences?: Record<string, any>;
}

export interface OrchestrationResult {
  response: string;
  actions: ActionResult[];
  toolsUsed: string[];
  metadata?: Record<string, any>;
}

export interface ActionResult {
  tool: string;
  success: boolean;
  data?: any;
  error?: string;
  duration?: number;
  timestamp?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, string>;
  category: string;
}

export interface ToolCall {
  tool: string;
  parameters: Record<string, any>;
}

// Tool categories for organization
export const TOOL_CATEGORIES = {
  time: ["get_current_time"],
  tasks: ["create_task", "get_tasks", "complete_task", "update_task", "reschedule_task", "get_overdue_tasks", "delete_task", "create_recurring_task", "get_task_stats"],
  reminders: ["create_reminder", "get_reminders", "delete_reminder", "update_reminder", "get_upcoming_reminders", "create_recurring_reminder", "snooze_reminder"],
  notes: ["create_note", "get_notes", "search_notes", "update_note", "delete_note", "pin_note"],
  calendar: ["create_calendar_event", "get_calendar", "read_calendar", "update_calendar_event", "delete_calendar_event"],
  contacts: ["create_contact", "get_contacts", "search_contacts", "update_contact", "delete_contact", "call_contact", "send_message_to_contact"],
  appointments: ["create_appointment", "get_appointments", "cancel_appointment", "reschedule_appointment"],
  navigation: ["navigate_to"],
  search: ["web_search", "get_weather", "find_nearby"],
  knowledge: ["search_knowledge_base", "add_to_knowledge_base", "get_knowledge", "add_knowledge", "save_memory", "get_memories"],
  scheduling: ["check_schedule_conflicts", "get_scheduling_suggestions", "get_schedule_analysis", "learn_user_patterns", "create_pattern_reminder"],
  listening: ["start_listening_mode", "end_listening_mode", "get_listening_status", "get_listening_sessions"],
  notifications: ["send_notification", "get_notifications", "mark_notification_read", "clear_notifications"],
  messages: ["draft_email", "draft_sms", "get_drafts", "delete_draft", "send_draft"],
  recurring: ["get_recurring_items", "cancel_recurring_series"],
  system: ["undo_last_action", "get_daily_summary", "read_tasks", "read_reminders", "read_notes", "get_system_status", "get_productivity_stats"],
  widgets: ["add_widget", "remove_widget", "list_widgets", "move_widget", "switch_layout"],
  settings: ["change_voice", "toggle_wake_word", "set_assistant_name", "toggle_memory", "get_settings", "adjust_voice_speed", "toggle_private_mode"],
} as const;

export type ToolCategory = keyof typeof TOOL_CATEGORIES;