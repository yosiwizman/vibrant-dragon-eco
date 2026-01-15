/**
 * Centralized Database Service
 * Provides a consistent interface for all database operations with:
 * - Automatic retry on transient failures
 * - Connection health monitoring
 * - Query result caching
 * - Consistent error handling
 * - Type-safe operations
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface DatabaseResult<T> {
  data: T | null;
  error: string | null;
  count?: number;
}

export interface QueryOptions {
  cache?: boolean;
  cacheTTL?: number; // milliseconds
  retries?: number;
}

// Simple in-memory cache
const queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Default options
const DEFAULT_OPTIONS: Required<QueryOptions> = {
  cache: false,
  cacheTTL: 60000, // 1 minute
  retries: 3,
};

/**
 * Generate cache key for a query
 */
function getCacheKey(table: string, operation: string, params: any): string {
  return `${table}:${operation}:${JSON.stringify(params)}`;
}

/**
 * Get cached result if valid
 */
function getCachedResult<T>(key: string): T | null {
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    logger.debug('DatabaseService', 'Cache hit', { key });
    return cached.data;
  }
  if (cached) {
    queryCache.delete(key);
  }
  return null;
}

/**
 * Set cache result
 */
function setCacheResult(key: string, data: any, ttl: number): void {
  queryCache.set(key, { data, timestamp: Date.now(), ttl });
}

/**
 * Clear cache for a table (call after mutations)
 */
export function clearTableCache(table: string): void {
  for (const key of queryCache.keys()) {
    if (key.startsWith(`${table}:`)) {
      queryCache.delete(key);
    }
  }
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  queryCache.clear();
}

/**
 * Execute a database operation with retry logic
 */
async function executeWithRetry<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  retries: number
): Promise<DatabaseResult<T>> {
  let lastError: any = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data, error } = await operation();

      if (error) {
        // Check if error is retryable
        const isRetryable = 
          error.code === 'PGRST301' || // Connection error
          error.code === '40001' || // Serialization failure
          error.code === '40P01' || // Deadlock
          error.message?.includes('network') ||
          error.message?.includes('timeout');

        if (isRetryable && attempt < retries) {
          logger.warn('DatabaseService', `Retryable error (attempt ${attempt}/${retries})`, { error: error.message });
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }

        return {
          data: null,
          error: error.message || 'Database operation failed',
        };
      }

      return { data, error: null };
    } catch (err: any) {
      lastError = err;
      if (attempt < retries) {
        logger.warn('DatabaseService', `Exception (attempt ${attempt}/${retries})`, { error: err.message });
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  return {
    data: null,
    error: lastError?.message || 'Database operation failed after retries',
  };
}

/**
 * Database service for a specific table
 */
export function createTableService<T extends Record<string, any>>(tableName: string) {
  return {
    /**
     * Select records
     */
    async select(
      columns: string = '*',
      filters?: Record<string, any>,
      options: QueryOptions = {}
    ): Promise<DatabaseResult<T[]>> {
      const opts = { ...DEFAULT_OPTIONS, ...options };
      const cacheKey = getCacheKey(tableName, 'select', { columns, filters });

      // Check cache
      if (opts.cache) {
        const cached = getCachedResult<T[]>(cacheKey);
        if (cached) return { data: cached, error: null };
      }

      const result = await executeWithRetry<T[]>(async () => {
        let query = supabase.from(tableName).select(columns);

        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            if (value === null) {
              query = query.is(key, null);
            } else if (Array.isArray(value)) {
              query = query.in(key, value);
            } else if (typeof value === 'object' && value.operator) {
              // Handle special operators
              switch (value.operator) {
                case 'gt':
                  query = query.gt(key, value.value);
                  break;
                case 'gte':
                  query = query.gte(key, value.value);
                  break;
                case 'lt':
                  query = query.lt(key, value.value);
                  break;
                case 'lte':
                  query = query.lte(key, value.value);
                  break;
                case 'like':
                  query = query.like(key, value.value);
                  break;
                case 'ilike':
                  query = query.ilike(key, value.value);
                  break;
                case 'neq':
                  query = query.neq(key, value.value);
                  break;
              }
            } else {
              query = query.eq(key, value);
            }
          }
        }

        return query;
      }, opts.retries);

      // Cache successful results
      if (opts.cache && result.data) {
        setCacheResult(cacheKey, result.data, opts.cacheTTL);
      }

      return result;
    },

    /**
     * Select a single record
     */
    async selectOne(
      columns: string = '*',
      filters: Record<string, any>,
      options: QueryOptions = {}
    ): Promise<DatabaseResult<T>> {
      const opts = { ...DEFAULT_OPTIONS, ...options };
      const cacheKey = getCacheKey(tableName, 'selectOne', { columns, filters });

      if (opts.cache) {
        const cached = getCachedResult<T>(cacheKey);
        if (cached) return { data: cached, error: null };
      }

      const result = await executeWithRetry<T>(async () => {
        let query = supabase.from(tableName).select(columns);

        for (const [key, value] of Object.entries(filters)) {
          query = query.eq(key, value);
        }

        return query.single();
      }, opts.retries);

      if (opts.cache && result.data) {
        setCacheResult(cacheKey, result.data, opts.cacheTTL);
      }

      return result;
    },

    /**
     * Insert a record
     */
    async insert(
      data: Partial<T>,
      options: QueryOptions = {}
    ): Promise<DatabaseResult<T>> {
      const opts = { ...DEFAULT_OPTIONS, ...options };

      const result = await executeWithRetry<T>(async () => {
        return supabase.from(tableName).insert(data).select().single();
      }, opts.retries);

      // Clear cache on mutation
      if (result.data) {
        clearTableCache(tableName);
      }

      return result;
    },

    /**
     * Insert multiple records
     */
    async insertMany(
      data: Partial<T>[],
      options: QueryOptions = {}
    ): Promise<DatabaseResult<T[]>> {
      const opts = { ...DEFAULT_OPTIONS, ...options };

      const result = await executeWithRetry<T[]>(async () => {
        return supabase.from(tableName).insert(data).select();
      }, opts.retries);

      if (result.data) {
        clearTableCache(tableName);
      }

      return result;
    },

    /**
     * Update records
     */
    async update(
      data: Partial<T>,
      filters: Record<string, any>,
      options: QueryOptions = {}
    ): Promise<DatabaseResult<T>> {
      const opts = { ...DEFAULT_OPTIONS, ...options };

      const result = await executeWithRetry<T>(async () => {
        let query = supabase.from(tableName).update(data);

        for (const [key, value] of Object.entries(filters)) {
          query = query.eq(key, value);
        }

        return query.select().single();
      }, opts.retries);

      if (result.data) {
        clearTableCache(tableName);
      }

      return result;
    },

    /**
     * Upsert a record
     */
    async upsert(
      data: Partial<T>,
      options: QueryOptions = {}
    ): Promise<DatabaseResult<T>> {
      const opts = { ...DEFAULT_OPTIONS, ...options };

      const result = await executeWithRetry<T>(async () => {
        return supabase.from(tableName).upsert(data).select().single();
      }, opts.retries);

      if (result.data) {
        clearTableCache(tableName);
      }

      return result;
    },

    /**
     * Delete records
     */
    async delete(
      filters: Record<string, any>,
      options: QueryOptions = {}
    ): Promise<DatabaseResult<null>> {
      const opts = { ...DEFAULT_OPTIONS, ...options };

      const result = await executeWithRetry<null>(async () => {
        let query = supabase.from(tableName).delete();

        for (const [key, value] of Object.entries(filters)) {
          query = query.eq(key, value);
        }

        return query;
      }, opts.retries);

      clearTableCache(tableName);

      return result;
    },

    /**
     * Count records
     */
    async count(
      filters?: Record<string, any>,
      options: QueryOptions = {}
    ): Promise<DatabaseResult<number>> {
      const opts = { ...DEFAULT_OPTIONS, ...options };

      const result = await executeWithRetry<{ count: number }>(async () => {
        let query = supabase.from(tableName).select('*', { count: 'exact', head: true });

        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            query = query.eq(key, value);
          }
        }

        const { count, error } = await query;
        return { data: { count: count || 0 }, error };
      }, opts.retries);

      return {
        data: result.data?.count ?? null,
        error: result.error,
      };
    },
  };
}

// Pre-configured services for common tables
export const tasksService = createTableService<{
  id: string;
  user_id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  due_date?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}>('tasks');

export const remindersService = createTableService<{
  id: string;
  user_id: string;
  text: string;
  due_time: string;
  channel: string;
  status: string;
  created_at: string;
}>('reminders');

export const notesService = createTableService<{
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags?: string[];
  pinned: boolean;
  created_at: string;
  updated_at: string;
}>('notes');

export const contactsService = createTableService<{
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  created_at: string;
}>('contacts');

export const calendarEventsService = createTableService<{
  id: string;
  user_id: string;
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
  description?: string;
  attendees?: string;
  created_at: string;
  updated_at: string;
}>('calendar_events');

export const notificationsService = createTableService<{
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}>('notifications');

export const knowledgeService = createTableService<{
  id: string;
  user_id: string;
  category: string;
  key: string;
  value: string;
  created_at: string;
}>('knowledge');

export const appointmentsService = createTableService<{
  id: string;
  user_id: string;
  contact_name?: string;
  contact_phone?: string;
  start_time: string;
  end_time?: string;
  notes?: string;
  status: string;
  created_at: string;
}>('appointments');