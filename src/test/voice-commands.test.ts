import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test voice command patterns and parsing
describe('Voice Command Patterns', () => {
  describe('Task Commands', () => {
    const taskPatterns = [
      { input: 'create a task to buy groceries', expected: { action: 'create_task', title: 'buy groceries' } },
      { input: 'add task call mom', expected: { action: 'create_task', title: 'call mom' } },
      { input: 'new task finish report by friday', expected: { action: 'create_task', title: 'finish report' } },
      { input: 'remind me to take medicine', expected: { action: 'create_reminder', text: 'take medicine' } },
      { input: 'complete task buy groceries', expected: { action: 'complete_task', title: 'buy groceries' } },
      { input: 'mark task done', expected: { action: 'complete_task' } },
      { input: 'show my tasks', expected: { action: 'get_tasks' } },
      { input: 'what are my tasks', expected: { action: 'get_tasks' } },
      { input: 'list all tasks', expected: { action: 'get_tasks' } },
    ];

    taskPatterns.forEach(({ input, expected }) => {
      it(`should recognize: "${input}"`, () => {
        const result = parseVoiceCommand(input);
        expect(result.action).toBe(expected.action);
        if (expected.title) {
          expect(result.parameters?.title?.toLowerCase()).toContain(expected.title.toLowerCase());
        }
      });
    });
  });

  describe('Reminder Commands', () => {
    const reminderPatterns = [
      { input: 'set a reminder for 3pm', expected: { action: 'create_reminder' } },
      { input: 'remind me at 5 o\'clock', expected: { action: 'create_reminder' } },
      { input: 'create reminder to call john tomorrow', expected: { action: 'create_reminder' } },
      { input: 'show my reminders', expected: { action: 'get_reminders' } },
      { input: 'what reminders do I have', expected: { action: 'get_reminders' } },
      { input: 'delete reminder call john', expected: { action: 'delete_reminder' } },
      { input: 'snooze reminder for 10 minutes', expected: { action: 'snooze_reminder' } },
    ];

    reminderPatterns.forEach(({ input, expected }) => {
      it(`should recognize: "${input}"`, () => {
        const result = parseVoiceCommand(input);
        expect(result.action).toBe(expected.action);
      });
    });
  });

  describe('Note Commands', () => {
    const notePatterns = [
      { input: 'create a note about meeting', expected: { action: 'create_note' } },
      { input: 'take a note', expected: { action: 'create_note' } },
      { input: 'new note shopping list', expected: { action: 'create_note' } },
      { input: 'show my notes', expected: { action: 'get_notes' } },
      { input: 'search notes for recipe', expected: { action: 'search_notes' } },
      { input: 'find note about project', expected: { action: 'search_notes' } },
      { input: 'pin note meeting notes', expected: { action: 'pin_note' } },
    ];

    notePatterns.forEach(({ input, expected }) => {
      it(`should recognize: "${input}"`, () => {
        const result = parseVoiceCommand(input);
        expect(result.action).toBe(expected.action);
      });
    });
  });

  describe('Calendar Commands', () => {
    const calendarPatterns = [
      { input: 'schedule a meeting tomorrow at 2pm', expected: { action: 'create_calendar_event' } },
      { input: 'add event lunch with john', expected: { action: 'create_calendar_event' } },
      { input: 'what\'s on my calendar', expected: { action: 'get_calendar' } },
      { input: 'show my schedule', expected: { action: 'get_calendar' } },
      { input: 'what do I have today', expected: { action: 'get_calendar' } },
      { input: 'cancel meeting with john', expected: { action: 'delete_calendar_event' } },
    ];

    calendarPatterns.forEach(({ input, expected }) => {
      it(`should recognize: "${input}"`, () => {
        const result = parseVoiceCommand(input);
        expect(result.action).toBe(expected.action);
      });
    });
  });

  describe('Navigation Commands', () => {
    const navPatterns = [
      { input: 'go to tasks', expected: { action: 'navigate_to', page: 'tasks' } },
      { input: 'open calendar', expected: { action: 'navigate_to', page: 'calendar' } },
      { input: 'show me notes', expected: { action: 'navigate_to', page: 'notes' } },
      { input: 'take me to settings', expected: { action: 'navigate_to', page: 'settings' } },
      { input: 'go home', expected: { action: 'navigate_to', page: 'home' } },
      { input: 'open dashboard', expected: { action: 'navigate_to', page: 'dashboard' } },
    ];

    navPatterns.forEach(({ input, expected }) => {
      it(`should recognize: "${input}"`, () => {
        const result = parseVoiceCommand(input);
        expect(result.action).toBe(expected.action);
        if (expected.page) {
          expect(result.parameters?.page).toBe(expected.page);
        }
      });
    });
  });

  describe('System Commands', () => {
    const systemPatterns = [
      { input: 'what time is it', expected: { action: 'get_current_time' } },
      { input: 'tell me the time', expected: { action: 'get_current_time' } },
      { input: 'undo', expected: { action: 'undo_last_action' } },
      { input: 'undo that', expected: { action: 'undo_last_action' } },
      { input: 'give me a summary', expected: { action: 'get_daily_summary' } },
      { input: 'daily summary', expected: { action: 'get_daily_summary' } },
      { input: 'how am I doing', expected: { action: 'get_productivity_stats' } },
    ];

    systemPatterns.forEach(({ input, expected }) => {
      it(`should recognize: "${input}"`, () => {
        const result = parseVoiceCommand(input);
        expect(result.action).toBe(expected.action);
      });
    });
  });

  describe('Widget Commands', () => {
    const widgetPatterns = [
      { input: 'add weather widget', expected: { action: 'add_widget', type: 'weather' } },
      { input: 'show clock widget', expected: { action: 'add_widget', type: 'clock' } },
      { input: 'remove tasks widget', expected: { action: 'remove_widget', type: 'tasks' } },
      { input: 'hide calendar widget', expected: { action: 'remove_widget', type: 'calendar' } },
      { input: 'list my widgets', expected: { action: 'list_widgets' } },
      { input: 'what widgets do I have', expected: { action: 'list_widgets' } },
    ];

    widgetPatterns.forEach(({ input, expected }) => {
      it(`should recognize: "${input}"`, () => {
        const result = parseVoiceCommand(input);
        expect(result.action).toBe(expected.action);
        if (expected.type) {
          expect(result.parameters?.widget_type).toBe(expected.type);
        }
      });
    });
  });
});

describe('Time Parsing', () => {
  describe('Relative Time', () => {
    const relativeTimes = [
      { input: 'in 5 minutes', expected: { minutes: 5 } },
      { input: 'in an hour', expected: { hours: 1 } },
      { input: 'in 2 hours', expected: { hours: 2 } },
      { input: 'tomorrow', expected: { days: 1 } },
      { input: 'next week', expected: { weeks: 1 } },
      { input: 'in 30 minutes', expected: { minutes: 30 } },
    ];

    relativeTimes.forEach(({ input, expected }) => {
      it(`should parse: "${input}"`, () => {
        const result = parseRelativeTime(input);
        expect(result).toBeDefined();
        if (expected.minutes) expect(result.minutes).toBe(expected.minutes);
        if (expected.hours) expect(result.hours).toBe(expected.hours);
        if (expected.days) expect(result.days).toBe(expected.days);
        if (expected.weeks) expect(result.weeks).toBe(expected.weeks);
      });
    });
  });

  describe('Absolute Time', () => {
    const absoluteTimes = [
      { input: '3pm', expected: { hour: 15 } },
      { input: '3:30pm', expected: { hour: 15, minute: 30 } },
      { input: '9am', expected: { hour: 9 } },
      { input: '12:00', expected: { hour: 12, minute: 0 } },
      { input: '5 o\'clock', expected: { hour: 17 } }, // Assumes PM for afternoon
    ];

    absoluteTimes.forEach(({ input, expected }) => {
      it(`should parse: "${input}"`, () => {
        const result = parseAbsoluteTime(input);
        expect(result).toBeDefined();
        if (expected.hour !== undefined) expect(result.hour).toBe(expected.hour);
        if (expected.minute !== undefined) expect(result.minute).toBe(expected.minute);
      });
    });
  });
});

describe('Priority Parsing', () => {
  const priorityTests = [
    { input: 'high priority task', expected: 'high' },
    { input: 'urgent task', expected: 'high' },
    { input: 'important meeting', expected: 'high' },
    { input: 'low priority item', expected: 'low' },
    { input: 'not urgent', expected: 'low' },
    { input: 'regular task', expected: 'medium' },
    { input: 'normal priority', expected: 'medium' },
  ];

  priorityTests.forEach(({ input, expected }) => {
    it(`should extract priority from: "${input}"`, () => {
      const result = extractPriority(input);
      expect(result).toBe(expected);
    });
  });
});

// Helper functions for testing (simplified implementations)
function parseVoiceCommand(input: string): { action: string; parameters?: Record<string, any> } {
  const lowerInput = input.toLowerCase();
  
  // Task patterns
  if (lowerInput.includes('create') && lowerInput.includes('task') || 
      lowerInput.includes('add task') || 
      lowerInput.includes('new task')) {
    const title = lowerInput.replace(/create a task (to )?|add task |new task /gi, '').trim();
    return { action: 'create_task', parameters: { title } };
  }
  
  if (lowerInput.includes('complete task') || lowerInput.includes('mark task done')) {
    return { action: 'complete_task', parameters: {} };
  }
  
  if (lowerInput.includes('show') && lowerInput.includes('task') ||
      lowerInput.includes('what are my tasks') ||
      lowerInput.includes('list') && lowerInput.includes('task')) {
    return { action: 'get_tasks', parameters: {} };
  }
  
  // Reminder patterns
  if (lowerInput.includes('remind me') || 
      lowerInput.includes('set a reminder') ||
      lowerInput.includes('create reminder')) {
    return { action: 'create_reminder', parameters: {} };
  }
  
  if (lowerInput.includes('show') && lowerInput.includes('reminder') ||
      lowerInput.includes('what reminders')) {
    return { action: 'get_reminders', parameters: {} };
  }
  
  if (lowerInput.includes('delete reminder')) {
    return { action: 'delete_reminder', parameters: {} };
  }
  
  if (lowerInput.includes('snooze reminder')) {
    return { action: 'snooze_reminder', parameters: {} };
  }
  
  // Note patterns
  if (lowerInput.includes('create') && lowerInput.includes('note') ||
      lowerInput.includes('take a note') ||
      lowerInput.includes('new note')) {
    return { action: 'create_note', parameters: {} };
  }
  
  if (lowerInput.includes('show') && lowerInput.includes('note')) {
    return { action: 'get_notes', parameters: {} };
  }
  
  if (lowerInput.includes('search notes') || lowerInput.includes('find note')) {
    return { action: 'search_notes', parameters: {} };
  }
  
  if (lowerInput.includes('pin note')) {
    return { action: 'pin_note', parameters: {} };
  }
  
  // Calendar patterns
  if (lowerInput.includes('schedule') || 
      lowerInput.includes('add event')) {
    return { action: 'create_calendar_event', parameters: {} };
  }
  
  if (lowerInput.includes('calendar') || 
      lowerInput.includes('schedule') && lowerInput.includes('show') ||
      lowerInput.includes('what do i have')) {
    return { action: 'get_calendar', parameters: {} };
  }
  
  if (lowerInput.includes('cancel') && lowerInput.includes('meeting')) {
    return { action: 'delete_calendar_event', parameters: {} };
  }
  
  // Navigation patterns
  if (lowerInput.includes('go to') || 
      lowerInput.includes('open') ||
      lowerInput.includes('take me to') ||
      lowerInput.includes('show me')) {
    let page = 'home';
    if (lowerInput.includes('task')) page = 'tasks';
    else if (lowerInput.includes('calendar')) page = 'calendar';
    else if (lowerInput.includes('note')) page = 'notes';
    else if (lowerInput.includes('setting')) page = 'settings';
    else if (lowerInput.includes('dashboard')) page = 'dashboard';
    else if (lowerInput.includes('home')) page = 'home';
    return { action: 'navigate_to', parameters: { page } };
  }
  
  // System patterns
  if (lowerInput.includes('time')) {
    return { action: 'get_current_time', parameters: {} };
  }
  
  if (lowerInput.includes('undo')) {
    return { action: 'undo_last_action', parameters: {} };
  }
  
  if (lowerInput.includes('summary')) {
    return { action: 'get_daily_summary', parameters: {} };
  }
  
  if (lowerInput.includes('how am i doing') || lowerInput.includes('productivity')) {
    return { action: 'get_productivity_stats', parameters: {} };
  }
  
  // Widget patterns
  if (lowerInput.includes('add') && lowerInput.includes('widget') ||
      lowerInput.includes('show') && lowerInput.includes('widget')) {
    let type = 'unknown';
    if (lowerInput.includes('weather')) type = 'weather';
    else if (lowerInput.includes('clock')) type = 'clock';
    else if (lowerInput.includes('task')) type = 'tasks';
    else if (lowerInput.includes('calendar')) type = 'calendar';
    return { action: 'add_widget', parameters: { widget_type: type } };
  }
  
  if (lowerInput.includes('remove') && lowerInput.includes('widget') ||
      lowerInput.includes('hide') && lowerInput.includes('widget')) {
    let type = 'unknown';
    if (lowerInput.includes('task')) type = 'tasks';
    else if (lowerInput.includes('calendar')) type = 'calendar';
    return { action: 'remove_widget', parameters: { widget_type: type } };
  }
  
  if (lowerInput.includes('list') && lowerInput.includes('widget') ||
      lowerInput.includes('what widgets')) {
    return { action: 'list_widgets', parameters: {} };
  }
  
  return { action: 'unknown', parameters: {} };
}

function parseRelativeTime(input: string): { minutes?: number; hours?: number; days?: number; weeks?: number } {
  const lowerInput = input.toLowerCase();
  
  const minuteMatch = lowerInput.match(/in (\d+) minutes?/);
  if (minuteMatch) return { minutes: parseInt(minuteMatch[1]) };
  
  const hourMatch = lowerInput.match(/in (\d+) hours?/);
  if (hourMatch) return { hours: parseInt(hourMatch[1]) };
  
  if (lowerInput.includes('in an hour')) return { hours: 1 };
  if (lowerInput.includes('tomorrow')) return { days: 1 };
  if (lowerInput.includes('next week')) return { weeks: 1 };
  
  return {};
}

function parseAbsoluteTime(input: string): { hour?: number; minute?: number } {
  const lowerInput = input.toLowerCase();
  
  // Match patterns like "3pm", "3:30pm", "9am"
  const timeMatch = lowerInput.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1]);
    const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const period = timeMatch[3];
    
    if (period === 'pm' && hour < 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;
    
    // If no period specified and hour is small, assume PM for afternoon
    if (!period && hour >= 1 && hour <= 6) hour += 12;
    
    return { hour, minute };
  }
  
  // Match "5 o'clock"
  const oclockMatch = lowerInput.match(/(\d{1,2})\s*o'?clock/);
  if (oclockMatch) {
    let hour = parseInt(oclockMatch[1]);
    if (hour >= 1 && hour <= 6) hour += 12; // Assume PM
    return { hour };
  }
  
  return {};
}

function extractPriority(input: string): string {
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('high priority') || 
      lowerInput.includes('urgent') || 
      lowerInput.includes('important')) {
    return 'high';
  }
  
  if (lowerInput.includes('low priority') || 
      lowerInput.includes('not urgent')) {
    return 'low';
  }
  
  return 'medium';
}