/**
 * Application Constants
 * Centralized location for all magic numbers and configuration values
 */

// API Configuration
export const API_CONFIG = {
  TIMEOUT_MS: 30000,
  RETRY_COUNT: 3,
  RETRY_DELAY_MS: 1000,
  MAX_CONCURRENT_REQUESTS: 5,
} as const;

// Voice Configuration
export const VOICE_CONFIG = {
  DEFAULT_VOICE: 'nova',
  DEFAULT_SPEED: 1.0,
  MIN_SPEED: 0.5,
  MAX_SPEED: 2.0,
  SILENCE_TIMEOUT_MS: 2000,
  MIN_RECORDING_SIZE: 5000,
  MAX_RECORDING_DURATION_MS: 60000,
  WAKE_WORD_DEFAULT: 'echo',
} as const;

// UI Configuration
export const UI_CONFIG = {
  TOAST_DURATION_MS: 5000,
  DEBOUNCE_DELAY_MS: 300,
  THROTTLE_DELAY_MS: 200,
  ANIMATION_DURATION_MS: 200,
  INFINITE_SCROLL_THRESHOLD: 100,
  MAX_ITEMS_PER_PAGE: 50,
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL_MS: 60000, // 1 minute
  LONG_TTL_MS: 300000, // 5 minutes
  SHORT_TTL_MS: 10000, // 10 seconds
  MAX_CACHE_SIZE: 100,
} as const;

// Validation Limits
export const VALIDATION_LIMITS = {
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 5000,
  NOTE_CONTENT_MAX_LENGTH: 50000,
  REMINDER_TEXT_MAX_LENGTH: 500,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 254,
  PHONE_MAX_LENGTH: 20,
  TAG_MAX_LENGTH: 50,
  MAX_TAGS: 10,
} as const;

// Priority Levels
export const PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type Priority = typeof PRIORITIES[keyof typeof PRIORITIES];

// Task Status
export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];

// Reminder Status
export const REMINDER_STATUS = {
  PENDING: 'pending',
  TRIGGERED: 'triggered',
  DISMISSED: 'dismissed',
  SNOOZED: 'snoozed',
} as const;

export type ReminderStatus = typeof REMINDER_STATUS[keyof typeof REMINDER_STATUS];

// Notification Channels
export const NOTIFICATION_CHANNELS = {
  PUSH: 'push',
  SMS: 'sms',
  EMAIL: 'email',
} as const;

export type NotificationChannel = typeof NOTIFICATION_CHANNELS[keyof typeof NOTIFICATION_CHANNELS];

// Recurrence Frequencies
export const RECURRENCE_FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

export type RecurrenceFrequency = typeof RECURRENCE_FREQUENCIES[keyof typeof RECURRENCE_FREQUENCIES];

// Widget Types
export const WIDGET_TYPES = {
  CLOCK: 'clock',
  WEATHER: 'weather',
  TASKS: 'tasks',
  REMINDERS: 'reminders',
  NOTES: 'notes',
  CALENDAR: 'calendar',
  UPCOMING: 'upcoming',
  CONTACTS: 'contacts',
  MESSAGES: 'messages',
  LOCATION: 'location',
  PRODUCTIVITY: 'productivity',
  AI_USAGE: 'ai-usage',
  QUICK_ACTIONS: 'quick-actions',
  RECENT_ACTIVITY: 'recent-activity',
  STOCKS: 'stocks',
  NEWS: 'news',
} as const;

export type WidgetType = typeof WIDGET_TYPES[keyof typeof WIDGET_TYPES];

// OpenAI Voices
export const OPENAI_VOICES = {
  ALLOY: 'alloy',
  ECHO: 'echo',
  FABLE: 'fable',
  ONYX: 'onyx',
  NOVA: 'nova',
  SHIMMER: 'shimmer',
} as const;

export type OpenAIVoice = typeof OPENAI_VOICES[keyof typeof OPENAI_VOICES];

// Local Storage Keys
export const STORAGE_KEYS = {
  PREFERENCES: 'echo-preferences',
  WIDGET_LAYOUT: 'echo-widget-layout',
  ONBOARDING_COMPLETE: 'echo-onboarding-complete',
  LAST_SYNC: 'echo-last-sync',
  OFFLINE_QUEUE: 'echo-offline-queue',
} as const;

// Error Codes
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// Feature Flags (for gradual rollout)
export const FEATURE_FLAGS = {
  ENABLE_OFFLINE_AI: true,
  ENABLE_VOICE_WIDGETS: true,
  ENABLE_SMART_SCHEDULING: true,
  ENABLE_QUIET_MODE: true,
  ENABLE_ANALYTICS: true,
  ENABLE_STOCKS_WIDGET: true,
  ENABLE_NEWS_WIDGET: true,
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  CHAT: '/chat',
  VOICE: '/voice',
  TASKS: '/tasks',
  REMINDERS: '/reminders',
  NOTES: '/notes',
  CALENDAR: '/calendar',
  CONTACTS: '/contacts',
  MESSAGES: '/messages',
  APPOINTMENTS: '/appointments',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  KNOWLEDGE: '/knowledge',
  ANALYTICS: '/analytics',
  PRIVACY: '/privacy',
  TERMS: '/terms',
} as const;