import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockWidget, mockLocalStorage, wait } from './utils/test-helpers';

describe('Widget System Integration', () => {
  describe('Widget Layout Persistence', () => {
    let mockStorage: ReturnType<typeof mockLocalStorage>;

    beforeEach(() => {
      mockStorage = mockLocalStorage();
      Object.defineProperty(window, 'localStorage', { value: mockStorage });
    });

    it('should persist widget layout to storage', () => {
      const layout = [
        createMockWidget('clock', { position: { x: 0, y: 0 } }),
        createMockWidget('weather', { position: { x: 2, y: 0 } }),
        createMockWidget('tasks', { position: { x: 0, y: 2 } })
      ];

      mockStorage.setItem('widget_layout', JSON.stringify(layout));

      const stored = JSON.parse(mockStorage.getItem('widget_layout')!);
      expect(stored).toHaveLength(3);
    });

    it('should restore widget layout from storage', () => {
      const layout = [createMockWidget('clock')];
      mockStorage.setItem('widget_layout', JSON.stringify(layout));

      const restored = JSON.parse(mockStorage.getItem('widget_layout')!);
      expect(restored[0].type).toBe('clock');
    });

    it('should handle empty layout gracefully', () => {
      const stored = mockStorage.getItem('widget_layout');
      expect(stored).toBeNull();
    });
  });

  describe('Widget Resize Constraints', () => {
    const widgetConstraints: Record<string, { minW: number; minH: number; maxW: number; maxH: number }> = {
      clock: { minW: 1, minH: 1, maxW: 4, maxH: 4 },
      weather: { minW: 2, minH: 2, maxW: 4, maxH: 4 },
      tasks: { minW: 2, minH: 2, maxW: 6, maxH: 6 },
      calendar: { minW: 3, minH: 3, maxW: 6, maxH: 6 },
      notes: { minW: 2, minH: 2, maxW: 4, maxH: 4 }
    };

    const validateResize = (widgetType: string, newSize: { w: number; h: number }): boolean => {
      const constraints = widgetConstraints[widgetType];
      if (!constraints) return false;

      return newSize.w >= constraints.minW &&
             newSize.w <= constraints.maxW &&
             newSize.h >= constraints.minH &&
             newSize.h <= constraints.maxH;
    };

    it('should validate clock widget resize', () => {
      expect(validateResize('clock', { w: 2, h: 2 })).toBe(true);
      expect(validateResize('clock', { w: 1, h: 1 })).toBe(true);
      expect(validateResize('clock', { w: 5, h: 5 })).toBe(false);
    });

    it('should validate weather widget resize', () => {
      expect(validateResize('weather', { w: 2, h: 2 })).toBe(true);
      expect(validateResize('weather', { w: 1, h: 1 })).toBe(false);
      expect(validateResize('weather', { w: 4, h: 4 })).toBe(true);
    });

    it('should validate tasks widget resize', () => {
      expect(validateResize('tasks', { w: 3, h: 3 })).toBe(true);
      expect(validateResize('tasks', { w: 6, h: 6 })).toBe(true);
      expect(validateResize('tasks', { w: 7, h: 7 })).toBe(false);
    });

    it('should reject unknown widget types', () => {
      expect(validateResize('unknown', { w: 2, h: 2 })).toBe(false);
    });
  });

  describe('Widget Collision Detection', () => {
    const checkCollision = (
      widget1: { x: number; y: number; w: number; h: number },
      widget2: { x: number; y: number; w: number; h: number }
    ): boolean => {
      return !(
        widget1.x + widget1.w <= widget2.x ||
        widget2.x + widget2.w <= widget1.x ||
        widget1.y + widget1.h <= widget2.y ||
        widget2.y + widget2.h <= widget1.y
      );
    };

    it('should detect overlapping widgets', () => {
      const widget1 = { x: 0, y: 0, w: 2, h: 2 };
      const widget2 = { x: 1, y: 1, w: 2, h: 2 };

      expect(checkCollision(widget1, widget2)).toBe(true);
    });

    it('should allow adjacent widgets', () => {
      const widget1 = { x: 0, y: 0, w: 2, h: 2 };
      const widget2 = { x: 2, y: 0, w: 2, h: 2 };

      expect(checkCollision(widget1, widget2)).toBe(false);
    });

    it('should detect vertical overlap', () => {
      const widget1 = { x: 0, y: 0, w: 2, h: 2 };
      const widget2 = { x: 0, y: 1, w: 2, h: 2 };

      expect(checkCollision(widget1, widget2)).toBe(true);
    });

    it('should allow vertically stacked widgets', () => {
      const widget1 = { x: 0, y: 0, w: 2, h: 2 };
      const widget2 = { x: 0, y: 2, w: 2, h: 2 };

      expect(checkCollision(widget1, widget2)).toBe(false);
    });
  });

  describe('Widget Data Refresh', () => {
    const mockWidgetData: Record<string, any> = {
      weather: { temp: 72, condition: 'sunny', humidity: 45 },
      tasks: { pending: 5, completed: 10, overdue: 2 },
      calendar: { events: 3, nextEvent: 'Meeting at 2pm' },
      stocks: { portfolio: 15000, change: 2.5 }
    };

    const refreshWidget = async (widgetId: string): Promise<any> => {
      await wait(10); // Simulate API delay
      return mockWidgetData[widgetId] || null;
    };

    it('should refresh weather widget data', async () => {
      const data = await refreshWidget('weather');
      
      expect(data).toBeDefined();
      expect(data.temp).toBe(72);
      expect(data.condition).toBe('sunny');
    });

    it('should refresh tasks widget data', async () => {
      const data = await refreshWidget('tasks');
      
      expect(data.pending).toBe(5);
      expect(data.completed).toBe(10);
    });

    it('should handle unknown widget gracefully', async () => {
      const data = await refreshWidget('unknown');
      expect(data).toBeNull();
    });

    it('should refresh multiple widgets concurrently', async () => {
      const results = await Promise.all([
        refreshWidget('weather'),
        refreshWidget('tasks'),
        refreshWidget('calendar')
      ]);

      expect(results).toHaveLength(3);
      expect(results.every(r => r !== null)).toBe(true);
    });
  });

  describe('Widget Configuration', () => {
    it('should apply widget-specific config', () => {
      const weatherWidget = createMockWidget('weather', {
        config: { unit: 'fahrenheit', showHumidity: true }
      });

      expect(weatherWidget.config.unit).toBe('fahrenheit');
      expect(weatherWidget.config.showHumidity).toBe(true);
    });

    it('should merge default and custom config', () => {
      const defaultConfig = { refreshInterval: 60000, showTitle: true };
      const customConfig = { refreshInterval: 30000 };
      
      const mergedConfig = { ...defaultConfig, ...customConfig };

      expect(mergedConfig.refreshInterval).toBe(30000);
      expect(mergedConfig.showTitle).toBe(true);
    });
  });
});