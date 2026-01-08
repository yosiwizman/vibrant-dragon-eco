import { describe, it, expect, vi } from 'vitest';
import { normalizeSpeechInput } from '@/services/conversation-manager';
import { parseToolCalls } from '@/services/orchestrator';

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
    });
  });
});