"use client";

import * as Sentry from "@sentry/react";
import { logger } from "@/utils/logger";

/**
 * Initialize error tracking
 */
export function initializeErrorTracking(): void {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN || "",
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
      
      // Filter sensitive data
      beforeSend(event, hint) {
        // Remove API keys from error data
        if (event.request?.headers) {
          delete event.request.headers['Authorization'];
        }
        
        // Remove user data from context
        if (event.contexts?.user) {
          delete event.contexts.user.email;
        }
        
        return event;
      },
      
      // Ignore certain errors
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
      ],
    });

    logger.log('ErrorTracking', 'Sentry initialized');
  }
}

/**
 * Track custom error
 */
export function trackError(
  error: Error,
  context?: Record<string, any>
): void {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      contexts: {
        custom: context,
      },
    });
  }
  
  logger.error('ErrorTracking', error.message, context);
}

/**
 * Track custom message
 */
export function trackMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
): void {
  if (import.meta.env.PROD) {
    Sentry.captureMessage(message, level);
  }
  
  logger.log('ErrorTracking', message);
}

/**
 * Set user context
 */
export function setUserContext(userId: string, email?: string): void {
  if (import.meta.env.PROD) {
    Sentry.setUser({
      id: userId,
      // Don't send email for privacy
    });
  }
}

/**
 * Clear user context
 */
export function clearUserContext(): void {
  if (import.meta.env.PROD) {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
): void {
  if (import.meta.env.PROD) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }
}