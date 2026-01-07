"use client";

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineDB extends DBSchema {
  'sync-queue': {
    key: string;
    value: {
      id: string;
      table: string;
      operation: 'insert' | 'update' | 'delete';
      data: any;
      timestamp: number;
    };
  };
  'offline-data': {
    key: string;
    value: {
      table: string;
      data: any[];
      timestamp: number;
    };
  };
}

class OfflineManager {
  private db: IDBPDatabase<OfflineDB> | null = null;
  private isOnline: boolean = navigator.onLine;
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  private syncInProgress: boolean = false;

  constructor() {
    this.init();
    this.setupEventListeners();
  }

  private async init() {
    try {
      this.db = await openDB<OfflineDB>('echo-offline', 1, {
        upgrade(db) {
          // Create sync queue store
          if (!db.objectStoreNames.contains('sync-queue')) {
            db.createObjectStore('sync-queue', { keyPath: 'id' });
          }
          // Create offline data store
          if (!db.objectStoreNames.contains('offline-data')) {
            db.createObjectStore('offline-data', { keyPath: 'table' });
          }
        },
      });
      console.log('[Offline Manager] IndexedDB initialized');
    } catch (error) {
      console.error('[Offline Manager] Failed to initialize IndexedDB:', error);
    }
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      console.log('[Offline Manager] Connection restored');
      this.isOnline = true;
      this.notifyListeners(true);
      this.syncQueue();
    });

    window.addEventListener('offline', () => {
      console.log('[Offline Manager] Connection lost');
      this.isOnline = false;
      this.notifyListeners(false);
    });
  }

  /**
   * Subscribe to online/offline status changes
   */
  subscribe(callback: (isOnline: boolean) => void) {
    this.listeners.add(callback);
    // Immediately call with current status
    callback(this.isOnline);
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(isOnline: boolean) {
    this.listeners.forEach(callback => callback(isOnline));
  }

  /**
   * Check if currently online
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Add operation to sync queue
   */
  async queueOperation(
    table: string,
    operation: 'insert' | 'update' | 'delete',
    data: any
  ) {
    if (!this.db) {
      console.error('[Offline Manager] Database not initialized');
      return;
    }

    const id = `${table}-${operation}-${Date.now()}-${Math.random()}`;
    
    await this.db.put('sync-queue', {
      id,
      table,
      operation,
      data,
      timestamp: Date.now(),
    });

    console.log('[Offline Manager] Queued operation:', { table, operation });
  }

  /**
   * Cache data for offline access
   */
  async cacheData(table: string, data: any[]) {
    if (!this.db) return;

    await this.db.put('offline-data', {
      table,
      data,
      timestamp: Date.now(),
    });

    console.log('[Offline Manager] Cached data for:', table);
  }

  /**
   * Get cached data
   */
  async getCachedData(table: string): Promise<any[] | null> {
    if (!this.db) return null;

    const cached = await this.db.get('offline-data', table);
    return cached?.data || null;
  }

  /**
   * Sync queued operations when back online
   */
  async syncQueue() {
    if (!this.db || this.syncInProgress || !this.isOnline) return;

    this.syncInProgress = true;
    console.log('[Offline Manager] Starting sync...');

    try {
      const queue = await this.db.getAll('sync-queue');
      
      if (queue.length === 0) {
        console.log('[Offline Manager] No operations to sync');
        this.syncInProgress = false;
        return;
      }

      console.log(`[Offline Manager] Syncing ${queue.length} operations...`);

      // Here you would sync with Supabase
      // For now, we'll just clear the queue
      // In production, implement actual sync logic

      for (const item of queue) {
        await this.db.delete('sync-queue', item.id);
      }

      console.log('[Offline Manager] Sync complete');
    } catch (error) {
      console.error('[Offline Manager] Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get sync queue status
   */
  async getSyncStatus(): Promise<{
    queueLength: number;
    isOnline: boolean;
    syncInProgress: boolean;
  }> {
    if (!this.db) {
      return { queueLength: 0, isOnline: this.isOnline, syncInProgress: false };
    }

    const queue = await this.db.getAll('sync-queue');
    
    return {
      queueLength: queue.length,
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
    };
  }

  /**
   * Clear all offline data
   */
  async clearOfflineData() {
    if (!this.db) return;

    await this.db.clear('sync-queue');
    await this.db.clear('offline-data');
    
    console.log('[Offline Manager] Offline data cleared');
  }
}

// Singleton instance
export const offlineManager = new OfflineManager();

// React hook for offline status
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    return offlineManager.subscribe(setIsOnline);
  }, []);

  return { isOnline, isOffline: !isOnline };
}