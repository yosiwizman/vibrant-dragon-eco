/**
 * Centralized API Client
 * Handles all external API calls with:
 * - Automatic retry with exponential backoff
 * - Request deduplication
 * - Timeout handling
 * - Consistent error formatting
 * - Request/response logging
 */

import { logger } from '@/utils/logger';

export interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  status: number;
  ok: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Request deduplication cache
const pendingRequests = new Map<string, Promise<any>>();

// Default configuration
const DEFAULT_CONFIG: Required<ApiClientConfig> = {
  baseUrl: '',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a cache key for request deduplication
 */
function getCacheKey(url: string, options: RequestInit): string {
  return `${options.method || 'GET'}:${url}:${options.body || ''}`;
}

/**
 * Check if an error is retryable
 */
function isRetryableError(status: number): boolean {
  // Retry on server errors and rate limiting
  return status >= 500 || status === 429 || status === 408;
}

/**
 * Make an API request with retry logic
 */
async function makeRequest<T>(
  url: string,
  options: RequestInit,
  config: Required<ApiClientConfig>,
  attempt: number = 1
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...config.headers,
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    // Parse response
    let data: T | null = null;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        // Response body might be empty
      }
    } else if (contentType?.includes('text/')) {
      data = await response.text() as any;
    }

    // Handle errors
    if (!response.ok) {
      const errorMessage = (data as any)?.error?.message || 
                          (data as any)?.message || 
                          `HTTP ${response.status}`;

      // Retry on retryable errors
      if (isRetryableError(response.status) && attempt < config.retries) {
        const delay = config.retryDelay * Math.pow(2, attempt - 1);
        logger.warn('ApiClient', `Request failed (attempt ${attempt}/${config.retries}), retrying in ${delay}ms...`, {
          url,
          status: response.status,
        });
        await sleep(delay);
        return makeRequest<T>(url, options, config, attempt + 1);
      }

      return {
        data: null,
        error: errorMessage,
        status: response.status,
        ok: false,
      };
    }

    return {
      data,
      error: null,
      status: response.status,
      ok: true,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Handle abort/timeout
    if (error.name === 'AbortError') {
      if (attempt < config.retries) {
        logger.warn('ApiClient', `Request timed out (attempt ${attempt}/${config.retries}), retrying...`, { url });
        await sleep(config.retryDelay);
        return makeRequest<T>(url, options, config, attempt + 1);
      }
      return {
        data: null,
        error: 'Request timed out',
        status: 408,
        ok: false,
      };
    }

    // Handle network errors
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      if (attempt < config.retries) {
        logger.warn('ApiClient', `Network error (attempt ${attempt}/${config.retries}), retrying...`, { url });
        await sleep(config.retryDelay * Math.pow(2, attempt - 1));
        return makeRequest<T>(url, options, config, attempt + 1);
      }
      return {
        data: null,
        error: 'Network error - please check your connection',
        status: 0,
        ok: false,
      };
    }

    return {
      data: null,
      error: error.message || 'Unknown error',
      status: 0,
      ok: false,
    };
  }
}

/**
 * Create an API client instance
 */
export function createApiClient(config: ApiClientConfig = {}) {
  const mergedConfig: Required<ApiClientConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
    headers: {
      ...DEFAULT_CONFIG.headers,
      ...config.headers,
    },
  };

  return {
    /**
     * GET request
     */
    async get<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
      const url = `${mergedConfig.baseUrl}${endpoint}`;
      const cacheKey = getCacheKey(url, { ...options, method: 'GET' });

      // Check for pending request
      if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey)!;
      }

      const promise = makeRequest<T>(url, { ...options, method: 'GET' }, mergedConfig);
      pendingRequests.set(cacheKey, promise);

      try {
        return await promise;
      } finally {
        pendingRequests.delete(cacheKey);
      }
    },

    /**
     * POST request
     */
    async post<T>(endpoint: string, body?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
      const url = `${mergedConfig.baseUrl}${endpoint}`;
      return makeRequest<T>(
        url,
        {
          ...options,
          method: 'POST',
          body: body ? JSON.stringify(body) : undefined,
        },
        mergedConfig
      );
    },

    /**
     * PUT request
     */
    async put<T>(endpoint: string, body?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
      const url = `${mergedConfig.baseUrl}${endpoint}`;
      return makeRequest<T>(
        url,
        {
          ...options,
          method: 'PUT',
          body: body ? JSON.stringify(body) : undefined,
        },
        mergedConfig
      );
    },

    /**
     * DELETE request
     */
    async delete<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
      const url = `${mergedConfig.baseUrl}${endpoint}`;
      return makeRequest<T>(url, { ...options, method: 'DELETE' }, mergedConfig);
    },

    /**
     * PATCH request
     */
    async patch<T>(endpoint: string, body?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
      const url = `${mergedConfig.baseUrl}${endpoint}`;
      return makeRequest<T>(
        url,
        {
          ...options,
          method: 'PATCH',
          body: body ? JSON.stringify(body) : undefined,
        },
        mergedConfig
      );
    },
  };
}

// Pre-configured clients for common APIs
export const openaiClient = createApiClient({
  baseUrl: 'https://api.openai.com/v1',
  timeout: 60000, // OpenAI can be slow
  retries: 2,
});

export const anthropicClient = createApiClient({
  baseUrl: 'https://api.anthropic.com/v1',
  timeout: 60000,
  retries: 2,
  headers: {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
  },
});

// Default client for general use
export const apiClient = createApiClient();