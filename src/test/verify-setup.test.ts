import { describe, it, expect } from 'vitest';

/**
 * Simple verification test to ensure the test setup is working correctly.
 * If this test passes, the test infrastructure is properly configured.
 */
describe('Test Setup Verification', () => {
  it('should have vitest configured correctly', () => {
    expect(true).toBe(true);
  });

  it('should have access to global test utilities', () => {
    expect(typeof describe).toBe('function');
    expect(typeof it).toBe('function');
    expect(typeof expect).toBe('function');
  });

  it('should have DOM environment available', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });

  it('should have localStorage mock available', () => {
    expect(typeof window.localStorage).toBe('object');
    expect(typeof window.localStorage.getItem).toBe('function');
    expect(typeof window.localStorage.setItem).toBe('function');
  });

  it('should have path aliases working', async () => {
    // This import should work with the @ alias
    const { createMockUser } = await import('@/test/integration/utils/test-helpers');
    expect(typeof createMockUser).toBe('function');
    
    const user = createMockUser();
    expect(user.id).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });

  it('should support async/await', async () => {
    const result = await Promise.resolve('async works');
    expect(result).toBe('async works');
  });

  it('should support timers', async () => {
    const start = Date.now();
    await new Promise(resolve => setTimeout(resolve, 10));
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(10);
  });
});