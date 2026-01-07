/**
 * Production-safe logger utility
 * Logs only in development mode, always logs errors
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Log informational messages (dev only)
   */
  log: (component: string, ...args: any[]) => {
    if (isDev) {
      console.log(`[${component}]`, ...args);
    }
  },

  /**
   * Log warnings (dev only)
   */
  warn: (component: string, ...args: any[]) => {
    if (isDev) {
      console.warn(`[${component}]`, ...args);
    }
  },

  /**
   * Log errors (always)
   */
  error: (component: string, ...args: any[]) => {
    console.error(`[${component}]`, ...args);
  },

  /**
   * Log debug info (dev only)
   */
  debug: (component: string, ...args: any[]) => {
    if (isDev) {
      console.debug(`[${component}]`, ...args);
    }
  },

  /**
   * Group logs (dev only)
   */
  group: (label: string, fn: () => void) => {
    if (isDev) {
      console.group(label);
      fn();
      console.groupEnd();
    }
  },
};