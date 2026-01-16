// Time executors
export { executeGetCurrentTime } from './time';

// System executors
export {
  executeGetSystemStatus,
  executeGetProductivityStats,
  executeUndoLastAction,
  executeGetDailySummary,
  executeReadTasks,
  executeReadReminders,
  executeReadNotes,
  executeReadCalendar,
} from './system';

// Task executors
export {
  executeCreateTask,
  executeGetTasks,
  executeCompleteTask,
  executeUpdateTask,
  executeRescheduleTask,
  executeGetOverdueTasks,
  executeDeleteTask,
  executeGetTaskStats,
  executeCreateRecurringTask,
} from './tasks';

// Reminder executors
export {
  executeCreateReminder,
  executeGetReminders,
  executeDeleteReminder,
  executeUpdateReminder,
  executeGetUpcomingReminders,
  executeSnoozeReminder,
  executeCreateRecurringReminder,
} from './reminders';

// Note executors
export {
  executeCreateNote,
  executeGetNotes,
  executeSearchNotes,
  executeUpdateNote,
  executeDeleteNote,
  executePinNote,
} from './notes';

// Calendar executors
export {
  executeCreateCalendarEvent,
  executeGetCalendarEvents,
  executeUpdateCalendarEvent,
  executeDeleteCalendarEvent,
} from './calendar';

// Contact executors
export {
  executeCreateContact,
  executeGetContacts,
  executeSearchContacts,
  executeUpdateContact,
  executeDeleteContact,
  executeCallContact,
  executeSendMessageToContact,
} from './contacts';

// Notification executors
export {
  executeSendNotification,
  executeGetNotifications,
  executeMarkNotificationRead,
  executeClearNotifications,
} from './notifications';

// Message executors
export {
  executeDraftEmail,
  executeDraftSMS,
  executeGetDrafts,
  executeDeleteDraft,
} from './messages';

// Knowledge executors
export {
  executeGetKnowledge,
  executeSaveMemory,
  executeGetMemories,
  executeSearchKnowledgeBase,
  executeAddToKnowledgeBase,
  executeAddKnowledge,
} from './knowledge';

// Search executors
export {
  executeWebSearch,
  executeGetWeather,
  executeFindNearby,
} from './search';

// Scheduling executors
export {
  executeCheckScheduleConflicts,
  executeGetSchedulingSuggestions,
  executeGetScheduleAnalysis,
  executeLearnUserPatterns,
  executeCreatePatternReminder,
} from './scheduling';

// Listening mode executors
export {
  executeStartListeningMode,
  executeEndListeningMode,
  executeGetListeningStatus,
  executeGetListeningSessions,
} from './listening';

// Navigation executors
export { executeNavigateTo } from './navigation';

// Recurring executors
export {
  executeGetRecurringItems,
  executeCancelRecurringSeries,
} from './recurring';

// Appointment executors
export {
  executeCreateAppointment,
  executeGetAppointments,
  executeCancelAppointment,
  executeRescheduleAppointment,
} from './appointments';

// Second Brain executors
export {
  executeStartSecondBrain,
  executeStopSecondBrain,
  executeEnterPrivacyMode,
  executeExitPrivacyMode,
  executeSearchConversations,
  executeGetConversationsWith,
  executeGetItemsFromConversation,
  executeEnableFactChecking,
  executeDisableFactChecking,
  executeGetSecondBrainStatus,
  executeClearConversationMemory,
  executeNameSpeaker,
  executeGetDetectedSpeakers,
  executeWhisperMessage,
  executeSetWhisperVolume,
} from './second-brain';