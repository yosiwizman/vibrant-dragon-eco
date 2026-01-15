import { ToolDefinition } from '../types';

export const LISTENING_TOOLS: ToolDefinition[] = [
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