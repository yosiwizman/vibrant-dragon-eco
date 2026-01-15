import { ToolDefinition } from '../types';

export const NOTE_TOOLS: ToolDefinition[] = [
  {
    name: "create_note",
    description: "Create a note or save information",
    parameters: {
      title: "string",
      content: "string",
      tags: "string[]",
      pinned: "boolean (optional)",
    },
    category: "notes",
  },
  {
    name: "get_notes",
    description: "Get user's notes with optional search",
    parameters: {
      search: "string (optional)",
      limit: "number (default: 10)",
      pinned_only: "boolean (optional)",
    },
    category: "notes",
  },
  {
    name: "search_notes",
    description: "Search through notes by keyword",
    parameters: { query: "string" },
    category: "notes",
  },
  {
    name: "update_note",
    description: "Update a note's title, content, or tags",
    parameters: {
      note_id: "string (optional)",
      note_title: "string (optional)",
      new_title: "string (optional)",
      new_content: "string (optional)",
      new_tags: "string[] (optional)",
    },
    category: "notes",
  },
  {
    name: "delete_note",
    description: "Delete a note",
    parameters: {
      note_id: "string (optional)",
      note_title: "string (optional)",
    },
    category: "notes",
  },
  {
    name: "pin_note",
    description: "Pin or unpin a note",
    parameters: {
      note_id: "string (optional)",
      note_title: "string (optional)",
      pinned: "boolean",
    },
    category: "notes",
  },
];