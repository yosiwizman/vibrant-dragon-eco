export const DEMO_MODE_SENTINEL_KEY = '__DEMO_MODE__';

/**
 * Reads Demo Mode from localStorage preferences.
 * This is intentionally a non-hook utility for use in services.
 */
export function isDemoModeEnabled(): boolean {
  try {
    const raw = localStorage.getItem('echo:prefs');
    if (!raw) return false;
    const prefs = JSON.parse(raw);
    return prefs?.demoModeEnabled === true;
  } catch {
    return false;
  }
}
