import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseToolCalls, extractTextResponse, validateToolCall } from '@/services/orchestrator/parser';
import { 
  getToolByName, 
  getToolsByCategory, 
  getAllToolNames,
  toolExists,
  searchTools 
} from '@/services/orchestrator/tools';

describe('Orchestrator Parser', () => {
  describe('parseToolCalls', () => {
    it('should parse a single tool call from JSON block', () => {
      const response = `I'll create a task for you.
\`\`\`json
{"tool": "create_task", "parameters": {"title": "Buy groceries", "priority": "high"}}
\`\`\`
Done!`;
      
      const toolCalls = parseToolCalls(response);
      
      expect(toolCalls).toHaveLength(1);
      expect(toolCalls[0].tool).toBe('create_task');
      expect(toolCalls[0].parameters).toEqual({
        title: 'Buy groceries',
        priority: 'high'
      });
    });

    it('should parse multiple tool calls from response', () => {
      const response = `I'll help you with that.
\`\`\`json
{"tool": "create_task", "parameters": {"title": "Task 1"}}
\`\`\`
And also:
\`\`\`json
{"tool": "create_reminder", "parameters": {"text": "Reminder 1", "due_time": "2024-01-15T10:00:00Z"}}
\`\`\``;
      
      const toolCalls = parseToolCalls(response);
      
      expect(toolCalls).toHaveLength(2);
      expect(toolCalls[0].tool).toBe('create_task');
      expect(toolCalls[1].tool).toBe('create_reminder');
    });

    it('should return empty array for response without tool calls', () => {
      const response = 'Just a regular response without any tools.';
      
      const toolCalls = parseToolCalls(response);
      
      expect(toolCalls).toHaveLength(0);
    });

    it('should skip invalid JSON blocks', () => {
      const response = `Here's a task:
\`\`\`json
{"tool": "create_task", "parameters": {"title": "Valid"}}
\`\`\`
And invalid:
\`\`\`json
{invalid json here}
\`\`\``;
      
      const toolCalls = parseToolCalls(response);
      
      expect(toolCalls).toHaveLength(1);
      expect(toolCalls[0].tool).toBe('create_task');
    });

    it('should handle tool calls without parameters', () => {
      const response = `\`\`\`json
{"tool": "get_current_time"}
\`\`\``;
      
      const toolCalls = parseToolCalls(response);
      
      expect(toolCalls).toHaveLength(1);
      expect(toolCalls[0].tool).toBe('get_current_time');
      expect(toolCalls[0].parameters).toEqual({});
    });

    it('should handle nested parameters', () => {
      const response = `\`\`\`json
{"tool": "create_calendar_event", "parameters": {"title": "Meeting", "attendees": ["john@example.com", "jane@example.com"]}}
\`\`\``;
      
      const toolCalls = parseToolCalls(response);
      
      expect(toolCalls).toHaveLength(1);
      expect(toolCalls[0].parameters.attendees).toEqual(['john@example.com', 'jane@example.com']);
    });
  });

  describe('extractTextResponse', () => {
    it('should extract text without JSON blocks', () => {
      const response = `Here's what I found:
\`\`\`json
{"tool": "get_tasks"}
\`\`\`
Let me know if you need anything else.`;
      
      const text = extractTextResponse(response);
      
      expect(text).toBe("Here's what I found:\n\nLet me know if you need anything else.");
    });

    it('should return full text when no JSON blocks present', () => {
      const response = 'Just a simple response.';
      
      const text = extractTextResponse(response);
      
      expect(text).toBe('Just a simple response.');
    });

    it('should handle multiple JSON blocks', () => {
      const response = `First:
\`\`\`json
{"tool": "a"}
\`\`\`
Middle text
\`\`\`json
{"tool": "b"}
\`\`\`
End`;
      
      const text = extractTextResponse(response);
      
      expect(text).toContain('First:');
      expect(text).toContain('Middle text');
      expect(text).toContain('End');
      expect(text).not.toContain('{"tool"');
    });
  });

  describe('validateToolCall', () => {
    it('should validate a correct tool call', () => {
      const toolCall = {
        tool: 'create_task',
        parameters: { title: 'Test' }
      };
      
      const result = validateToolCall(toolCall);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject tool call without tool name', () => {
      const toolCall = {
        tool: '',
        parameters: {}
      };
      
      const result = validateToolCall(toolCall);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject tool call with non-string tool name', () => {
      const toolCall = {
        tool: 123 as any,
        parameters: {}
      };
      
      const result = validateToolCall(toolCall);
      
      expect(result.valid).toBe(false);
    });

    it('should reject tool call with non-object parameters', () => {
      const toolCall = {
        tool: 'test',
        parameters: 'invalid' as any
      };
      
      const result = validateToolCall(toolCall);
      
      expect(result.valid).toBe(false);
    });
  });
});

describe('Orchestrator Tools', () => {
  describe('getToolByName', () => {
    it('should return tool definition for valid tool name', () => {
      const tool = getToolByName('create_task');
      
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('create_task');
      expect(tool?.description).toBeDefined();
    });

    it('should return undefined for invalid tool name', () => {
      const tool = getToolByName('nonexistent_tool');
      
      expect(tool).toBeUndefined();
    });
  });

  describe('getToolsByCategory', () => {
    it('should return tools for valid category', () => {
      const tools = getToolsByCategory('tasks');
      
      expect(tools.length).toBeGreaterThan(0);
      tools.forEach(tool => {
        expect(tool.category).toBe('tasks');
      });
    });

    it('should return empty array for invalid category', () => {
      const tools = getToolsByCategory('invalid_category' as any);
      
      expect(tools).toEqual([]);
    });
  });

  describe('getAllToolNames', () => {
    it('should return array of all tool names', () => {
      const names = getAllToolNames();
      
      expect(Array.isArray(names)).toBe(true);
      expect(names.length).toBeGreaterThan(0);
      expect(names).toContain('create_task');
      expect(names).toContain('get_current_time');
    });
  });

  describe('toolExists', () => {
    it('should return true for existing tool', () => {
      expect(toolExists('create_task')).toBe(true);
      expect(toolExists('get_reminders')).toBe(true);
    });

    it('should return false for non-existing tool', () => {
      expect(toolExists('fake_tool')).toBe(false);
    });
  });

  describe('searchTools', () => {
    it('should find tools matching search query', () => {
      const results = searchTools('task');
      
      expect(results.length).toBeGreaterThan(0);
      results.forEach(tool => {
        const matchesName = tool.name.toLowerCase().includes('task');
        const matchesDesc = tool.description.toLowerCase().includes('task');
        expect(matchesName || matchesDesc).toBe(true);
      });
    });

    it('should return empty array for no matches', () => {
      const results = searchTools('xyznonexistent123');
      
      expect(results).toEqual([]);
    });

    it('should be case insensitive', () => {
      const lowerResults = searchTools('reminder');
      const upperResults = searchTools('REMINDER');
      
      expect(lowerResults.length).toBe(upperResults.length);
    });
  });
});

describe('Tool Categories', () => {
  const expectedCategories = [
    'time',
    'system',
    'tasks',
    'reminders',
    'notes',
    'calendar',
    'contacts',
    'notifications',
    'messages',
    'knowledge',
    'search',
    'scheduling',
    'recurring',
    'navigation',
    'settings',
    'widgets',
    'listening'
  ];

  it('should have tools for all expected categories', () => {
    expectedCategories.forEach(category => {
      const tools = getToolsByCategory(category as any);
      expect(tools.length).toBeGreaterThan(0);
    });
  });
});

describe('Tool Definitions', () => {
  it('all tools should have required properties', () => {
    const allNames = getAllToolNames();
    
    allNames.forEach(name => {
      const tool = getToolByName(name);
      expect(tool).toBeDefined();
      expect(tool?.name).toBe(name);
      expect(typeof tool?.description).toBe('string');
      expect(tool?.description.length).toBeGreaterThan(0);
      expect(typeof tool?.category).toBe('string');
    });
  });

  it('all tools should have valid parameter definitions', () => {
    const allNames = getAllToolNames();
    
    allNames.forEach(name => {
      const tool = getToolByName(name);
      if (tool?.parameters) {
        expect(typeof tool.parameters).toBe('object');
        
        Object.entries(tool.parameters).forEach(([paramName, paramDef]) => {
          expect(typeof paramName).toBe('string');
          expect(paramDef).toBeDefined();
        });
      }
    });
  });
});