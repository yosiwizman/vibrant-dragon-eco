"use client";

import posthog from 'posthog-js';
import { logger } from '@/utils/logger';

/**
 * Initialize PostHog analytics
 */
export function initializePostHog(): void {
  if (import.meta.env.PROD && import.meta.env.VITE_POSTHOG_KEY) {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: 'https://app.posthog.com',
      autocapture: false, // Manual tracking only for privacy
      capture_pageview: false, // We'll track manually
      disable_session_recording: true, // Privacy-first
    });

    logger.log('PostHog', 'Initialized');
  }
}

/**
 * Track page view
 */
export function trackPageView(path: string): void {
  if (import.meta.env.PROD) {
    posthog.capture('$pageview', { path });
  }
}

/**
 * Track event
 */
export function trackEvent(
  event: string,
  properties?: Record<string, any>
): void {
  if (import.meta.env.PROD) {
    posthog.capture(event, properties);
  }
  
  logger.log('PostHog', `Event: ${event}`, properties);
}

/**
 * Identify user
 */
export function identifyUser(userId: string, properties?: Record<string, any>): void {
  if (import.meta.env.PROD) {
    posthog.identify(userId, properties);
  }
}

/**
 * Reset user
 */
export function resetUser(): void {
  if (import.meta.env.PROD) {
    posthog.reset();
  }
}