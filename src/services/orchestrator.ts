import { supabase } from "@/integrations/supabase/client";
import { searchWeb, getWeather, findNearbyPlaces, geocodeAddress } from "./search";
import { getCurrentLocation } from "./location";
import { getDailySummary, formatSummaryForVoice, getTasksReadout, getRemindersReadout, getNotesReadout, getCalendarReadout } from "./daily-summary";
import { findRouteByVoiceCommand, APP_ROUTES } from "./voice-navigation";
import { undoLastAction, recordAction } from "./action-history";
import { createRecurringReminder, createRecurringTask, getRecurringItems, cancelRecurringSeries, processRecurringCompletion } from "./recurrence";
import { searchKnowledge, addDocument, getKnowledgeContext } from "./rag-knowledge";
import { parseNaturalTime, recurrenceToString } from "./smart-time-parser";
import { checkScheduleConflicts, getSchedulingSuggestions, getDailyScheduleAnalysis, learnUserPatterns, createPatternBasedReminder } from "./smart-scheduling";
import { startListeningSession, endListeningSession, addTranscript, getSessionStatus, formatSummaryForVoice as formatListeningSummary, isEnterPhrase, isExitPhrase, getPastSessions } from "./quiet-mode";
import { executeAddWidget, executeRemoveWidget, executeListWidgets } from "./voice-widget-control";
import { executeCreateAppointment, executeGetAppointments, executeCancelAppointment, executeRescheduleAppointment } from "./appointments";

export interface OrchestrationContext {
  userId: string;
  userMessage: string;
  conversationHistory: { role: string; content: string }[];
  preferences?: Record<string, any>;
}

export interface OrchestrationResult {
  response: string;
  actions: ActionResult[];
  toolsUsed: string[];
  metadata?: Record<string, any>;
}

export interface ActionResult {
  tool: string;
  success: boolean;
  data?: any;
  error?: string;
  duration?: number;
  timestamp?: string;
}

// ... rest of the file stays exactly the same