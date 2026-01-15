// Integration Test Suite Index
// This file exports all test utilities and can be used to run all tests

export * from './utils/test-helpers';

// Test modules are automatically discovered by vitest
// This file serves as documentation of the test structure

/**
 * Integration Test Structure:
 * 
 * src/test/integration/
 * ├── utils/
 * │   └── test-helpers.ts    - Shared utilities, mocks, and helpers
 * ├── auth.test.ts           - Authentication flow tests
 * ├── voice.test.ts          - Voice system tests
 * ├── tasks.test.ts          - Task management tests
 * ├── widgets.test.ts        - Widget system tests
 * ├── offline.test.ts        - Offline mode tests
 * ├── notifications.test.ts  - Notification system tests
 * ├── performance.test.ts    - Performance tests
 * ├── error-handling.test.ts - Error handling tests
 * ├── analytics.test.ts      - Analytics tests
 * └── index.ts               - This file
 * 
 * Running Tests:
 * - All tests: npm run test
 * - Specific file: npm run test src/test/integration/auth.test.ts
 * - Watch mode: npm run test -- --watch
 * 
 * Test Categories:
 * 1. Authentication - Login, logout, session management
 * 2. Voice - Command parsing, error handling, recording
 * 3. Tasks - CRUD, status transitions, filtering, sorting
 * 4. Widgets - Layout, resize, collision, data refresh
 * 5. Offline - Queuing, sync, conflict resolution
 * 6. Notifications - Creation, preferences, scheduling
 * 7. Performance - Timing, caching, concurrency
 * 8. Error Handling - API errors, retry logic, circuit breaker
 * 9. Analytics - Event tracking, metrics, funnels
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