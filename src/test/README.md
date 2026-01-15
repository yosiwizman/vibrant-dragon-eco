# Test Suite Documentation

## Overview

This project uses **Vitest** as the test runner with **React Testing Library** for component testing and **happy-dom** as the DOM environment.

## Test Structure

```
src/test/
├── setup.ts                    # Global test setup and mocks
├── integration.test.ts         # Legacy integration test exports
├── e2e-smoke.test.ts          # End-to-end smoke tests
├── accessibility.test.ts       # Accessibility compliance tests
├── voice-system.test.ts        # Voice system unit tests
├── voice-preview.test.ts       # Voice preview/TTS tests
├── widget-system.test.ts       # Widget layout tests
├── widget-persistence.test.ts  # Widget storage tests
├── integration/
│   ├── index.ts               # Integration test exports
│   ├── utils/
│   │   └── test-helpers.ts    # Shared test utilities
│   ├── auth.test.ts           # Authentication flow tests
│   ├── voice.test.ts          # Voice command tests
│   ├── tasks.test.ts          # Task management tests
│   ├── widgets.test.ts        # Widget system tests
│   ├── offline.test.ts        # Offline mode tests
│   ├── notifications.test.ts  # Notification tests
│   ├── performance.test.ts    # Performance tests
│   ├── error-handling.test.ts # Error handling tests
│   └── analytics.test.ts      # Analytics tests
└── README.md                   # This file
```

## Running Tests

### All Tests
```bash
npm run test
```

### Watch Mode
```bash
npm run test -- --watch
```

### With Coverage
```bash
npm run test:coverage
```

### Specific File
```bash
npm run test src/test/integration/auth.test.ts
```

### Specific Pattern
```bash
npm run test -- --grep "Authentication"
```

### UI Mode
```bash
npm run test:ui
```

## Test Categories

### 1. Unit Tests
- `voice-system.test.ts` - Voice command parsing, normalization
- `voice-preview.test.ts` - TTS synthesis, audio playback
- `widget-system.test.ts` - Widget layout algorithms

### 2. Integration Tests (`src/test/integration/`)
- `auth.test.ts` - Login, logout, session management
- `voice.test.ts` - Voice command flows
- `tasks.test.ts` - Task CRUD, filtering, sorting
- `widgets.test.ts` - Widget layout, resize, collision
- `offline.test.ts` - Offline queuing, sync, conflicts
- `notifications.test.ts` - Notification creation, preferences
- `performance.test.ts` - Timing, caching, concurrency
- `error-handling.test.ts` - API errors, retry logic
- `analytics.test.ts` - Event tracking, metrics

### 3. E2E Smoke Tests
- `e2e-smoke.test.ts` - Complete user flows

### 4. Accessibility Tests
- `accessibility.test.ts` - WCAG 2.1 AA compliance

## Test Utilities

### Mock Factories
```typescript
import {
  createMockUser,
  createMockTask,
  createMockWidget,
  createMockSession,
  createMockNotification,
} from '@/test/integration/utils/test-helpers';
```

### Async Utilities
```typescript
import {
  wait,
  waitFor,
  measureTime,
  withRetry,
} from '@/test/integration/utils/test-helpers';
```

### Mock Services
```typescript
import {
  createMockSupabaseAuth,
  createMockSupabaseDb,
  mockLocalStorage,
} from '@/test/integration/utils/test-helpers';
```

### Error Simulation
```typescript
import {
  createNetworkError,
  createTimeoutError,
  createAuthError,
  createValidationError,
} from '@/test/integration/utils/test-helpers';
```

## Writing Tests

### Basic Test Structure
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### Testing Async Code
```typescript
it('should handle async operations', async () => {
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});
```

### Testing with Mocks
```typescript
it('should call the API', async () => {
  const mockFn = vi.fn().mockResolvedValue({ data: 'test' });
  
  await mockFn();
  
  expect(mockFn).toHaveBeenCalled();
});
```

## Coverage Requirements

- **Statements**: 70%
- **Branches**: 60%
- **Functions**: 70%
- **Lines**: 70%

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up mocks in `afterEach`
3. **Descriptive Names**: Use clear, descriptive test names
4. **Single Assertion**: Prefer one assertion per test
5. **Mock External Dependencies**: Don't make real API calls
6. **Test Edge Cases**: Include error scenarios
7. **Keep Tests Fast**: Avoid unnecessary delays

## Troubleshooting

### Tests Not Found
- Ensure files end with `.test.ts` or `.spec.ts`
- Check `vitest.config.ts` include patterns

### Mock Not Working
- Ensure mock is set up before the code runs
- Check mock is properly cleared between tests

### Timeout Errors
- Increase timeout in `vitest.config.ts`
- Check for unresolved promises

### Import Errors
- Verify path aliases in `tsconfig.json`
- Check file exists at specified path