import { ToolDefinition } from '../types';

export const REMINDER_TOOLS: ToolDefinition[] = [
  {
    name: "create_reminder",
    description: "Create a reminder for a specific time",
    parameters: {
      text: "string",
      due_time: "ISO datetime string",
      channel: "push|sms|email",
    },
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
    parameters: {
      reminder_id: "string",
      or: "reminder_text: string (to find by text)",
    },
    category: "reminders",
  },
  {
    name: "update_reminder",
    description: "Update a reminder's text or time",
    parameters: {
      reminder_id: "string (optional)",
      reminder_text: "string (optional, to find by text)",
      new_text: "string (optional)",
      new_due_time: "ISO datetime (optional)",
    },
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
    parameters: {
      reminder_id: "string (optional)",
      reminder_text: "string (optional)",
      snooze_minutes: "number (default: 15)",
    },
    category: "reminders",
  },
];