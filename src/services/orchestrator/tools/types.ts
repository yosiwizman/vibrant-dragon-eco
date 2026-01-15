import { ToolDefinition } from '../types';

// Re-export for convenience
export type { ToolDefinition };

// Helper to create a tool definition with type safety
export function defineTool(tool: ToolDefinition): ToolDefinition {
  return tool;
}

// Helper to create multiple tools for a category
export function defineTools(tools: ToolDefinition[]): ToolDefinition[] {
  return tools;
}