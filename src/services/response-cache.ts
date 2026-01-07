"use client";

import { logger } from "@/utils/logger";

interface CacheEntry {
  response: string;
  timestamp: number;
  ttl: number;
  hits: number;
}

/**
 * Response Cache Service
 * Caches AI responses for common queries
 */
class ResponseCacheService {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 100;

  /**
   * Get cached response if available and fresh
   */
  get(query: string): string | null {
    const normalized = this.normalizeQuery(query);
    const entry = this.cache.get(normalized);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(normalized);
      return null;
    }

    // Increment hit counter
    entry.hits++;
    
    logger.log('ResponseCache', `Cache hit for: ${query.substring(0, 50)}`);
    return entry.response;
  }

  /**
   * Cache a response
   */
  set(query: string, response: string, ttl?: number): void {
    const normalized = this.normalizeQuery(query);
    
    // Determine TTL based on query type
    const cacheTTL = ttl || this.determineTTL(query);

    // Evict old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(normalized, {
      response,
      timestamp: Date.now(),
      ttl: cacheTTL,
      hits: 0,
    });

    logger.log('ResponseCache', `Cached response for: ${query.substring(0, 50)}`);
  }

  /**
   * Normalize query for better cache hits
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ');    // Normalize whitespace
  }

  /**
   * Determine TTL based on query type
   */
  private determineTTL(query: string): number {
    const lower = query.toLowerCase();

    // Time-sensitive queries (short TTL)
    if (lower.includes('weather')) return 30 * 60 * 1000; // 30 min
    if (lower.includes('time') || lower.includes('date')) return 60 * 1000; // 1 min
    if (lower.includes('calendar') || lower.includes('schedule')) return 5 * 60 * 1000; // 5 min

    // Data queries (medium TTL)
    if (lower.includes('task') || lower.includes('reminder')) return 5 * 60 * 1000; // 5 min
    if (lower.includes('note') || lower.includes('contact')) return 10 * 60 * 1000; // 10 min

    // Static queries (long TTL)
    if (lower.includes('how to') || lower.includes('what is')) return 24 * 60 * 60 * 1000; // 24 hours

    // Default
    return 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;

    this.cache.forEach((entry, key) => {
      if (entry.timestamp < lruTime) {
        lruTime = entry.timestamp;
        lruKey = key;
      }
    });

    if (lruKey) {
      this.cache.delete(lruKey);
      logger.log('ResponseCache', 'Evicted LRU entry');
    }
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    logger.log('ResponseCache', 'Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    totalHits: number;
    hitRate: number;
  } {
    let totalHits = 0;
    let totalRequests = 0;

    this.cache.forEach(entry => {
      totalHits += entry.hits;
      totalRequests += entry.hits + 1; // +1 for initial cache
    });

    return {
      size: this.cache.size,
      totalHits,
      hitRate: totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0,
    };
  }
}

export const responseCache = new ResponseCacheService();