import { describe, it, expect, vi } from 'vitest';
import { 
  wait, 
  withRetry, 
  createNetworkError, 
  createTimeoutError, 
  createAuthError 
} from './utils/test-helpers';

describe('Error Handling Integration', () => {
  describe('API Error Handling', () => {
    const handleApiError = async (apiCall: () => Promise<any>) => {
      try {
        return await apiCall();
      } catch (error) {
        const err = error as Error;
        return {
          error: err.message,
          fallback: true,
          retryable: !err.message.includes('Unauthorized')
        };
      }
    };

    it('should handle API errors gracefully', async () => {
      const failingApi = async () => {
        throw new Error('API Error: 500 Internal Server Error');
      };

      const result = await handleApiError(failingApi);

      expect(result.error).toBeDefined();
      expect(result.fallback).toBe(true);
    });

    it('should identify retryable errors', async () => {
      const networkError = async () => { throw createNetworkError(); };
      const authError = async () => { throw createAuthError(); };

      const networkResult = await handleApiError(networkError);
      const authResult = await handleApiError(authError);

      expect(networkResult.retryable).toBe(true);
      expect(authResult.retryable).toBe(false);
    });

    it('should return success for successful calls', async () => {
      const successApi = async () => ({ data: 'success' });

      const result = await handleApiError(successApi);

      expect(result.data).toBe('success');
      expect(result.error).toBeUndefined();
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;

      const unreliableApi = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return { success: true };
      };

      const result = await withRetry(unreliableApi, 5);

      expect(result.success).toBe(true);
      expect(attempts).toBe(3);
    });

    it('should throw after max retries', async () => {
      const alwaysFails = async () => {
        throw new Error('Permanent failure');
      };

      await expect(withRetry(alwaysFails, 3, 10)).rejects.toThrow('Permanent failure');
    });

    it('should succeed on first try if no error', async () => {
      let attempts = 0;

      const reliableApi = async () => {
        attempts++;
        return { success: true };
      };

      const result = await withRetry(reliableApi, 3);

      expect(result.success).toBe(true);
      expect(attempts).toBe(1);
    });

    it('should use exponential backoff', async () => {
      const delays: number[] = [];
      let lastCall = Date.now();

      const trackingApi = async () => {
        const now = Date.now();
        delays.push(now - lastCall);
        lastCall = now;
        if (delays.length < 3) throw new Error('Retry');
        return { success: true };
      };

      await withRetry(trackingApi, 5, 50);

      // Second delay should be longer than first (exponential backoff)
      expect(delays[2]).toBeGreaterThan(delays[1]);
    });
  });

  describe('Error Classification', () => {
    const classifyError = (error: Error): {
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      retryable: boolean;
    } => {
      const message = error.message.toLowerCase();

      if (message.includes('network') || message.includes('timeout')) {
        return { type: 'network', severity: 'medium', retryable: true };
      }
      if (message.includes('unauthorized') || message.includes('forbidden')) {
        return { type: 'auth', severity: 'high', retryable: false };
      }
      if (message.includes('not found')) {
        return { type: 'not_found', severity: 'low', retryable: false };
      }
      if (message.includes('server') || message.includes('500')) {
        return { type: 'server', severity: 'critical', retryable: true };
      }

      return { type: 'unknown', severity: 'medium', retryable: true };
    };

    it('should classify network errors', () => {
      const result = classifyError(createNetworkError());
      expect(result.type).toBe('network');
      expect(result.retryable).toBe(true);
    });

    it('should classify auth errors', () => {
      const result = classifyError(createAuthError());
      expect(result.type).toBe('auth');
      expect(result.retryable).toBe(false);
    });

    it('should classify timeout errors', () => {
      const result = classifyError(createTimeoutError());
      expect(result.type).toBe('network');
      expect(result.severity).toBe('medium');
    });

    it('should classify server errors as critical', () => {
      const result = classifyError(new Error('500 Internal Server Error'));
      expect(result.type).toBe('server');
      expect(result.severity).toBe('critical');
    });
  });

  describe('Error Recovery', () => {
    it('should recover with fallback data', async () => {
      const fallbackData = { items: [], fromCache: true };

      const fetchWithFallback = async () => {
        try {
          throw new Error('API unavailable');
        } catch {
          return fallbackData;
        }
      };

      const result = await fetchWithFallback();

      expect(result.fromCache).toBe(true);
    });

    it('should log errors for monitoring', async () => {
      const errorLog: Error[] = [];

      const logError = (error: Error) => {
        errorLog.push(error);
      };

      const apiWithLogging = async () => {
        try {
          throw new Error('Test error');
        } catch (error) {
          logError(error as Error);
          throw error;
        }
      };

      await expect(apiWithLogging()).rejects.toThrow();
      expect(errorLog).toHaveLength(1);
    });
  });

  describe('Circuit Breaker Pattern', () => {
    class CircuitBreaker {
      private failures = 0;
      private lastFailure = 0;
      private state: 'closed' | 'open' | 'half-open' = 'closed';
      
      constructor(
        private threshold: number = 3,
        private resetTimeout: number = 1000
      ) {}

      async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === 'open') {
          if (Date.now() - this.lastFailure > this.resetTimeout) {
            this.state = 'half-open';
          } else {
            throw new Error('Circuit breaker is open');
          }
        }

        try {
          const result = await fn();
          this.onSuccess();
          return result;
        } catch (error) {
          this.onFailure();
          throw error;
        }
      }

      private onSuccess() {
        this.failures = 0;
        this.state = 'closed';
      }

      private onFailure() {
        this.failures++;
        this.lastFailure = Date.now();
        if (this.failures >= this.threshold) {
          this.state = 'open';
        }
      }

      getState() {
        return this.state;
      }
    }

    it('should open circuit after threshold failures', async () => {
      const breaker = new CircuitBreaker(3, 100);
      const failingFn = async () => { throw new Error('Fail'); };

      // Trigger failures
      for (let i = 0; i < 3; i++) {
        try { await breaker.execute(failingFn); } catch {}
      }

      expect(breaker.getState()).toBe('open');
    });

    it('should reject calls when circuit is open', async () => {
      const breaker = new CircuitBreaker(1, 1000);
      const failingFn = async () => { throw new Error('Fail'); };

      try { await breaker.execute(failingFn); } catch {}

      await expect(breaker.execute(async () => 'success'))
        .rejects.toThrow('Circuit breaker is open');
    });

    it('should reset after timeout', async () => {
      const breaker = new CircuitBreaker(1, 50);
      const failingFn = async () => { throw new Error('Fail'); };

      try { await breaker.execute(failingFn); } catch {}
      
      await wait(60);

      // Should be half-open now, allowing one attempt
      const result = await breaker.execute(async () => 'success');
      expect(result).toBe('success');
      expect(breaker.getState()).toBe('closed');
    });
  });
});