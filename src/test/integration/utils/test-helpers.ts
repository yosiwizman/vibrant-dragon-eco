import { vi } from 'vitest';

// ============================================
// TYPES
// ============================================

export interface MockUser {
  id: string;
  email: string;
  created_at: string;
  [key: string]: unknown;
}

export interface MockTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  tags: string[];
  created_at: string;
  recurrence_rule?: string;
  recurrence_end_date?: string;
  [key: string]: unknown;
}

export interface MockNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  created_at: string;
  [key: string]: unknown;
}

export interface MockReminder {
  id: string;
  text: string;
  due_time: string;
  channel: string;
  status: string;
  [key: string]: unknown;
}

export interface MockWidget {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { w: number; h: number };
  config: Record<string, unknown>;
  [key: string]: unknown;
}

export interface MockSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  [key: string]: unknown;
}

export interface MockNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  scheduled_at: number | null;
  [key: string]: unknown;
}

// ============================================
// MOCK FACTORIES
// ============================================

export const createMockUser = (overrides: Record<string, unknown> = {}): MockUser => ({
  id: `user_${Date.now()}`,
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  ...overrides
});

export const createMockTask = (overrides: Record<string, unknown> = {}): MockTask => ({
  id: `task_${Date.now()}`,
  title: 'Test Task',
  description: '',
  status: 'pending',
  priority: 'medium',
  due_date: null,
  tags: [],
  created_at: new Date().toISOString(),
  ...overrides
});

export const createMockNote = (overrides: Record<string, unknown> = {}): MockNote => ({
  id: `note_${Date.now()}`,
  title: 'Test Note',
  content: '',
  tags: [],
  pinned: false,
  created_at: new Date().toISOString(),
  ...overrides
});

export const createMockReminder = (overrides: Record<string, unknown> = {}): MockReminder => ({
  id: `reminder_${Date.now()}`,
  text: 'Test Reminder',
  due_time: new Date(Date.now() + 3600000).toISOString(),
  channel: 'push',
  status: 'pending',
  ...overrides
});

export const createMockWidget = (type: string, overrides: Record<string, unknown> = {}): MockWidget => ({
  id: `widget_${Date.now()}`,
  type,
  position: { x: 0, y: 0 },
  size: { w: 2, h: 2 },
  config: {},
  ...overrides
});

export const createMockSession = (overrides: Record<string, unknown> = {}): MockSession => ({
  access_token: `token_${Date.now()}`,
  refresh_token: `refresh_${Date.now()}`,
  expires_at: Date.now() + 3600000,
  ...overrides
});

export const createMockNotification = (overrides: Record<string, unknown> = {}): MockNotification => ({
  id: `notif_${Date.now()}`,
  type: 'info',
  title: 'Test Notification',
  body: 'Test body',
  read: false,
  created_at: new Date().toISOString(),
  scheduled_at: null,
  ...overrides
});

// ============================================
// MOCK SERVICES
// ============================================

export const createMockSupabaseAuth = () => ({
  signIn: vi.fn().mockResolvedValue({ data: { user: createMockUser() }, error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  getSession: vi.fn().mockResolvedValue({ data: { session: createMockSession() }, error: null }),
  onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
});

export const createMockSupabaseDb = () => ({
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null })
  })
});

// ============================================
// ASYNC UTILITIES
// ============================================

export const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export const waitFor = async (
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) return;
    await wait(interval);
  }
  throw new Error('waitFor timeout');
};

export const measureTime = async <T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await operation();
  const duration = performance.now() - start;
  return { result, duration };
};

// ============================================
// STORAGE UTILITIES
// ============================================

export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(key => delete store[key]); }),
    get store() { return { ...store }; }
  };
};

// ============================================
// VALIDATION UTILITIES
// ============================================

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidUUID = (uuid: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
};

export const isValidISODate = (date: string): boolean => {
  const parsed = new Date(date);
  return !isNaN(parsed.getTime()) && date === parsed.toISOString();
};

// ============================================
// ERROR SIMULATION
// ============================================

export const createNetworkError = (): Error => new Error('Network request failed');
export const createTimeoutError = (): Error => new Error('Request timeout');
export const createAuthError = (): Error => new Error('Unauthorized: Invalid token');
export const createValidationError = (field: string): Error => new Error(`Validation failed: ${field}`);

// ============================================
// RETRY UTILITIES
// ============================================

export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 100
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await wait(delay * Math.pow(2, i)); // Exponential backoff
      }
    }
  }
  
  throw lastError;
};

// ============================================
// CACHE UTILITIES
// ============================================

export class TestCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private ttl: number;

  constructor(ttlMs: number = 60000) {
    this.ttl = ttlMs;
  }

  get(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}