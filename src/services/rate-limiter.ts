"use client";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  costPerRequest?: number;
  maxCostPerWindow?: number;
}

interface RequestRecord {
  timestamp: number;
  cost?: number;
}

class RateLimiter {
  private requests: Map<string, RequestRecord[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if a request is allowed
   * @param key - Unique identifier (e.g., user ID, API endpoint)
   * @param cost - Optional cost of this request
   * @returns Object with allowed status and remaining info
   */
  checkLimit(key: string, cost: number = 1): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    reason?: string;
  } {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get existing requests for this key
    let keyRequests = this.requests.get(key) || [];

    // Remove old requests outside the window
    keyRequests = keyRequests.filter(req => req.timestamp > windowStart);

    // Check request count limit
    if (keyRequests.length >= this.config.maxRequests) {
      const oldestRequest = keyRequests[0];
      const resetAt = oldestRequest.timestamp + this.config.windowMs;
      
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        reason: `Rate limit exceeded. Max ${this.config.maxRequests} requests per ${this.config.windowMs / 1000}s`,
      };
    }

    // Check cost limit if configured
    if (this.config.maxCostPerWindow && cost) {
      const totalCost = keyRequests.reduce((sum, req) => sum + (req.cost || 0), 0);
      
      if (totalCost + cost > this.config.maxCostPerWindow) {
        const oldestRequest = keyRequests[0];
        const resetAt = oldestRequest.timestamp + this.config.windowMs;
        
        return {
          allowed: false,
          remaining: 0,
          resetAt,
          reason: `Cost limit exceeded. Max $${this.config.maxCostPerWindow} per ${this.config.windowMs / 1000}s`,
        };
      }
    }

    // Request is allowed
    keyRequests.push({ timestamp: now, cost });
    this.requests.set(key, keyRequests);

    const remaining = this.config.maxRequests - keyRequests.length;
    const resetAt = now + this.config.windowMs;

    return {
      allowed: true,
      remaining,
      resetAt,
    };
  }

  /**
   * Reset limits for a specific key
   */
  reset(key: string) {
    this.requests.delete(key);
  }

  /**
   * Clear all limits
   */
  clearAll() {
    this.requests.clear();
  }

  /**
   * Get current usage for a key
   */
  getUsage(key: string): {
    count: number;
    totalCost: number;
    oldestRequest: number | null;
  } {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const keyRequests = (this.requests.get(key) || []).filter(
      req => req.timestamp > windowStart
    );

    return {
      count: keyRequests.length,
      totalCost: keyRequests.reduce((sum, req) => sum + (req.cost || 0), 0),
      oldestRequest: keyRequests.length > 0 ? keyRequests[0].timestamp : null,
    };
  }
}

// Pre-configured rate limiters for different services
export const openAIRateLimiter = new RateLimiter({
  maxRequests: 60, // 60 requests
  windowMs: 60 * 1000, // per minute
  maxCostPerWindow: 1.0, // Max $1 per minute
  costPerRequest: 0.01, // Estimated cost per request
});

export const voiceRateLimiter = new RateLimiter({
  maxRequests: 30, // 30 voice commands
  windowMs: 60 * 1000, // per minute
});

export const widgetRateLimiter = new RateLimiter({
  maxRequests: 100, // 100 widget updates
  windowMs: 60 * 1000, // per minute
});

export const supabaseRateLimiter = new RateLimiter({
  maxRequests: 200, // 200 database queries
  windowMs: 60 * 1000, // per minute
});

/**
 * Utility function to check and enforce rate limit
 */
export async function withRateLimit<T>(
  limiter: RateLimiter,
  key: string,
  fn: () => Promise<T>,
  cost?: number
): Promise<T> {
  const check = limiter.checkLimit(key, cost);

  if (!check.allowed) {
    const waitTime = Math.ceil((check.resetAt - Date.now()) / 1000);
    throw new Error(
      check.reason || `Rate limit exceeded. Try again in ${waitTime} seconds.`
    );
  }

  return await fn();
}

/**
 * React hook for rate limiting
 */
export function useRateLimit(limiter: RateLimiter, key: string) {
  const checkLimit = (cost?: number) => {
    return limiter.checkLimit(key, cost);
  };

  const getUsage = () => {
    return limiter.getUsage(key);
  };

  const reset = () => {
    limiter.reset(key);
  };

  return { checkLimit, getUsage, reset };
}