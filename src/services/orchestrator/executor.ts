import { ActionResult, ToolCall } from './types';

// Import all executors
import {
  executeGetCurrentTime,
  executeGetSystemStatus,
  executeCreateAppointment,
  executeGetAppointments,
  executeCancelAppointment,
  executeRescheduleAppointment,
  executeGetProductivityStats,
  executeUndoLastAction,
  executeGetDailySummary,
  executeReadTasks,
  executeReadReminders,
  executeReadNotes,
  executeReadCalendar,
  executeCreateTask,
  executeGetTasks,
  executeCompleteTask,
  executeUpdateTask,
  executeRescheduleTask,
  executeGetOverdueTasks,
  executeDeleteTask,
  executeGetTaskStats,
  executeCreateRecurringTask,
  executeCreateReminder,
  executeGetReminders,
  executeDeleteReminder,
  executeUpdateReminder,
  executeGetUpcomingReminders,
  executeSnoozeReminder,
  executeCreateRecurringReminder,
  executeCreateNote,
  executeGetNotes,
  executeSearchNotes,
  executeUpdateNote,
  executeDeleteNote,
  executePinNote,
  executeCreateCalendarEvent,
  executeGetCalendarEvents,
  executeUpdateCalendarEvent,
  executeDeleteCalendarEvent,
  executeCreateContact,
  executeGetContacts,
  executeSearchContacts,
  executeUpdateContact,
  executeDeleteContact,
  executeCallContact,
  executeSendMessageToContact,
  executeSendNotification,
  executeGetNotifications,
  executeMarkNotificationRead,
  executeClearNotifications,
  executeDraftEmail,
  executeDraftSMS,
  executeGetDrafts,
  executeDeleteDraft,
  executeGetKnowledge,
  executeSaveMemory,
  executeGetMemories,
  executeSearchKnowledgeBase,
  executeAddToKnowledgeBase,
  executeWebSearch,
  executeGetWeather,
  executeFindNearby,
  executeCheckScheduleConflicts,
  executeGetSchedulingSuggestions,
  executeGetScheduleAnalysis,
  executeLearnUserPatterns,
  executeCreatePatternReminder,
  executeStartListeningMode,
  executeEndListeningMode,
  executeGetListeningStatus,
  executeGetListeningSessions,
  executeNavigateTo,
  executeGetRecurringItems,
  executeCancelRecurringSeries,
} from './executors';

// Import external executors
import { executeAddWidget, executeRemoveWidget, executeListWidgets } from "@/services/voice-widget-control";

// Import Second Brain executors
import {
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
} from './executors/second-brain';

export interface ExecutorContext {
  openaiApiKey?: string;
}

/**
 * Execute a tool call and return the result
 * This is the main dispatcher that routes tool calls to the appropriate executor
 */
export async function executeTool(
  userId: string,
  toolCall: ToolCall,
  context?: ExecutorContext
): Promise<ActionResult> {
  const { tool, parameters } = toolCall;
  const startTime = Date.now();
  
  // Check if offline and handle accordingly
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (!isOnline) {
    try {
      const { executeToolOffline } = await import('@/services/offline-orchestrator');
      const offlineResult = await executeToolOffline(userId, toolCall);
      
      if (offlineResult.success || offlineResult.queued) {
        return {
          tool,
          success: offlineResult.success,
          data: offlineResult.data,
          error: offlineResult.error,
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (e) {
      // Offline orchestrator not available, continue with online execution
    }
  }
  
  try {
    let result: ActionResult;
    
    switch (tool) {
      // Time
      case "get_current_time":
        result = executeGetCurrentTime();
        break;
      
      // System
      case "undo_last_action":
        result = await executeUndoLastAction(userId);
        break;
      case "get_system_status":
        result = await executeGetSystemStatus(userId);
        break;
      case "get_productivity_stats":
        result = await executeGetProductivityStats(userId, parameters.days);
        break;
      case "get_daily_summary":
        result = await executeGetDailySummary(userId);
        break;
      case "read_tasks":
        result = await executeReadTasks(userId, parameters.status);
        break;
      case "read_reminders":
        result = await executeReadReminders(userId);
        break;
      case "read_notes":
        result = await executeReadNotes(userId, parameters.limit);
        break;
      case "read_calendar":
        result = await executeReadCalendar(userId, parameters.days);
        break;
      
      // Tasks
      case "create_task":
        result = await executeCreateTask(userId, parameters.title, parameters.description, parameters.priority, parameters.due_date, parameters.tags);
        break;
      case "get_tasks":
        result = await executeGetTasks(userId, parameters.status, parameters.priority, parameters.limit);
        break;
      case "complete_task":
        result = await executeCompleteTask(userId, parameters.task_id, parameters.task_title);
        break;
      case "update_task":
        result = await executeUpdateTask(userId, parameters.task_id, parameters.task_title, parameters.new_title, parameters.new_description, parameters.new_priority);
        break;
      case "reschedule_task":
        result = await executeRescheduleTask(userId, parameters.new_due_date, parameters.task_id, parameters.task_title);
        break;
      case "get_overdue_tasks":
        result = await executeGetOverdueTasks(userId);
        break;
      case "delete_task":
        result = await executeDeleteTask(userId, parameters.task_id, parameters.task_title);
        break;
      case "get_task_stats":
        result = await executeGetTaskStats(userId, parameters.days);
        break;
      case "create_recurring_task":
        result = await executeCreateRecurringTask(userId, parameters.title, parameters.due_date, parameters.recurrence, parameters.interval, parameters.priority);
        break;
      
      // Reminders
      case "create_reminder":
        result = await executeCreateReminder(userId, parameters.text, parameters.due_time, parameters.channel);
        break;
      case "get_reminders":
        result = await executeGetReminders(userId, parameters.status);
        break;
      case "delete_reminder":
        result = await executeDeleteReminder(userId, parameters.reminder_id, parameters.reminder_text);
        break;
      case "update_reminder":
        result = await executeUpdateReminder(userId, parameters.reminder_id, parameters.reminder_text, parameters.new_text, parameters.new_due_time);
        break;
      case "get_upcoming_reminders":
        result = await executeGetUpcomingReminders(userId, parameters.hours);
        break;
      case "snooze_reminder":
        result = await executeSnoozeReminder(userId, parameters.reminder_id, parameters.reminder_text, parameters.snooze_minutes);
        break;
      case "create_recurring_reminder":
        result = await executeCreateRecurringReminder(userId, parameters.text, parameters.due_time, parameters.recurrence, parameters.interval);
        break;
      
      // Notes
      case "create_note":
        result = await executeCreateNote(userId, parameters.title, parameters.content, parameters.tags, parameters.pinned);
        break;
      case "get_notes":
        result = await executeGetNotes(userId, parameters.search, parameters.limit, parameters.pinned_only);
        break;
      case "search_notes":
        result = await executeSearchNotes(userId, parameters.query);
        break;
      case "update_note":
        result = await executeUpdateNote(userId, parameters.note_id, parameters.note_title, parameters.new_title, parameters.new_content, parameters.new_tags);
        break;
      case "delete_note":
        result = await executeDeleteNote(userId, parameters.note_id, parameters.note_title);
        break;
      case "pin_note":
        result = await executePinNote(userId, parameters.note_id, parameters.note_title, parameters.pinned);
        break;
      
      // Calendar
      case "create_calendar_event":
        result = await executeCreateCalendarEvent(userId, parameters.title, parameters.start_time, parameters.end_time, parameters.location, parameters.description, parameters.attendees);
        break;
      case "get_calendar":
        result = await executeGetCalendarEvents(userId, parameters.start_date, parameters.end_date);
        break;
      case "update_calendar_event":
        result = await executeUpdateCalendarEvent(userId, parameters.event_id, parameters.event_title, parameters.new_title, parameters.new_start_time, parameters.new_end_time, parameters.new_location);
        break;
      case "delete_calendar_event":
        result = await executeDeleteCalendarEvent(userId, parameters.event_id, parameters.event_title);
        break;
      
      // Contacts
      case "create_contact":
        result = await executeCreateContact(userId, parameters.name, parameters.phone, parameters.email, parameters.notes);
        break;
      case "get_contacts":
        result = await executeGetContacts(userId, parameters.search, parameters.limit);
        break;
      case "search_contacts":
        result = await executeSearchContacts(userId, parameters.query);
        break;
      case "update_contact":
        result = await executeUpdateContact(userId, parameters.contact_id, parameters.contact_name, parameters.new_name, parameters.new_phone, parameters.new_email, parameters.new_notes);
        break;
      case "delete_contact":
        result = await executeDeleteContact(userId, parameters.contact_id, parameters.contact_name);
        break;
      case "call_contact":
        result = await executeCallContact(userId, parameters.contact_name);
        break;
      case "send_message_to_contact":
        result = await executeSendMessageToContact(userId, parameters.contact_name, parameters.message);
        break;
      
      // Notifications
      case "send_notification":
        result = await executeSendNotification(userId, parameters.title, parameters.body, parameters.type);
        break;
      case "get_notifications":
        result = await executeGetNotifications(userId, parameters.unread_only, parameters.limit);
        break;
      case "mark_notification_read":
        result = await executeMarkNotificationRead(userId, parameters.notification_id, parameters.mark_all);
        break;
      case "clear_notifications":
        result = await executeClearNotifications(userId);
        break;
      
      // Messages
      case "draft_email":
        result = await executeDraftEmail(userId, parameters.prompt, parameters.to, parameters.subject);
        break;
      case "draft_sms":
        result = await executeDraftSMS(userId, parameters.prompt, parameters.to);
        break;
      case "get_drafts":
        result = await executeGetDrafts(userId, parameters.type);
        break;
      case "delete_draft":
        result = await executeDeleteDraft(userId, parameters.draft_id, parameters.type);
        break;
      
      // Knowledge
      case "get_knowledge":
        result = await executeGetKnowledge(userId, parameters.category, parameters.search);
        break;
      case "add_knowledge":
      case "save_memory":
        result = await executeSaveMemory(userId, parameters.category, parameters.key, parameters.value);
        break;
      case "get_memories":
        result = await executeGetMemories(userId, parameters.category, parameters.search);
        break;
      case "search_knowledge_base":
        result = await executeSearchKnowledgeBase(userId, parameters.query, parameters.category);
        break;
      case "add_to_knowledge_base":
        result = await executeAddToKnowledgeBase(userId, parameters.title, parameters.content, parameters.category, parameters.tags);
        break;
      
      // Search
      case "web_search":
        result = await executeWebSearch(parameters.query, userId);
        break;
      case "get_weather":
        result = await executeGetWeather(parameters.location);
        break;
      case "find_nearby":
        result = await executeFindNearby(parameters.query);
        break;
      
      // Scheduling
      case "check_schedule_conflicts":
        result = await executeCheckScheduleConflicts(userId, parameters.start_time, parameters.end_time, parameters.title, parameters.estimated_duration);
        break;
      case "get_scheduling_suggestions":
        result = await executeGetSchedulingSuggestions(userId, parameters.task_title, parameters.estimated_duration, parameters.preferred_date);
        break;
      case "get_schedule_analysis":
        result = await executeGetScheduleAnalysis(userId);
        break;
      case "learn_user_patterns":
        result = await executeLearnUserPatterns(userId);
        break;
      case "create_pattern_reminder":
        result = await executeCreatePatternReminder(userId, parameters.activity, parameters.day_of_week, parameters.time, parameters.lead_time_minutes);
        break;
      
      // Listening Mode
      case "start_listening_mode":
        result = await executeStartListeningMode(userId, parameters.context);
        break;
      case "end_listening_mode":
        result = await executeEndListeningMode(userId, context?.openaiApiKey || parameters.openai_api_key || "");
        break;
      case "get_listening_status":
        result = await executeGetListeningStatus(userId);
        break;
      case "get_listening_sessions":
        result = await executeGetListeningSessions(userId, parameters.limit);
        break;
      
      // Navigation
      case "navigate_to":
        result = executeNavigateTo(parameters.page);
        break;
      
      // Recurring
      case "get_recurring_items":
        result = await executeGetRecurringItems(userId);
        break;
      case "cancel_recurring_series":
        result = await executeCancelRecurringSeries(userId, parameters.item_type, parameters.item_id);
        break;
      
      // Appointments
      case "create_appointment":
        result = await executeCreateAppointment(userId, parameters.start_time, parameters.contact_name, parameters.contact_phone, parameters.end_time, parameters.notes);
        break;
      case "get_appointments":
        result = await executeGetAppointments(userId, parameters.days);
        break;
      case "cancel_appointment":
        result = await executeCancelAppointment(userId, parameters.appointment_id, parameters.contact_name);
        break;
      case "reschedule_appointment":
        result = await executeRescheduleAppointment(userId, parameters.new_start_time, parameters.appointment_id, parameters.contact_name, parameters.new_end_time);
        break;
      
      // Widgets
      case "add_widget":
        result = executeAddWidget(parameters.widget_type);
        break;
      case "remove_widget":
        result = executeRemoveWidget(parameters.widget_type);
        break;
      case "list_widgets":
        result = executeListWidgets();
        break;
      case "move_widget":
        const { executeMoveWidget } = await import('@/services/orchestrator-advanced-widgets');
        result = await executeMoveWidget(parameters.widget_type, parameters.destination);
        break;
      case "switch_layout":
        const { executeSwitchLayout } = await import('@/services/orchestrator-layouts');
        result = await executeSwitchLayout(parameters.layout);
        break;
      
      // Second Brain
      case "start_second_brain":
        const startResult = await executeStartSecondBrain(parameters);
        result = { tool, success: startResult.success, data: startResult, message: startResult.message };
        break;
      case "stop_second_brain":
        const stopResult = executeStopSecondBrain();
        result = { tool, success: stopResult.success, data: stopResult, message: stopResult.message };
        break;
      case "enter_privacy_mode":
        const privacyResult = executeEnterPrivacyMode();
        result = { tool, success: privacyResult.success, data: privacyResult, message: privacyResult.message };
        break;
      case "exit_privacy_mode":
        const exitPrivacyResult = executeExitPrivacyMode();
        result = { tool, success: exitPrivacyResult.success, data: exitPrivacyResult, message: exitPrivacyResult.message };
        break;
      case "search_conversations":
        const searchConvResult = await executeSearchConversations(userId, parameters);
        result = { tool, success: searchConvResult.success, data: searchConvResult.results, message: searchConvResult.message };
        break;
      case "get_conversations_with":
        const convWithResult = await executeGetConversationsWith(userId, parameters);
        result = { tool, success: convWithResult.success, data: convWithResult.results, message: convWithResult.message };
        break;
      case "get_items_from_conversation":
        const itemsResult = await executeGetItemsFromConversation(userId, parameters);
        result = { tool, success: itemsResult.success, data: itemsResult.items, message: itemsResult.message };
        break;
      case "enable_fact_checking":
        const enableFCResult = executeEnableFactChecking();
        result = { tool, success: enableFCResult.success, data: enableFCResult, message: enableFCResult.message };
        break;
      case "disable_fact_checking":
        const disableFCResult = executeDisableFactChecking();
        result = { tool, success: disableFCResult.success, data: disableFCResult, message: disableFCResult.message };
        break;
      case "get_second_brain_status":
        const statusResult = executeGetSecondBrainStatus();
        result = { tool, success: statusResult.success, data: statusResult.status, message: statusResult.message };
        break;
      case "clear_conversation_memory":
        const clearResult = executeClearConversationMemory();
        result = { tool, success: clearResult.success, data: clearResult, message: clearResult.message };
        break;
      case "name_speaker":
        const nameResult = executeNameSpeaker(parameters);
        result = { tool, success: nameResult.success, data: nameResult, message: nameResult.message };
        break;
      case "get_detected_speakers":
        const speakersResult = executeGetDetectedSpeakers();
        result = { tool, success: speakersResult.success, data: speakersResult.speakers, message: speakersResult.message };
        break;
      case "whisper_message":
        const whisperResult = await executeWhisperMessage(parameters);
        result = { tool, success: whisperResult.success, data: whisperResult, message: whisperResult.message };
        break;
      case "set_whisper_volume":
        const volumeResult = executeSetWhisperVolume(parameters);
        result = { tool, success: volumeResult.success, data: volumeResult, message: volumeResult.message };
        break;
      
      // Settings
      case "change_voice":
        if ((window as any).setVoicePreferences) {
          const prefs = (window as any).getVoicePreferences();
          const { executeChangeVoice } = await import('@/services/orchestrator-settings-extension');
          result = await executeChangeVoice(parameters.voice, prefs, (window as any).setVoicePreferences);
        } else {
          result = { tool: "change_voice", success: false, error: "Settings not available" };
        }
        break;
      case "toggle_wake_word":
        if ((window as any).setVoicePreferences) {
          const prefs = (window as any).getVoicePreferences();
          const { executeToggleWakeWord } = await import('@/services/orchestrator-settings-extension');
          result = await executeToggleWakeWord(parameters.enabled, prefs, (window as any).setVoicePreferences);
        } else {
          result = { tool: "toggle_wake_word", success: false, error: "Settings not available" };
        }
        break;
      case "set_assistant_name":
        if ((window as any).setVoicePreferences) {
          const prefs = (window as any).getVoicePreferences();
          const { executeSetAssistantName } = await import('@/services/orchestrator-settings-extension');
          result = await executeSetAssistantName(parameters.name, prefs, (window as any).setVoicePreferences);
        } else {
          result = { tool: "set_assistant_name", success: false, error: "Settings not available" };
        }
        break;
      case "toggle_memory":
        if ((window as any).setVoicePreferences) {
          const prefs = (window as any).getVoicePreferences();
          const { executeToggleMemory } = await import('@/services/orchestrator-settings-extension');
          result = await executeToggleMemory(parameters.enabled, prefs, (window as any).setVoicePreferences);
        } else {
          result = { tool: "toggle_memory", success: false, error: "Settings not available" };
        }
        break;
      case "get_settings":
        if ((window as any).getVoicePreferences) {
          const prefs = (window as any).getVoicePreferences();
          const { executeGetSettings } = await import('@/services/orchestrator-settings-extension');
          result = await executeGetSettings(prefs);
        } else {
          result = { tool: "get_settings", success: false, error: "Settings not available" };
        }
        break;
      case "adjust_voice_speed":
        if ((window as any).setVoicePreferences) {
          const prefs = (window as any).getVoicePreferences();
          const { executeAdjustVoiceSpeed } = await import('@/services/orchestrator-settings-extension');
          result = await executeAdjustVoiceSpeed(parameters.speed, prefs, (window as any).setVoicePreferences);
        } else {
          result = { tool: "adjust_voice_speed", success: false, error: "Settings not available" };
        }
        break;
      case "toggle_private_mode":
        if ((window as any).setVoicePreferences) {
          const prefs = (window as any).getVoicePreferences();
          const { executeTogglePrivateMode } = await import('@/services/orchestrator-settings-extension');
          result = await executeTogglePrivateMode(parameters.enabled, prefs, (window as any).setVoicePreferences);
        } else {
          result = { tool: "toggle_private_mode", success: false, error: "Settings not available" };
        }
        break;
      
      default:
        result = { tool, success: false, error: `Unknown tool: ${tool}` };
    }
    
    // Add timing information
    result.duration = Date.now() - startTime;
    result.timestamp = new Date().toISOString();
    
    return result;
  } catch (error: any) {
    return {
      tool,
      success: false,
      error: error.message || "An unexpected error occurred",
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Execute multiple tool calls in sequence
 */
export async function executeTools(
  userId: string,
  toolCalls: ToolCall[],
  context?: ExecutorContext
): Promise<ActionResult[]> {
  const results: ActionResult[] = [];
  
  for (const toolCall of toolCalls) {
    const result = await executeTool(userId, toolCall, context);
    results.push(result);
    
    // Stop execution if a critical tool fails
    if (!result.success && isCriticalTool(toolCall.tool)) {
      break;
    }
  }
  
  return results;
}

/**
 * Check if a tool is critical (should stop execution on failure)
 */
function isCriticalTool(tool: string): boolean {
  const criticalTools = [
    'navigate_to',
    'start_listening_mode',
    'end_listening_mode',
  ];
  return criticalTools.includes(tool);
}