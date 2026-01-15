import { ToolCall } from './types';

// Parse tool calls from AI response
export function parseToolCalls(response: string): ToolCall[] {
  const toolCalls: ToolCall[] = [];
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/g;
  
  let match;
  while ((match = jsonRegex.exec(response)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.tool) {
        toolCalls.push({
          tool: parsed.tool,
          parameters: parsed.parameters || {},
        });
      }
    } catch (e) {
      // Invalid JSON, skip
      console.warn('[Parser] Failed to parse tool call JSON:', e);
    }
  }
  
  return toolCalls;
}

// Extract text response (non-tool content) from AI response
export function extractTextResponse(response: string): string {
  // Remove JSON code blocks
  const withoutJson = response.replace(/```json\s*[\s\S]*?\s*```/g, '').trim();
  return withoutJson;
}

// Validate tool call parameters
export function validateToolCall(toolCall: ToolCall): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!toolCall.tool || typeof toolCall.tool !== 'string') {
    errors.push('Tool name is required and must be a string');
  }
  
  if (toolCall.parameters && typeof toolCall.parameters !== 'object') {
    errors.push('Parameters must be an object');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}