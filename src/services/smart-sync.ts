"use client";

import { offlineManager } from "./offline-manager";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

interface SyncItem {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
  priority: number;
  retries: number;
}

interface SyncConflict {
  localItem: SyncItem;
  serverItem: any;
  conflictType: 'modified' | 'deleted' | 'duplicate';
}

const OPERATION_PRIORITIES = {
  'create_task': 10,
  'create_reminder': 10,
  'create_event': 10,
  'update_task': 5,
  'update_reminder': 5,
  'delete_task': 1,
  'delete_reminder': 1,
};

/**
 * Smart Sync Service
 * Intelligent sync queue with conflict resolution and priority ordering
 */
class SmartSyncService {
  private syncing = false;
  private conflictCallbacks: Set<(conflict: SyncConflict) => Promise<'local' | 'server' | 'merge'>> = new Set();

  /**
   * Sync queue with intelligence
   */
  async sync(userId: string): Promise<{
    synced: number;
    failed: number;
    conflicts: number;
  }> {
    if (this.syncing) {
      logger.warn('SmartSync', 'Sync already in progress');
      return { synced: 0, failed: 0, conflicts: 0 };
    }

    this.syncing = true;
    logger.log('SmartSync', 'Starting intelligent sync');

    let synced = 0;
    let failed = 0;
    let conflicts = 0;

    try {
      // Get sync queue
      const queue = await this.getQueue();
      
      if (queue.length === 0) {
        logger.log('SmartSync', 'No items to sync');
        return { synced, failed, conflicts };
      }

      // Sort by priority
      const sorted = this.prioritizeQueue(queue);

      // Sync each item
      for (const item of sorted) {
        try {
          // Check for conflicts
          const conflict = await this.detectConflict(item);
          
          if (conflict) {
            conflicts++;
            const resolution = await this.resolveConflict(conflict);
            
            if (resolution === 'skip') {
              continue;
            }
          }

          // Sync item
          await this.syncItem(item);
          synced++;
          
          // Remove from queue
          await this.removeFromQueue(item.id);
        } catch (error) {
          logger.error('SmartSync', `Failed to sync item ${item.id}:`, error);
          failed++;
          
          // Increment retry counter
          await this.incrementRetry(item.id);
        }
      }

      logger.log('SmartSync', `Sync complete: ${synced} synced, ${failed} failed, ${conflicts} conflicts`);
    } finally {
      this.syncing = false;
    }

    return { synced, failed, conflicts };
  }

  /**
   * Prioritize sync queue
   */
  private prioritizeQueue(queue: SyncItem[]): SyncItem[] {
    return queue.sort((a, b) => {
      // Sort by priority (higher first)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      
      // Then by timestamp (older first)
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Detect conflicts
   */
  private async detectConflict(item: SyncItem): Promise<SyncConflict | null> {
    if (item.operation === 'insert') {
      // Check for duplicates
      const { data: existing } = await supabase
        .from(item.table)
        .select('*')
        .eq('user_id', item.data.user_id)
        .eq('title', item.data.title) // Assuming title field
        .single();

      if (existing) {
        return {
          localItem: item,
          serverItem: existing,
          conflictType: 'duplicate',
        };
      }
    }

    if (item.operation === 'update' || item.operation === 'delete') {
      // Check if item still exists
      const { data: serverItem } = await supabase
        .from(item.table)
        .select('*')
        .eq('id', item.data.id)
        .single();

      if (!serverItem) {
        return {
          localItem: item,
          serverItem: null,
          conflictType: 'deleted',
        };
      }

      // Check if modified on server
      if (serverItem.updated_at && new Date(serverItem.updated_at) > new Date(item.timestamp)) {
        return {
          localItem: item,
          serverItem,
          conflictType: 'modified',
        };
      }
    }

    return null;
  }

  /**
   * Resolve conflict
   */
  private async resolveConflict(conflict: SyncConflict): Promise<'local' | 'server' | 'merge' | 'skip'> {
    // Auto-resolve simple conflicts
    if (conflict.conflictType === 'duplicate') {
      logger.log('SmartSync', 'Skipping duplicate item');
      return 'skip';
    }

    if (conflict.conflictType === 'deleted') {
      logger.log('SmartSync', 'Item deleted on server, skipping');
      return 'skip';
    }

    // For modified conflicts, ask user
    if (this.conflictCallbacks.size > 0) {
      for (const callback of this.conflictCallbacks) {
        const resolution = await callback(conflict);
        return resolution;
      }
    }

    // Default: use local (optimistic)
    logger.log('SmartSync', 'Using local version (default)');
    return 'local';
  }

  /**
   * Sync individual item
   */
  private async syncItem(item: SyncItem): Promise<void> {
    switch (item.operation) {
      case 'insert':
        await supabase.from(item.table).insert(item.data);
        break;
      
      case 'update':
        await supabase.from(item.table).update(item.data).eq('id', item.data.id);
        break;
      
      case 'delete':
        await supabase.from(item.table).delete().eq('id', item.data.id);
        break;
    }

    logger.log('SmartSync', `Synced ${item.operation} on ${item.table}`);
  }

  /**
   * Get sync queue
   */
  private async getQueue(): Promise<SyncItem[]> {
    // This would integrate with offlineManager
    // For now, return empty array
    return [];
  }

  /**
   * Remove from queue
   */
  private async removeFromQueue(id: string): Promise<void> {
    // Integrate with offlineManager
  }

  /**
   * Increment retry counter
   */
  private async incrementRetry(id: string): Promise<void> {
    // Integrate with offlineManager
  }

  /**
   * Subscribe to conflict resolution
   */
  onConflict(callback: (conflict: SyncConflict) => Promise<'local' | 'server' | 'merge'>): () => void {
    this.conflictCallbacks.add(callback);
    return () => this.conflictCallbacks.delete(callback);
  }

  /**
   * Subscribe to suggestions
   */
  subscribe(callback: (suggestions: Suggestion[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(cb => cb(this.suggestions));
  }
}

export const smartSync = new SmartSyncService();