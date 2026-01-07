"use client";

/**
 * Convert technical errors to user-friendly messages
 */
export function getUserFriendlyError(error: Error | string): string {
  const message = typeof error === 'string' ? error : error.message;
  const lower = message.toLowerCase();

  // Network errors
  if (lower.includes('network') || lower.includes('fetch')) {
    return "I'm having trouble connecting. Check your internet connection or try offline mode.";
  }

  // API errors
  if (lower.includes('api key') || lower.includes('unauthorized')) {
    return "Your API key seems invalid. Please check it in Settings.";
  }

  if (lower.includes('rate limit')) {
    return "You're sending commands too quickly. Please wait a moment and try again.";
  }

  if (lower.includes('quota') || lower.includes('billing')) {
    return "Your API quota has been exceeded. Check your OpenAI account or use offline mode.";
  }

  // Voice errors
  if (lower.includes('microphone') || lower.includes('permission')) {
    return "I need microphone permission. Please allow access in your browser settings.";
  }

  if (lower.includes('speech') || lower.includes('recognition')) {
    return "I couldn't hear you clearly. Try speaking closer to the microphone.";
  }

  // Offline errors
  if (lower.includes('offline') || lower.includes('not downloaded')) {
    return "Offline AI isn't set up yet. Download the model in Settings or connect to the internet.";
  }

  // Database errors
  if (lower.includes('database') || lower.includes('supabase')) {
    return "I'm having trouble saving your data. Your changes will sync when the connection is restored.";
  }

  // Generic fallback
  return "Something went wrong. Please try again or contact support if this persists.";
}

/**
 * Get actionable suggestion for error
 */
export function getErrorAction(error: Error | string): string | null {
  const message = typeof error === 'string' ? error : error.message;
  const lower = message.toLowerCase();

  if (lower.includes('network')) {
    return "Try switching to offline mode or check your connection.";
  }

  if (lower.includes('api key')) {
    return "Go to Settings → General → OpenAI API Key to update it.";
  }

  if (lower.includes('microphone')) {
    return "Click the lock icon in your browser's address bar to grant permission.";
  }

  if (lower.includes('offline')) {
    return "Go to Settings → General → Offline AI Mode to download the model.";
  }

  return null;
}

/**
 * Format error for display
 */
export interface FormattedError {
  title: string;
  message: string;
  action?: string;
  severity: 'error' | 'warning' | 'info';
}

export function formatError(error: Error | string): FormattedError {
  const message = getUserFriendlyError(error);
  const action = getErrorAction(error);
  
  const errorStr = typeof error === 'string' ? error : error.message;
  const lower = errorStr.toLowerCase();

  // Determine severity
  let severity: 'error' | 'warning' | 'info' = 'error';
  if (lower.includes('rate limit') || lower.includes('quota')) {
    severity = 'warning';
  }
  if (lower.includes('offline') && lower.includes('queued')) {
    severity = 'info';
  }

  return {
    title: severity === 'error' ? 'Error' : severity === 'warning' ? 'Warning' : 'Info',
    message,
    action: action || undefined,
    severity,
  };
}