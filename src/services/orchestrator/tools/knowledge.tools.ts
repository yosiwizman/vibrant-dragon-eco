import { ToolDefinition } from '../types';

export const KNOWLEDGE_TOOLS: ToolDefinition[] = [
  {
    name: "search_knowledge_base",
    description: "Search the user's knowledge base and documents for relevant information",
    parameters: {
      query: "string",
      category: "string (optional)",
    },
    category: "knowledge",
  },
  {
    name: "add_to_knowledge_base",
    description: "Add new information or a document to the knowledge base",
    parameters: {
      title: "string",
      content: "string",
      category: "string (optional)",
      tags: "string[] (optional)",
    },
    category: "knowledge",
  },
  {
    name: "get_knowledge",
    description: "Retrieve stored knowledge/facts about the user",
    parameters: {
      category: "string (optional)",
      search: "string (optional)",
    },
    category: "knowledge",
  },
  {
    name: "add_knowledge",
    description: "Store a new fact or preference about the user",
    parameters: {
      category: "string",
      key: "string",
      value: "string",
    },
    category: "knowledge",
  },
  {
    name: "save_memory",
    description: "Save important information the user wants you to remember. Use when user says 'remember', 'save this', 'don't forget', etc.",
    parameters: {
      category: "string (e.g., 'personal', 'preferences', 'contacts', 'health', 'work')",
      key: "string (what to remember)",
      value: "string (the information)",
    },
    category: "knowledge",
  },
  {
    name: "get_memories",
    description: "Retrieve saved memories/information about the user",
    parameters: {
      category: "string (optional)",
      search: "string (optional)",
    },
    category: "knowledge",
  },
];