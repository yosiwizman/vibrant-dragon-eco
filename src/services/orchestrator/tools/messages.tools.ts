import { ToolDefinition } from '../types';

export const MESSAGE_TOOLS: ToolDefinition[] = [
  {
    name: "draft_email",
    description: "Draft an email based on user's request",
    parameters: {
      prompt: "string (what the email should say)",
      to: "string (optional recipient)",
      subject: "string (optional)",
    },
    category: "messages",
  },
  {
    name: "draft_sms",
    description: "Draft a text message based on user's request",
    parameters: {
      prompt: "string (what the message should say)",
      to: "string (optional recipient name or number)",
    },
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
    parameters: {
      draft_id: "string",
      type: "email|sms",
    },
    category: "messages",
  },
];