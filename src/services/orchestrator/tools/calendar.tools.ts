import { ToolDefinition } from '../types';

export const CALENDAR_TOOLS: ToolDefinition[] = [
  {
    name: "create_calendar_event",
    description: "Create a calendar event",
    parameters: {
      title: "string",
      start_time: "ISO datetime",
      end_time: "ISO datetime",
      location: "string",
      description: "string",
      attendees: "string[] (optional)",
    },
    category: "calendar",
  },
  {
    name: "get_calendar",
    description: "Get calendar events for a date range",
    parameters: {
      start_date: "ISO date",
      end_date: "ISO date",
    },
    category: "calendar",
  },
  {
    name: "update_calendar_event",
    description: "Update a calendar event",
    parameters: {
      event_id: "string (optional)",
      event_title: "string (optional)",
      new_title: "string (optional)",
      new_start_time: "ISO datetime (optional)",
      new_end_time: "ISO datetime (optional)",
      new_location: "string (optional)",
    },
    category: "calendar",
  },
  {
    name: "delete_calendar_event",
    description: "Delete a calendar event",
    parameters: {
      event_id: "string (optional)",
      event_title: "string (optional)",
    },
    category: "calendar",
  },
];