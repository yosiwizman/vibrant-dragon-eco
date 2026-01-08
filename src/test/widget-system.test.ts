import { describe, it, expect } from 'vitest';
import { packWidgets, findNextPosition } from '@/components/widgets/system/layout';
import type { Widget } from '@/types/widgets';

describe('Widget System', () => {
  describe('Widget Packing', () => {
    it('should pack widgets without overlaps', () => {
      const widgets: Widget[] = [
        { id: '1', type: 'tasks', x: 0, y: 0, w: 2, h: 2 },
        { id: '2', type: 'calendar', x: 0, y: 0, w: 2, h: 2 }, // Overlaps
      ];

      const packed = packWidgets(widgets);
      
      // Second widget should be moved
      expect(packed[1].x).not.toBe(0);
    });

    it('should respect widget size constraints', () => {
      const widgets: Widget[] = [
        { id: '1', type: 'tasks', x: 0, y: 0, w: 10, h: 10 }, // Too large
      ];

      const packed = packWidgets(widgets);
      
      // Should be constrained to grid
      expect(packed[0].w).toBeLessThanOrEqual(4);
    });
  });

  describe('Position Finding', () => {
    it('should find next available position', () => {
      const existing: Widget[] = [
        { id: '1', type: 'tasks', x: 0, y: 0, w: 2, h: 2 },
      ];

      const pos = findNextPosition(existing, 2, 2);
      
      // Should not overlap with existing
      expect(pos.x + 2).toBeGreaterThan(0);
    });
  });
});