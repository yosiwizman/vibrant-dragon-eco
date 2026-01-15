import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { normalizeSpeechInput } from '@/services/conversation-manager';
import { parseToolCalls, extractTextResponse, validateToolCall } from '@/services/orchestrator';

describe('Voice System', () => {
  describe('Speech Normalization', () => {
    it('should normalize common speech patterns', () => {
      expect(normalizeSpeechInput('to do list')).toContain('todo');
      expect(normalizeSpeechInput('remind me to call')).toContain('create reminder');
    });

    it('should remove filler words', () => {
      const result = normalizeSpeechInput('um like add a task you know');
      expect(result).not.toContain('um');
      expect(result).not.toContain('like');
      expect(result).not.toContain('you know');
    });

    it('should handle empty input', () => {
      expect(normalizeSpeechInput('')).toBe('');
      expect(normalizeSpeechInput('   ')).toBe('');
    });

    it('should preserve important words', () => {
      const result = normalizeSpeechInput('create a task called buy groceries');
      expect(result).toContain('task');
      expect(result).toContain('buy groceries');
    });

    it('should handle mixed case input', () => {
      const result = normalizeSpeechInput('ADD A TASK');
      expect(result.toLowerCase()).toContain('task');
    });
  });

  describe('Tool Call Parsing', () => {
    it('should parse JSON tool calls', () => {
      const response = '```json\n{"tool": "create_task", "parameters": {"title": "Test"}}\n```';
      const calls = parseToolCalls(response);
      
      expect(calls).toHaveLength(1);
      expect(calls[0].tool).toBe('create_task');
      expect(calls[0].parameters.title).toBe('Test');
    });

    it('should handle multiple tool calls', () => {
      const response = '```json\n{"tool": "create_task", "parameters": {}}\n```\n```json\n{"tool": "create_reminder", "parameters": {}}\n```';
      const calls = parseToolCalls(response);
      
      expect(calls).toHaveLength(2);
      expect(calls[0].tool).toBe('create_task');
      expect(calls[1].tool).toBe('create_reminder');
    });

    it('should handle empty response', () => {
      const calls = parseToolCalls('');
      expect(calls).toHaveLength(0);
    });

    it('should handle invalid JSON gracefully', () => {
      const response = '```json\n{invalid json}\n```';
      const calls = parseToolCalls(response);
      expect(calls).toHaveLength(0);
    });

    it('should handle response without tool calls', () => {
      const response = 'Hello! How can I help you today?';
      const calls = parseToolCalls(response);
      expect(calls).toHaveLength(0);
    });

    it('should extract parameters correctly', () => {
      const response = '```json\n{"tool": "create_reminder", "parameters": {"text": "Call mom", "due_time": "2024-01-15T10:00:00Z", "channel": "notification"}}\n```';
      const calls = parseToolCalls(response);
      
      expect(calls[0].parameters.text).toBe('Call mom');
      expect(calls[0].parameters.due_time).toBe('2024-01-15T10:00:00Z');
      expect(calls[0].parameters.channel).toBe('notification');
    });
  });

  describe('Text Response Extraction', () => {
    it('should extract text without JSON blocks', () => {
      const response = 'Here is your task. ```json\n{"tool": "create_task"}\n``` Done!';
      const text = extractTextResponse(response);
      
      expect(text).not.toContain('```json');
      expect(text).toContain('Here is your task');
      expect(text).toContain('Done!');
    });

    it('should handle response with only text', () => {
      const response = 'Hello! How can I help you?';
      const text = extractTextResponse(response);
      expect(text).toBe('Hello! How can I help you?');
    });

    it('should handle response with only JSON', () => {
      const response = '```json\n{"tool": "navigate_to"}\n```';
      const text = extractTextResponse(response);
      expect(text.trim()).toBe('');
    });
  });

  describe('Tool Call Validation', () => {
    it('should validate correct tool call', () => {
      const result = validateToolCall({
        tool: 'create_task',
        parameters: { title: 'Test' },
      });
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject tool call without name', () => {
      const result = validateToolCall({
        tool: '',
        parameters: {},
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle missing parameters', () => {
      const result = validateToolCall({
        tool: 'create_task',
        parameters: {},
      });
      
      // Empty parameters is valid
      expect(result.valid).toBe(true);
    });
  });
});

describe('Voice Flow Integration', () => {
  it('should handle complete voice command flow', async () => {
    // Simulate: User says "create a task called buy milk"
    const userInput = 'create a task called buy milk';
    const normalized = normalizeSpeechInput(userInput);
    
    // Verify normalization preserves intent
    expect(normalized).toContain('task');
    expect(normalized).toContain('buy milk');
  });

  it('should handle navigation commands', () => {
    const response = '```json\n{"tool": "navigate_to", "parameters": {"page": "tasks"}}\n```';
    const calls = parseToolCalls(response);
    
    expect(calls[0].tool).toBe('navigate_to');
    expect(calls[0].parameters.page).toBe('tasks');
  });

  it('should handle reminder creation', () => {
    const response = '```json\n{"tool": "create_reminder", "parameters": {"text": "Meeting at 3pm", "due_time": "2024-01-15T15:00:00Z"}}\n```';
    const calls = parseToolCalls(response);
    
    expect(calls[0].tool).toBe('create_reminder');
    expect(calls[0].parameters.text).toBe('Meeting at 3pm');
  });
});