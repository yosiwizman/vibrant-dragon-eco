import { ToolDefinition } from '../types';

export const RECURRING_TOOLS: ToolDefinition[] = [
  {
    name: "create_recurring_reminder",
    description: "Create a reminder that repeats on a schedule",
    parameters: {
      text: "string",
      due_time: "ISO datetime",
      recurrence: "daily|weekly|biweekly|monthly|yearly",
      interval: "number (optional, default 1)",
    },
    category: "recurring",
  },
  {
    name: "create_recurring_task",
    description: "Create a task that repeats on a schedule",
    parameters: {
      title: "string",
      due_date: "ISO datetime",
      recurrence: "daily|weekly|biweekly|monthly|yearly",
      interval: "number (optional, default 1)",
      priority: "low|medium|high|urgent",
    },
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
    parameters: {
      item_type: "task|reminder",
      item_id: "string",
    },
    category: "recurring",
  },
];