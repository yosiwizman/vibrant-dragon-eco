import { useEffect, useState } from "react";
import type { Preferences } from "../types/models";

const KEY = "echo:prefs";
const WIDGET_VERSION_KEY = "echo:widget_version";
const CURRENT_WIDGET_VERSION = 5; // INCREMENTED to force complete reset

const DEFAULT: Preferences = {
  preferredName: "",
  baseUrl: "",
  privateMode: false,
  pinEnabled: false,
  pinCode: undefined,
  authToken: undefined,
  demoModeEnabled: false,
  openaiApiKey: undefined,
  openaiVoice: "nova",
  preferOpenAIVoice: true,
  conversationMode: true,
  silenceThreshold: 0.01,
  silenceTimeout: 1500,
  voiceSpeed: 1.0,
  autoListenAfterSpeech: true,
  wakeWord: "echo",
  wakeWordEnabled: false,
  voiceFeedbackEnabled: true,
  voiceFeedbackVolume: 0.5,
  enableMultiStepConversations: true,
  enableRAGKnowledge: true,
  enableMemory: true,
  enableChatHistory: true,
  assistantName: "Echo",
  chatHistoryLimit: 50,
  enableSmartScheduling: true,
  defaultReminderLeadTime: 30,
  quietModeExitPhrase: "Echo summarize",
  enableActionHistory: true,
  maxUndoTimeMinutes: 5,
  enableProductivityTracking: true,
  defaultTaskPriority: "medium",
  defaultReminderChannel: "push",
  enableConflictDetection: true,
  enablePatternLearning: true,
  snoozeDefaultMinutes: 15,
  notificationSoundEnabled: true,
  compactVoiceResponses: true,
  widgetLayout: undefined,
  widgets: undefined,
};

// Valid OpenAI TTS voices
const VALID_VOICES = ["alloy", "ash", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer"];

export function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(KEY);
    const prefs = raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
    
    // Validate voice - reset to nova if invalid (e.g., "ballad" or "verse" which are not supported)
    if (prefs.openaiVoice && !VALID_VOICES.includes(prefs.openaiVoice)) {
      console.warn(`[Preferences] Invalid voice "${prefs.openaiVoice}" detected, resetting to "nova"`);
      prefs.openaiVoice = "nova";
    }
    
    return prefs;
  } catch {
    return DEFAULT;
  }
}

export function savePreferences(prefs: Preferences) {
  localStorage.setItem(KEY, JSON.stringify(prefs));
}

export function clearWidgetData() {
  const prefs = loadPreferences();
  prefs.widgets = undefined;
  prefs.widgetLayout = undefined;
  savePreferences(prefs);
  localStorage.removeItem(WIDGET_VERSION_KEY);
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    const prefs = loadPreferences();
    
    // Check widget version - force reset if outdated
    const savedVersion = localStorage.getItem(WIDGET_VERSION_KEY);
    const needsReset = !savedVersion || parseInt(savedVersion) < CURRENT_WIDGET_VERSION;
    
    if (needsReset) {
      console.log('[Preferences] Widget version outdated, forcing reset...');
      prefs.widgets = undefined;
      prefs.widgetLayout = undefined;
      savePreferences(prefs);
      localStorage.setItem(WIDGET_VERSION_KEY, String(CURRENT_WIDGET_VERSION));
    }
    
    return prefs;
  });

  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  return { preferences, setPreferences };
}