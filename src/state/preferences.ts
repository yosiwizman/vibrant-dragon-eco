import { useEffect, useState } from "react";
import type { Preferences } from "../types/models";

const KEY = "echo:prefs";
const WIDGET_VERSION_KEY = "echo:widget_version";
const CURRENT_WIDGET_VERSION = 2; // Increment this to force reset widgets

const DEFAULT: Preferences = {
  preferredName: "",
  baseUrl: "",
  privateMode: false,
  pinEnabled: false,
  pinCode: undefined,
  authToken: undefined,
  openaiApiKey: undefined,
  openaiVoice: "nova",
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

export function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
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
}

// Check if widgets need to be reset due to version change or corruption
function shouldResetWidgets(): boolean {
  const savedVersion = localStorage.getItem(WIDGET_VERSION_KEY);
  if (!savedVersion || parseInt(savedVersion) < CURRENT_WIDGET_VERSION) {
    return true;
  }
  return false;
}

function markWidgetVersionCurrent() {
  localStorage.setItem(WIDGET_VERSION_KEY, String(CURRENT_WIDGET_VERSION));
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    const prefs = loadPreferences();
    
    // Force reset widgets if version changed
    if (shouldResetWidgets()) {
      console.log('[Preferences] Widget version changed, resetting widgets...');
      prefs.widgets = undefined;
      prefs.widgetLayout = undefined;
      savePreferences(prefs);
      markWidgetVersionCurrent();
      return prefs;
    }
    
    // Also check for corruption - any overlapping cells
    if (prefs.widgets && Array.isArray(prefs.widgets) && prefs.widgets.length > 0) {
      const positions = new Set<string>();
      let hasOverlap = false;
      
      for (const widget of prefs.widgets) {
        if (typeof widget.x !== 'number' || typeof widget.y !== 'number' ||
            typeof widget.w !== 'number' || typeof widget.h !== 'number') {
          hasOverlap = true;
          break;
        }
        
        for (let dy = 0; dy < widget.h; dy++) {
          for (let dx = 0; dx < widget.w; dx++) {
            const key = `${widget.x + dx},${widget.y + dy}`;
            if (positions.has(key)) {
              hasOverlap = true;
              break;
            }
            positions.add(key);
          }
          if (hasOverlap) break;
        }
        if (hasOverlap) break;
      }
      
      if (hasOverlap) {
        console.log('[Preferences] Detected corrupted widget data, clearing...');
        prefs.widgets = undefined;
        prefs.widgetLayout = undefined;
        savePreferences(prefs);
      }
    }
    
    return prefs;
  });

  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  return { preferences, setPreferences };
}