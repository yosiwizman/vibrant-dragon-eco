/**
 * useAsyncOperation Hook
 * Provides consistent handling for async operations with:
 * - Loading state management
 * - Error handling with user-friendly messages
 * - Success callbacks
 * - Automatic cleanup on unmount
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { showError, showSuccess } from '@/utils/toast';
import { logger } from '@/utils/logger';

export interface AsyncOperationState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
}

export interface AsyncOperationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  successMessage?: string;
  errorMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  logErrors?: boolean;
}

export interface UseAsyncOperationReturn<T, P extends any[]> {
  execute: (...params: P) => Promise<T | null>;
  reset: () => void;
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
}

const DEFAULT_OPTIONS: AsyncOperationOptions<any> = {
  showSuccessToast: false,
  showErrorToast: true,
  logErrors: true,
};

export function useAsyncOperation<T, P extends any[] = []>(
  asyncFn: (...params: P) => Promise<T>,
  options: AsyncOperationOptions<T> = {}
): UseAsyncOperationReturn<T, P> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    isLoading: false,
    error: null,
    isSuccess: false,
  });

  // Track if component is mounted
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const execute = useCallback(async (...params: P): Promise<T | null> => {
    // Abort any pending request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      isSuccess: false,
    }));

    try {
      const result = await asyncFn(...params);

      if (!isMountedRef.current) return null;

      setState({
        data: result,
        isLoading: false,
        error: null,
        isSuccess: true,
      });

      if (opts.showSuccessToast && opts.successMessage) {
        showSuccess(opts.successMessage);
      }

      opts.onSuccess?.(result);
      return result;
    } catch (err: any) {
      if (!isMountedRef.current) return null;

      // Ignore abort errors
      if (err.name === 'AbortError') return null;

      const errorMessage = opts.errorMessage || err.message || 'An error occurred';

      if (opts.logErrors) {
        logger.error('useAsyncOperation', errorMessage, { error: err });
      }

      setState({
        data: null,
        isLoading: false,
        error: errorMessage,
        isSuccess: false,
      });

      if (opts.showErrorToast) {
        showError(errorMessage);
      }

      opts.onError?.(errorMessage);
      return null;
    }
  }, [asyncFn, opts]);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setState({
      data: null,
      isLoading: false,
      error: null,
      isSuccess: false,
    });
  }, []);

  return {
    execute,
    reset,
    ...state,
  };
}

/**
 * Hook for mutations (create, update, delete operations)
 */
export function useMutation<T, P extends any[] = []>(
  mutationFn: (...params: P) => Promise<T>,
  options: AsyncOperationOptions<T> = {}
) {
  return useAsyncOperation(mutationFn, {
    showSuccessToast: true,
    showErrorToast: true,
    ...options,
  });
}

/**
 * Hook for queries (read operations)
 */
export function useQuery<T, P extends any[] = []>(
  queryFn: (...params: P) => Promise<T>,
  options: AsyncOperationOptions<T> = {}
) {
  return useAsyncOperation(queryFn, {
    showSuccessToast: false,
    showErrorToast: true,
    ...options,
  });
}