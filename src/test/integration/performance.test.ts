import { describe, it, expect } from 'vitest';
import { wait, measureTime, TestCache } from './utils/test-helpers';

describe('Performance Integration', () => {
  describe('Operation Timing', () => {
    it('should measure operation duration accurately', async () => {
      const { duration } = await measureTime(async () => {
        await wait(50);
        return 'done';
      });

      expect(duration).toBeGreaterThanOrEqual(50);
      expect(duration).toBeLessThan(100);
    });

    it('should measure fast operations', async () => {
      const { duration } = await measureTime(async () => {
        return 1 + 1;
      });

      expect(duration).toBeLessThan(10);
    });

    it('should return operation result', async () => {
      const { result } = await measureTime(async () => {
        return { value: 42 };
      });

      expect(result.value).toBe(42);
    });
  });

  describe('Caching', () => {
    it('should cache and retrieve values', () => {
      const cache = new TestCache<string>();
      
      cache.set('key1', 'value1');
      
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for missing keys', () => {
      const cache = new TestCache<string>();
      
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should expire cached values after TTL', async () => {
      const cache = new TestCache<string>(50); // 50ms TTL
      
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
      
      await wait(60);
      
      expect(cache.get('key1')).toBeNull();
    });

    it('should track cache size', () => {
      const cache = new TestCache<string>();
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      expect(cache.size()).toBe(2);
    });

    it('should clear all cached values', () => {
      const cache = new TestCache<string>();
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      
      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeNull();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent operations', async () => {
      const operations = Array(100).fill(null).map((_, i) =>
        Promise.resolve({ id: i, success: true })
      );

      const results = await Promise.all(operations);

      expect(results).toHaveLength(100);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should complete concurrent operations within time limit', async () => {
      const { duration } = await measureTime(async () => {
        const operations = Array(10).fill(null).map(() => wait(10));
        await Promise.all(operations);
      });

      // All should complete in parallel, not sequentially
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Memory Management', () => {
    it('should limit array size', () => {
      const MAX_SIZE = 100;
      const items: number[] = [];

      for (let i = 0; i < 150; i++) {
        items.push(i);
        if (items.length > MAX_SIZE) {
          items.shift();
        }
      }

      expect(items.length).toBe(MAX_SIZE);
      expect(items[0]).toBe(50); // First 50 items were removed
    });

    it('should implement LRU-like eviction', () => {
      const MAX_SIZE = 3;
      const cache = new Map<string, { value: any; lastAccess: number }>();

      const set = (key: string, value: any) => {
        if (cache.size >= MAX_SIZE) {
          // Remove least recently accessed
          let oldest: string | null = null;
          let oldestTime = Infinity;
          cache.forEach((v, k) => {
            if (v.lastAccess < oldestTime) {
              oldestTime = v.lastAccess;
              oldest = k;
            }
          });
          if (oldest) cache.delete(oldest);
        }
        cache.set(key, { value, lastAccess: Date.now() });
      };

      set('a', 1);
      set('b', 2);
      set('c', 3);
      set('d', 4); // Should evict 'a'

      expect(cache.has('a')).toBe(false);
      expect(cache.has('d')).toBe(true);
      expect(cache.size).toBe(3);
    });
  });

  describe('Debouncing', () => {
    it('should debounce rapid calls', async () => {
      let callCount = 0;
      const debounce = (fn: () => void, delay: number) => {
        let timeout: NodeJS.Timeout;
        return () => {
          clearTimeout(timeout);
          timeout = setTimeout(fn, delay);
        };
      };

      const increment = debounce(() => { callCount++; }, 50);

      // Rapid calls
      increment();
      increment();
      increment();
      increment();
      increment();

      await wait(100);

      expect(callCount).toBe(1);
    });
  });

  describe('Throttling', () => {
    it('should throttle frequent calls', async () => {
      let callCount = 0;
      let lastCall = 0;

      const throttle = (fn: () => void, limit: number) => {
        return () => {
          const now = Date.now();
          if (now - lastCall >= limit) {
            lastCall = now;
            fn();
          }
        };
      };

      const increment = throttle(() => { callCount++; }, 50);

      // Rapid calls over 100ms
      const start = Date.now();
      while (Date.now() - start < 100) {
        increment();
        await wait(10);
      }

      // Should have been called approximately 2-3 times
      expect(callCount).toBeGreaterThanOrEqual(2);
      expect(callCount).toBeLessThanOrEqual(3);
    });
  });
});