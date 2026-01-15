import { ToolDefinition } from '../types';

export const SYSTEM_TOOLS: ToolDefinition[] = [
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
];