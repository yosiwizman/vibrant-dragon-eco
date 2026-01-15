// Integration Test Suite Index
// This file exports all test utilities and can be used to run all tests

export * from './utils/test-helpers';

// Test modules are automatically discovered by vitest
// This file serves as documentation of the test structure

/**
 * Integration Test Structure:
 *
 * src/test/
 * ├── setup.ts               - Global test setup with browser API mocks
 * ├── README.md              - Test documentation
 * ├── verify-setup.test.ts   - Setup verification tests
 * ├── orchestrator.test.ts   - Orchestrator parser and tools tests
 * ├── executor.test.ts       - Tool executor tests
 * ├── voice-commands.test.ts - Voice command parsing tests
 * ├── voice-preview.test.ts  - Voice preview functionality tests
 * ├── voice-system.test.ts   - Voice system integration tests
 * ├── widget-system.test.ts  - Widget system tests
 * ├── widget-persistence.test.ts - Widget persistence tests
 * ├── accessibility.test.ts  - Accessibility tests
 * ├── e2e-smoke.test.ts      - End-to-end smoke tests
 * ├── integration.test.ts    - General integration tests
 * └── integration/
 *     ├── utils/
 *     │   └── test-helpers.ts    - Shared utilities, mocks, and helpers
 *     ├── auth.test.ts           - Authentication flow tests
 *     ├── voice.test.ts          - Voice system tests
 *     ├── tasks.test.ts          - Task management tests
 *     ├── widgets.test.ts        - Widget system tests
 *     ├── offline.test.ts        - Offline mode tests
 *     ├── notifications.test.ts  - Notification system tests
 *     ├── performance.test.ts    - Performance tests
 *     ├── error-handling.test.ts - Error handling tests
 *     ├── analytics.test.ts      - Analytics tests
 *     └── index.ts               - This file
 *
 * Running Tests:
 * - All tests: npm run test
 * - Watch mode: npm run test:watch
 * - Coverage: npm run test:coverage
 * - Specific file: npm run test src/test/orchestrator.test.ts
 * - Type check: npm run typecheck
 *
 * Test Categories:
 * 1. Orchestrator - Tool parsing, validation, execution
 * 2. Voice Commands - Command recognition, time parsing, priority extraction
 * 3. Authentication - Login, logout, session management
 * 4. Tasks - CRUD, status transitions, filtering, sorting
 * 5. Widgets - Layout, resize, collision, data refresh
 * 6. Offline - Queuing, sync, conflict resolution
 * 7. Notifications - Creation, preferences, scheduling
 * 8. Performance - Timing, caching, concurrency
 * 9. Error Handling - API errors, retry logic, circuit breaker
 * 10. Analytics - Event tracking, metrics, funnels
 * 11. Accessibility - ARIA, keyboard navigation, screen readers
 */

export const TEST_CATEGORIES = [
  'auth',
  'voice',
  'tasks',
  'widgets',
  'offline',
  'notifications',
  'performance',
  'error-handling',
  'analytics'
] as const;

export type TestCategory = typeof TEST_CATEGORIES[number];

// Re-export commonly used test utilities for convenience
export {
  createMockUser,
  createMockTask,
  createMockNote,
  createMockReminder,
  createMockWidget,
  createMockSession,
  createMockNotification,
  createMockSupabaseAuth,
  createMockSupabaseDb,
  wait,
  waitFor,
  measureTime,
  mockLocalStorage,
  isValidEmail,
  isValidUUID,
  isValidISODate,
  createNetworkError,
  createTimeoutError,
  createAuthError,
  createValidationError,
  withRetry,
  TestCache,
} from './utils/test-helpers';