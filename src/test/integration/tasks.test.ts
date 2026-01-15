import { describe, it, expect, vi } from 'vitest';
import { createMockTask, wait } from './utils/test-helpers';

describe('Task Management Integration', () => {
  describe('Task Creation', () => {
    it('should create task with all required fields', () => {
      const task = createMockTask({
        title: 'Complete project report',
        description: 'Finish the quarterly report',
        priority: 'high',
        due_date: new Date('2024-12-31').toISOString(),
        tags: ['work', 'urgent']
      });

      expect(task.title).toBe('Complete project report');
      expect(task.priority).toBe('high');
      expect(task.tags).toContain('work');
    });

    it('should validate task priority values', () => {
      const validPriorities = ['low', 'medium', 'high'];
      
      validPriorities.forEach(priority => {
        const task = createMockTask({ priority });
        expect(['low', 'medium', 'high']).toContain(task.priority);
      });
    });

    it('should validate due date format', () => {
      const task = createMockTask({
        due_date: new Date('2024-12-31').toISOString()
      });

      const dueDate = new Date(task.due_date!);
      expect(dueDate).toBeInstanceOf(Date);
      expect(dueDate.getTime()).not.toBeNaN();
    });

    it('should handle tasks without due date', () => {
      const task = createMockTask({ due_date: null });
      expect(task.due_date).toBeNull();
    });
  });

  describe('Task Status Transitions', () => {
    const validTransitions: Record<string, string[]> = {
      'pending': ['in_progress', 'completed', 'cancelled'],
      'in_progress': ['completed', 'pending', 'cancelled'],
      'completed': ['pending'],
      'cancelled': ['pending']
    };

    const canTransition = (from: string, to: string): boolean => {
      return validTransitions[from]?.includes(to) || false;
    };

    it('should allow valid transitions from pending', () => {
      expect(canTransition('pending', 'in_progress')).toBe(true);
      expect(canTransition('pending', 'completed')).toBe(true);
      expect(canTransition('pending', 'cancelled')).toBe(true);
    });

    it('should allow valid transitions from in_progress', () => {
      expect(canTransition('in_progress', 'completed')).toBe(true);
      expect(canTransition('in_progress', 'pending')).toBe(true);
      expect(canTransition('in_progress', 'cancelled')).toBe(true);
    });

    it('should restrict transitions from completed', () => {
      expect(canTransition('completed', 'pending')).toBe(true);
      expect(canTransition('completed', 'in_progress')).toBe(false);
      expect(canTransition('completed', 'cancelled')).toBe(false);
    });

    it('should restrict transitions from cancelled', () => {
      expect(canTransition('cancelled', 'pending')).toBe(true);
      expect(canTransition('cancelled', 'in_progress')).toBe(false);
      expect(canTransition('cancelled', 'completed')).toBe(false);
    });
  });

  describe('Recurring Tasks', () => {
    const parseRecurrenceRule = (rule: string): Record<string, string> => {
      const parts = rule.split(';');
      const parsed: Record<string, string> = {};
      parts.forEach(part => {
        const [key, value] = part.split('=');
        if (key && value) parsed[key] = value;
      });
      return parsed;
    };

    it('should parse weekly recurrence', () => {
      const rule = 'FREQ=WEEKLY;BYDAY=MO';
      const parsed = parseRecurrenceRule(rule);

      expect(parsed.FREQ).toBe('WEEKLY');
      expect(parsed.BYDAY).toBe('MO');
    });

    it('should parse daily recurrence', () => {
      const rule = 'FREQ=DAILY;INTERVAL=1';
      const parsed = parseRecurrenceRule(rule);

      expect(parsed.FREQ).toBe('DAILY');
      expect(parsed.INTERVAL).toBe('1');
    });

    it('should parse monthly recurrence', () => {
      const rule = 'FREQ=MONTHLY;BYMONTHDAY=15';
      const parsed = parseRecurrenceRule(rule);

      expect(parsed.FREQ).toBe('MONTHLY');
      expect(parsed.BYMONTHDAY).toBe('15');
    });

    it('should handle recurrence end date', () => {
      const task = createMockTask({
        recurrence_rule: 'FREQ=WEEKLY;BYDAY=MO',
        recurrence_end_date: new Date('2025-12-31').toISOString()
      });

      expect(task.recurrence_rule).toBeDefined();
      expect(new Date(task.recurrence_end_date!).getFullYear()).toBe(2025);
    });
  });

  describe('Task Filtering', () => {
    const tasks = [
      createMockTask({ status: 'pending', priority: 'high', tags: ['work'] }),
      createMockTask({ status: 'completed', priority: 'low', tags: ['personal'] }),
      createMockTask({ status: 'pending', priority: 'medium', tags: ['work', 'urgent'] }),
      createMockTask({ status: 'in_progress', priority: 'high', tags: ['personal'] })
    ];

    it('should filter by status', () => {
      const pending = tasks.filter(t => t.status === 'pending');
      expect(pending).toHaveLength(2);
    });

    it('should filter by priority', () => {
      const highPriority = tasks.filter(t => t.priority === 'high');
      expect(highPriority).toHaveLength(2);
    });

    it('should filter by tag', () => {
      const workTasks = tasks.filter(t => t.tags.includes('work'));
      expect(workTasks).toHaveLength(2);
    });

    it('should combine multiple filters', () => {
      const filtered = tasks.filter(t => 
        t.status === 'pending' && t.priority === 'high'
      );
      expect(filtered).toHaveLength(1);
    });
  });

  describe('Task Sorting', () => {
    const tasks = [
      createMockTask({ title: 'C Task', priority: 'low', due_date: '2024-12-03' }),
      createMockTask({ title: 'A Task', priority: 'high', due_date: '2024-12-01' }),
      createMockTask({ title: 'B Task', priority: 'medium', due_date: '2024-12-02' })
    ];

    it('should sort by title alphabetically', () => {
      const sorted = [...tasks].sort((a, b) => a.title.localeCompare(b.title));
      expect(sorted[0].title).toBe('A Task');
      expect(sorted[2].title).toBe('C Task');
    });

    it('should sort by priority', () => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const sorted = [...tasks].sort((a, b) => 
        priorityOrder[a.priority as keyof typeof priorityOrder] - 
        priorityOrder[b.priority as keyof typeof priorityOrder]
      );
      expect(sorted[0].priority).toBe('high');
      expect(sorted[2].priority).toBe('low');
    });

    it('should sort by due date', () => {
      const sorted = [...tasks].sort((a, b) => 
        new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
      );
      expect(sorted[0].due_date).toBe('2024-12-01');
    });
  });
});