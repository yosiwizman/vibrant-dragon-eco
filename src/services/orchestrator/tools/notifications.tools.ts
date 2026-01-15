import { ToolDefinition } from '../types';

export const NOTIFICATION_TOOLS: ToolDefinition[] = [
  {
    name: "send_notification",
    description: "Send a notification to the user",
    parameters: {
      title: "string",
      body: "string",
      type: "reminder|task|message|system",
    },
    category: "notifications",
  },
  {
    name: "get_notifications",
    description: "Get user's notifications",
    parameters: {
      unread_only: "boolean (default: false)",
      limit: "number (default: 20)",
    },
    category: "notifications",
  },
  {
    name: "mark_notification_read",
    description: "Mark a notification as read",
    parameters: {
      notification_id: "string",
      or: "mark_all: boolean",
    },
    category: "notifications",
  },
  {
    name: "clear_notifications",
    description: "Clear all read notifications",
    parameters: {},
    category: "notifications",
  },
];