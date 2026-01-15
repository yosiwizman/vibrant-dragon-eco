import { ToolDefinition } from '../types';

export const WIDGET_TOOLS: ToolDefinition[] = [
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
      destination: "string (e.g., 'top right', 'bottom', 'up', 'left')",
    },
    category: "widgets",
  },
  {
    name: "switch_layout",
    description: "Switch dashboard to a preset layout. Use when user says 'switch to [mode] mode', 'reset dashboard', 'use [layout] layout'.",
    parameters: { layout: "string (e.g. 'productivity', 'finance', 'morning', 'default')" },
    category: "widgets",
  },
];