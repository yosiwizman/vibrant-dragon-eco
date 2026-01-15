/**
 * Predictive Caching Service
 * Pre-caches likely user requests based on patterns and context
 */

import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  ttl: number;
  hits: number;
  predictedAt?: number;
}

interface UserPattern {
  action: string;
  timeOfDay: number; // Hour 0-23
  dayOfWeek: number; // 0-6
  frequency: number;
  lastOccurred: number;
}

class PredictiveCachingService {
  private cache: Map<string, CacheEntry> = new Map();
  private patterns: Map<string, UserPattern[]> = new Map();
  private maxCacheSize = 100;
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Update hit count
    entry.hits++;
    
    return entry.data as T;
  }

  /**
   * Set cache entry
   */
  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastUsed();
    }
    
    this.cache.set(key, {
      key,
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
    });
  }

  /**
   * Evict least used entries
   */
  private evictLeastUsed(): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].hits - b[1].hits);
    
    // Remove bottom 20%
    const toRemove = Math.ceil(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Record user action for pattern learning
   */
  recordAction(userId: string, action: string): void {
    const now = new Date();
    const pattern: UserPattern = {
      action,
      timeOfDay: now.getHours(),
      dayOfWeek: now.getDay(),
      frequency: 1,
      lastOccurred: Date.now(),
    };
    
    const userPatterns = this.patterns.get(userId) || [];
    
    // Find existing pattern
    const existing = userPatterns.find(p => 
      p.action === action && 
      Math.abs(p.timeOfDay - pattern.timeOfDay) <= 1
    );
    
    if (existing) {
      existing.frequency++;
      existing.lastOccurred = Date.now();
    } else {
      userPatterns.push(pattern);
    }
    
    this.patterns.set(userId, userPatterns);
  }

  /**
   * Predict and pre-cache likely requests
   */
  async predictAndCache(userId: string): Promise<void> {
    const userPatterns = this.patterns.get(userId) || [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    
    // Find patterns that match current time
    const likelyPatterns = userPatterns.filter(p => 
      Math.abs(p.timeOfDay - currentHour) <= 1 &&
      (p.dayOfWeek === currentDay || p.frequency > 5)
    ).sort((a, b) => b.frequency - a.frequency);
    
    // Pre-cache top 3 likely requests
    for (const pattern of likelyPatterns.slice(0, 3)) {
      await this.preCacheAction(userId, pattern.action);
    }
  }

  /**
   * Pre-cache specific action data
   */
  private async preCacheAction(userId: string, action: string): Promise<void> {
    const cacheKey = `${userId}:${action}`;
    
    // Skip if already cached
    if (this.get(cacheKey)) return;
    
    try {
      let data: any = null;
      
      switch (action) {
        case 'get_tasks':
          const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(20);
          data = tasks;
          break;
          
        case 'get_reminders':
          const { data: reminders } = await supabase
            .from('reminders')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'pending')
            .order('due_time', { ascending: true })
            .limit(20);
          data = reminders;
          break;
          
        case 'get_notes':
          const { data: notes } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(20);
          data = notes;
          break;
          
        case 'get_calendar':
          const { data: events } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('user_id', userId)
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true })
            .limit(20);
          data = events;
          break;
      }
      
      if (data) {
        this.set(cacheKey, data, 2 * 60 * 1000); // 2 minute TTL for predictions
        logger.log('PredictiveCache', `Pre-cached: ${action}`);
      }
    } catch (error) {
      logger.error('PredictiveCache', `Failed to pre-cache ${action}:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hitRate: number;
    topPatterns: { action: string; frequency: number }[];
  } {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, e) => sum + e.hits, 0);
    const totalRequests = entries.length + totalHits;
    
    // Aggregate patterns across all users
    const patternCounts: Record<string, number> = {};
    for (const patterns of this.patterns.values()) {
      for (const p of patterns) {
        patternCounts[p.action] = (patternCounts[p.action] || 0) + p.frequency;
      }
    }
    
    const topPatterns = Object.entries(patternCounts)
      .map(([action, frequency]) => ({ action, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
    
    return {
      size: this.cache.size,
      hitRate: totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0,
      topPatterns,
    };
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear patterns
   */
  clearPatterns(): void {
    this.patterns.clear();
  }
}

export const predictiveCache = new PredictiveCachingService();