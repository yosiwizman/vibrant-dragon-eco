import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ToolCall, ActionResult } from '@/services/orchestrator/types';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
    },
  },
}));

// Mock navigator for offline detection
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('Executor', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset online status
    Object.defineProperty(navigator, 'onLine', { value: true });
  });

  describe('executeTool', () => {
    it('should execute get_current_time successfully', async () => {
      const { executeTool } = await import('@/services/orchestrator/executor');
      
      const toolCall: ToolCall = {
        tool: 'get_current_time',
        parameters: {},
      };
      
      const result = await executeTool(mockUserId, toolCall);
      
      expect(result.success).toBe(true);
      expect(result.tool).toBe('get_current_time');
      expect(result.data).toBeDefined();
      expect(result.duration).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should return error for unknown tool', async () => {
      const { executeTool } = await import('@/services/orchestrator/executor');
      
      const toolCall: ToolCall = {
        tool: 'nonexistent_tool',
        parameters: {},
      };
      
      const result = await executeTool(mockUserId, toolCall);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown tool');
    });

    it('should include timing information in result', async () => {
      const { executeTool } = await import('@/services/orchestrator/executor');
      
      const toolCall: ToolCall = {
        tool: 'get_current_time',
        parameters: {},
      };
      
      const result = await executeTool(mockUserId, toolCall);
      
      expect(typeof result.duration).toBe('number');
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should handle navigate_to tool', async () => {
      const { executeTool } = await import('@/services/orchestrator/executor');
      
      const toolCall: ToolCall = {
        tool: 'navigate_to',
        parameters: { page: 'tasks' },
      };
      
      const result = await executeTool(mockUserId, toolCall);
      
      expect(result.tool).toBe('navigate_to');
      // Navigation may succeed or fail depending on router state
      expect(result.duration).toBeDefined();
    });
  });

  describe('executeTools', () => {
    it('should execute multiple tools in sequence', async () => {
      const { executeTools } = await import('@/services/orchestrator/executor');
      
      const toolCalls: ToolCall[] = [
        { tool: 'get_current_time', parameters: {} },
        { tool: 'get_current_time', parameters: {} },
      ];
      
      const results = await executeTools(mockUserId, toolCalls);
      
      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.tool).toBe('get_current_time');
        expect(result.success).toBe(true);
      });
    });

    it('should stop on critical tool failure', async () => {
      const { executeTools } = await import('@/services/orchestrator/executor');
      
      // navigate_to is a critical tool
      const toolCalls: ToolCall[] = [
        { tool: 'navigate_to', parameters: { page: 'invalid_page_xyz' } },
        { tool: 'get_current_time', parameters: {} },
      ];
      
      const results = await executeTools(mockUserId, toolCalls);
      
      // Should have at least the first result
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should continue on non-critical tool failure', async () => {
      const { executeTools } = await import('@/services/orchestrator/executor');
      
      const toolCalls: ToolCall[] = [
        { tool: 'nonexistent_tool', parameters: {} },
        { tool: 'get_current_time', parameters: {} },
      ];
      
      const results = await executeTools(mockUserId, toolCalls);
      
      // Both should be attempted since nonexistent_tool is not critical
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should catch and return errors gracefully', async () => {
      const { executeTool } = await import('@/services/orchestrator/executor');
      
      const toolCall: ToolCall = {
        tool: 'unknown_tool_that_throws',
        parameters: {},
      };
      
      const result = await executeTool(mockUserId, toolCall);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.duration).toBeDefined();
    });
  });

  describe('Context Handling', () => {
    it('should pass context to tools that need it', async () => {
      const { executeTool } = await import('@/services/orchestrator/executor');
      
      const toolCall: ToolCall = {
        tool: 'get_current_time',
        parameters: {},
      };
      
      const context = {
        openaiApiKey: 'test-key',
      };
      
      const result = await executeTool(mockUserId, toolCall, context);
      
      // Should execute successfully with context
      expect(result.success).toBe(true);
    });
  });
});

describe('Tool Result Structure', () => {
  it('should have consistent result structure', async () => {
    const { executeTool } = await import('@/services/orchestrator/executor');
    
    const toolCall: ToolCall = {
      tool: 'get_current_time',
      parameters: {},
    };
    
    const result = await executeTool('test-user', toolCall);
    
    // Check required fields
    expect(result).toHaveProperty('tool');
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('duration');
    expect(result).toHaveProperty('timestamp');
    
    // Check types
    expect(typeof result.tool).toBe('string');
    expect(typeof result.success).toBe('boolean');
    expect(typeof result.duration).toBe('number');
    expect(typeof result.timestamp).toBe('string');
  });
});