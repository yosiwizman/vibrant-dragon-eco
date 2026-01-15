import { ToolDefinition } from '../types';

// Import all tool category modules
import { TIME_TOOLS } from './time.tools';
import { SYSTEM_TOOLS } from './system.tools';
import { TASK_TOOLS } from './tasks.tools';
import { REMINDER_TOOLS } from './reminders.tools';
import { NOTE_TOOLS } from './notes.tools';
import { CALENDAR_TOOLS } from './calendar.tools';
import { CONTACT_TOOLS } from './contacts.tools';
import { APPOINTMENT_TOOLS } from './appointments.tools';
import { NOTIFICATION_TOOLS } from './notifications.tools';
import { MESSAGE_TOOLS } from './messages.tools';
import { KNOWLEDGE_TOOLS } from './knowledge.tools';
import { SEARCH_TOOLS } from './search.tools';
import { SCHEDULING_TOOLS } from './scheduling.tools';
import { RECURRING_TOOLS } from './recurring.tools';
import { NAVIGATION_TOOLS } from './navigation.tools';
import { SETTINGS_TOOLS } from './settings.tools';
import { WIDGET_TOOLS } from './widgets.tools';
import { LISTENING_TOOLS } from './listening.tools';

// Re-export individual tool arrays for selective imports
export {
  TIME_TOOLS,
  SYSTEM_TOOLS,
  TASK_TOOLS,
  REMINDER_TOOLS,
  NOTE_TOOLS,
  CALENDAR_TOOLS,
  CONTACT_TOOLS,
  APPOINTMENT_TOOLS,
  NOTIFICATION_TOOLS,
  MESSAGE_TOOLS,
  KNOWLEDGE_TOOLS,
  SEARCH_TOOLS,
  SCHEDULING_TOOLS,
  RECURRING_TOOLS,
  NAVIGATION_TOOLS,
  SETTINGS_TOOLS,
  WIDGET_TOOLS,
  LISTENING_TOOLS,
};

// Combined array of all available tools
export const AVAILABLE_TOOLS: ToolDefinition[] = [
  ...TIME_TOOLS,
  ...SYSTEM_TOOLS,
  ...TASK_TOOLS,
  ...REMINDER_TOOLS,
  ...NOTE_TOOLS,
  ...CALENDAR_TOOLS,
  ...CONTACT_TOOLS,
  ...APPOINTMENT_TOOLS,
  ...NOTIFICATION_TOOLS,
  ...MESSAGE_TOOLS,
  ...KNOWLEDGE_TOOLS,
  ...SEARCH_TOOLS,
  ...SCHEDULING_TOOLS,
  ...RECURRING_TOOLS,
  ...NAVIGATION_TOOLS,
  ...SETTINGS_TOOLS,
  ...WIDGET_TOOLS,
  ...LISTENING_TOOLS,
];

// Tool lookup utilities
const toolMap = new Map<string, ToolDefinition>();
AVAILABLE_TOOLS.forEach(tool => toolMap.set(tool.name, tool));

/**
 * Get a tool definition by name
 * O(1) lookup using Map
 */
export function getToolByName(name: string): ToolDefinition | undefined {
  return toolMap.get(name);
}

/**
 * Get all tools for a specific category
 */
export function getToolsByCategory(category: string): ToolDefinition[] {
  return AVAILABLE_TOOLS.filter(t => t.category === category);
}

/**
 * Get all tool names
 */
export function getAllToolNames(): string[] {
  return AVAILABLE_TOOLS.map(t => t.name);
}

/**
 * Get all unique categories
 */
export function getAllCategories(): string[] {
  return [...new Set(AVAILABLE_TOOLS.map(t => t.category))];
}

/**
 * Check if a tool exists
 */
export function toolExists(name: string): boolean {
  return toolMap.has(name);
}

/**
 * Get tool count by category
 */
export function getToolCountByCategory(): Record<string, number> {
  const counts: Record<string, number> = {};
  AVAILABLE_TOOLS.forEach(tool => {
    counts[tool.category] = (counts[tool.category] || 0) + 1;
  });
  return counts;
}

/**
 * Search tools by name or description
 */
export function searchTools(query: string): ToolDefinition[] {
  const lowerQuery = query.toLowerCase();
  return AVAILABLE_TOOLS.filter(
    t => t.name.toLowerCase().includes(lowerQuery) ||
         t.description.toLowerCase().includes(lowerQuery)
  );
}