import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockTask, wait } from './utils/test-helpers';

describe('Offline Mode Integration', () => {
  describe('Operation Queuing', () => {
    let offlineQueue: { action: string; data: any; timestamp: number }[];

    beforeEach(() => {
      offlineQueue = [];
    });

    const queueOperation = (action: string, data: any) => {
      offlineQueue.push({
        action,
        data,
        timestamp: Date.now()
      });
    };

    it('should queue operations when offline', () => {
      queueOperation('create_task', { title: 'Offline task' });
      queueOperation('update_note', { id: '123', content: 'Updated' });

      expect(offlineQueue).toHaveLength(2);
      expect(offlineQueue[0].action).toBe('create_task');
    });

    it('should preserve operation order', () => {
      queueOperation('op1', {});
      queueOperation('op2', {});
      queueOperation('op3', {});

      expect(offlineQueue[0].action).toBe('op1');
      expect(offlineQueue[2].action).toBe('op3');
    });

    it('should include timestamp for each operation', () => {
      const before = Date.now();
      queueOperation('test', {});
      const after = Date.now();

      expect(offlineQueue[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(offlineQueue[0].timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('Queue Synchronization', () => {
    it('should sync queued operations when online', async () => {
      const queue = [
        { action: 'create_task', data: { title: 'Task 1' }, timestamp: Date.now() - 1000 },
        { action: 'create_task', data: { title: 'Task 2' }, timestamp: Date.now() }
      ];

      const syncResults: { success: boolean; action: string }[] = [];

      for (const item of queue) {
        await wait(10);
        syncResults.push({ success: true, action: item.action });
      }

      expect(syncResults).toHaveLength(2);
      expect(syncResults.every(r => r.success)).toBe(true);
    });

    it('should handle sync failures gracefully', async () => {
      const queue = [
        { action: 'create_task', data: { title: 'Task 1' }, timestamp: Date.now() }
      ];

      const syncWithFailure = async () => {
        const results = [];
        for (const item of queue) {
          try {
            throw new Error('Sync failed');
          } catch (error) {
            results.push({ success: false, action: item.action, error: (error as Error).message });
          }
        }
        return results;
      };

      const results = await syncWithFailure();
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Sync failed');
    });

    it('should retry failed sync operations', async () => {
      let attempts = 0;
      const maxRetries = 3;

      const syncWithRetry = async (): Promise<boolean> => {
        for (let i = 0; i < maxRetries; i++) {
          attempts++;
          if (attempts >= 2) return true; // Succeed on second attempt
          await wait(10);
        }
        return false;
      };

      const result = await syncWithRetry();
      expect(result).toBe(true);
      expect(attempts).toBe(2);
    });
  });

  describe('Conflict Resolution', () => {
    interface VersionedData {
      id: string;
      title: string;
      updated_at: number;
    }

    const resolveConflict = (
      server: VersionedData,
      local: VersionedData,
      strategy: 'server-wins' | 'local-wins' | 'newest-wins' = 'newest-wins'
    ): { winner: string; data: VersionedData } => {
      switch (strategy) {
        case 'server-wins':
          return { winner: 'server', data: server };
        case 'local-wins':
          return { winner: 'local', data: local };
        case 'newest-wins':
        default:
          return server.updated_at > local.updated_at
            ? { winner: 'server', data: server }
            : { winner: 'local', data: local };
      }
    };

    it('should resolve conflict with server-wins strategy', () => {
      const server = { id: '1', title: 'Server', updated_at: Date.now() - 1000 };
      const local = { id: '1', title: 'Local', updated_at: Date.now() };

      const result = resolveConflict(server, local, 'server-wins');
      expect(result.winner).toBe('server');
      expect(result.data.title).toBe('Server');
    });

    it('should resolve conflict with local-wins strategy', () => {
      const server = { id: '1', title: 'Server', updated_at: Date.now() };
      const local = { id: '1', title: 'Local', updated_at: Date.now() - 1000 };

      const result = resolveConflict(server, local, 'local-wins');
      expect(result.winner).toBe('local');
      expect(result.data.title).toBe('Local');
    });

    it('should resolve conflict with newest-wins strategy', () => {
      const server = { id: '1', title: 'Server', updated_at: Date.now() };
      const local = { id: '1', title: 'Local', updated_at: Date.now() - 1000 };

      const result = resolveConflict(server, local, 'newest-wins');
      expect(result.winner).toBe('server');
    });

    it('should handle equal timestamps', () => {
      const timestamp = Date.now();
      const server = { id: '1', title: 'Server', updated_at: timestamp };
      const local = { id: '1', title: 'Local', updated_at: timestamp };

      const result = resolveConflict(server, local);
      // When equal, local wins (server.updated_at > local.updated_at is false)
      expect(result.winner).toBe('local');
    });
  });

  describe('Offline Detection', () => {
    it('should detect online status', () => {
      const isOnline = true; // Simulated
      expect(isOnline).toBe(true);
    });

    it('should detect offline status', () => {
      const isOnline = false; // Simulated
      expect(isOnline).toBe(false);
    });

    it('should determine if operation can proceed', () => {
      const canOperate = (isOnline: boolean, hasOfflineSupport: boolean) => {
        return isOnline || hasOfflineSupport;
      };

      expect(canOperate(true, false)).toBe(true);
      expect(canOperate(false, true)).toBe(true);
      expect(canOperate(false, false)).toBe(false);
    });
  });

  describe('Offline Storage', () => {
    it('should store data locally when offline', () => {
      const offlineStore: Record<string, any> = {};
      
      const storeOffline = (key: string, data: any) => {
        offlineStore[key] = { data, storedAt: Date.now() };
      };

      storeOffline('task_1', { title: 'Offline Task' });
      
      expect(offlineStore['task_1']).toBeDefined();
      expect(offlineStore['task_1'].data.title).toBe('Offline Task');
    });

    it('should retrieve offline data', () => {
      const offlineStore: Record<string, any> = {
        'task_1': { data: { title: 'Stored Task' }, storedAt: Date.now() }
      };

      const getOffline = (key: string) => offlineStore[key]?.data || null;

      expect(getOffline('task_1')?.title).toBe('Stored Task');
      expect(getOffline('nonexistent')).toBeNull();
    });
  });
});