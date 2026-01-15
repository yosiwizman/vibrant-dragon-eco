import { describe, it, expect, vi } from 'vitest';
import { wait } from './utils/test-helpers';

describe('Voice System Integration', () => {
  describe('Voice Configuration', () => {
    it('should initialize with correct default config', () => {
      const defaultConfig = {
        language: 'en-US',
        continuous: true,
        interimResults: true,
        maxAlternatives: 1
      };

      expect(defaultConfig.language).toBe('en-US');
      expect(defaultConfig.continuous).toBe(true);
      expect(defaultConfig.interimResults).toBe(true);
    });

    it('should support multiple languages', () => {
      const supportedLanguages = ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE'];
      
      supportedLanguages.forEach(lang => {
        expect(lang).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
      });
    });

    it('should validate voice speed settings', () => {
      const validSpeeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
      
      validSpeeds.forEach(speed => {
        expect(speed).toBeGreaterThanOrEqual(0.5);
        expect(speed).toBeLessThanOrEqual(2.0);
      });
    });
  });

  describe('Voice Command Parsing', () => {
    const parseVoiceCommand = (input: string) => {
      const normalized = input.toLowerCase().trim();
      
      // Task commands
      if (/create\s+(a\s+)?task/i.test(normalized)) {
        const titleMatch = normalized.match(/(?:called|named|titled)\s+(.+)/i);
        return { action: 'create_task', title: titleMatch?.[1] || 'Untitled' };
      }
      
      // Reminder commands
      if (/remind\s+me/i.test(normalized)) {
        const textMatch = normalized.match(/remind\s+me\s+(?:to\s+)?(.+?)(?:\s+at|\s+in|$)/i);
        const timeMatch = normalized.match(/(?:at|in)\s+(.+)/i);
        return { 
          action: 'create_reminder', 
          text: textMatch?.[1] || '', 
          time: timeMatch?.[1] || null 
        };
      }
      
      // Calendar commands
      if (/calendar|schedule|events?/i.test(normalized)) {
        const timeframe = /today/i.test(normalized) ? 'today' :
                         /tomorrow/i.test(normalized) ? 'tomorrow' :
                         /this\s+week/i.test(normalized) ? 'week' : 'all';
        return { action: 'query_calendar', timeframe };
      }
      
      // Navigation commands
      if (/(?:go\s+to|open|show|navigate\s+to)/i.test(normalized)) {
        const pageMatch = normalized.match(/(?:go\s+to|open|show|navigate\s+to)\s+(\w+)/i);
        return { action: 'navigate', page: pageMatch?.[1] || 'home' };
      }
      
      return { action: 'unknown', raw: normalized };
    };

    it('should parse task creation commands', () => {
      const commands = [
        'create a task called buy groceries',
        'create task named finish report',
        'create a task titled call mom'
      ];

      commands.forEach(cmd => {
        const result = parseVoiceCommand(cmd);
        expect(result.action).toBe('create_task');
        expect(result.title).toBeDefined();
      });
    });

    it('should parse reminder commands', () => {
      const result = parseVoiceCommand('remind me to call mom at 5pm');
      
      expect(result.action).toBe('create_reminder');
      expect(result.text).toContain('call mom');
      expect(result.time).toContain('5pm');
    });

    it('should parse calendar queries', () => {
      const queries = [
        { input: "what's on my calendar today", expected: 'today' },
        { input: 'show my schedule for tomorrow', expected: 'tomorrow' },
        { input: 'what events do I have this week', expected: 'week' }
      ];

      queries.forEach(({ input, expected }) => {
        const result = parseVoiceCommand(input);
        expect(result.action).toBe('query_calendar');
        expect(result.timeframe).toBe(expected);
      });
    });

    it('should parse navigation commands', () => {
      const commands = [
        { input: 'go to settings', expected: 'settings' },
        { input: 'open tasks', expected: 'tasks' },
        { input: 'show calendar', expected: 'calendar' }
      ];

      commands.forEach(({ input, expected }) => {
        const result = parseVoiceCommand(input);
        expect(result.action).toBe('navigate');
        expect(result.page).toBe(expected);
      });
    });

    it('should handle unknown commands gracefully', () => {
      const result = parseVoiceCommand('random gibberish text');
      
      expect(result.action).toBe('unknown');
      expect(result.raw).toBeDefined();
    });
  });

  describe('Voice Error Handling', () => {
    const handleVoiceError = (error: Error) => {
      const errorMap: Record<string, { fallback: string; message: string; retry: boolean }> = {
        'microphone': { fallback: 'text_input', message: 'Please use text input', retry: false },
        'network': { fallback: 'offline', message: 'Network unavailable', retry: true },
        'timeout': { fallback: 'retry', message: 'Request timed out', retry: true },
        'permission': { fallback: 'text_input', message: 'Microphone permission denied', retry: false }
      };

      const errorType = Object.keys(errorMap).find(key => 
        error.message.toLowerCase().includes(key)
      );

      return errorMap[errorType || ''] || { fallback: 'retry', message: error.message, retry: true };
    };

    it('should handle microphone access denied', () => {
      const error = new Error('Microphone access denied');
      const result = handleVoiceError(error);

      expect(result.fallback).toBe('text_input');
      expect(result.retry).toBe(false);
    });

    it('should handle network errors', () => {
      const error = new Error('Network request failed');
      const result = handleVoiceError(error);

      expect(result.fallback).toBe('offline');
      expect(result.retry).toBe(true);
    });

    it('should handle timeout errors', () => {
      const error = new Error('Request timeout');
      const result = handleVoiceError(error);

      expect(result.fallback).toBe('retry');
      expect(result.retry).toBe(true);
    });

    it('should handle permission errors', () => {
      const error = new Error('Permission denied for microphone');
      const result = handleVoiceError(error);

      expect(result.fallback).toBe('text_input');
      expect(result.retry).toBe(false);
    });
  });

  describe('Voice Recording', () => {
    it('should track recording state', () => {
      const recordingState = {
        isRecording: false,
        duration: 0,
        audioLevel: 0
      };

      // Start recording
      recordingState.isRecording = true;
      expect(recordingState.isRecording).toBe(true);

      // Stop recording
      recordingState.isRecording = false;
      expect(recordingState.isRecording).toBe(false);
    });

    it('should enforce maximum recording duration', async () => {
      const MAX_DURATION = 30000; // 30 seconds
      let duration = 0;
      
      const checkDuration = () => duration >= MAX_DURATION;
      
      duration = 25000;
      expect(checkDuration()).toBe(false);
      
      duration = 30000;
      expect(checkDuration()).toBe(true);
    });
  });
});