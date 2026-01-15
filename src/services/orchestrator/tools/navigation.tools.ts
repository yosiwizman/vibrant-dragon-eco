import { ToolDefinition } from '../types';

export const NAVIGATION_TOOLS: ToolDefinition[] = [
  {
    name: "navigate_to",
    description: "Navigate to a page in the app. Use this when user says 'open', 'go to', 'show me' followed by a page name.",
    parameters: {
      page: "string (e.g., 'tasks', 'reminders', 'notes', 'calendar', 'contacts', 'messages', 'settings', 'home', 'listening-sessions')",
    },
    category: "navigation",
  },
];