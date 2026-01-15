/**
 * Integration Test Suite
 * 
 * This file has been refactored into a modular structure.
 * Individual test files are located in src/test/integration/
 * 
 * Test Structure:
 * - src/test/integration/utils/test-helpers.ts - Shared utilities
 * - src/test/integration/auth.test.ts - Authentication tests
 * - src/test/integration/voice.test.ts - Voice system tests
 * - src/test/integration/tasks.test.ts - Task management tests
 * - src/test/integration/widgets.test.ts - Widget system tests
 * - src/test/integration/offline.test.ts - Offline mode tests
 * - src/test/integration/notifications.test.ts - Notification tests
 * - src/test/integration/performance.test.ts - Performance tests
 * - src/test/integration/error-handling.test.ts - Error handling tests
 * - src/test/integration/analytics.test.ts - Analytics tests
 * 
 * Run all tests: npm run test
 * Run specific category: npm run test src/test/integration/auth.test.ts
 */

// Re-export test utilities for backward compatibility
export {
  createMockUser,
  createMockTask,
  createMockWidget,
  createMockSession,
  createMockNotification,
  wait,
  measureTime,
  withRetry,
  TestCache
} from './integration/utils/test-helpers';

// Legacy test utilities (for backward compatibility)
export const testUtils = {
  createMockUser: () => ({ id: 'test-user', email: 'test@example.com' }),
  createMockTask: (overrides = {}) => ({
    id: `task_${Date.now()}`,
    title: 'Test Task',
    status: 'pending',
    priority: 'medium',
    ...overrides
  }),
  createMockWidget: (type: string) => ({
    id: `widget_${Date.now()}`,
    type,
    position: { x: 0, y: 0 },
    size: { w: 2, h: 2 }
  }),
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
};