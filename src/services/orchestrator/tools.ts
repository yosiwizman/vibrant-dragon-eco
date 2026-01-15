// Re-export everything from the modular tools structure
// This maintains backward compatibility while using the new modular architecture

export {
  // Combined tools array
  AVAILABLE_TOOLS,
  
  // Individual category arrays
  TIME_TOOLS,
  SYSTEM_TOOLS,
  TASK_TOOLS,
  REMINDER_TOOLS,
  NOTE_TOOLS,
  CALENDAR_TOOLS,
  CONTACT_TOOLS,
  APPOINTMENT_TOOLS,
  NOTIFICATION_TOOLS,
  MESSAGE_TOOLS,
  KNOWLEDGE_TOOLS,
  SEARCH_TOOLS,
  SCHEDULING_TOOLS,
  RECURRING_TOOLS,
  NAVIGATION_TOOLS,
  SETTINGS_TOOLS,
  WIDGET_TOOLS,
  LISTENING_TOOLS,
  
  // Utility functions
  getToolByName,
  getToolsByCategory,
  getAllToolNames,
  getAllCategories,
  toolExists,
  getToolCountByCategory,
  searchTools,
} from './tools/index';