/**
 * Orchestrator Settings Extension
 * Adds voice control for application settings
 */

import type { ActionResult } from "./orchestrator/types";
import type { Preferences } from "@/types/models";
import type { OpenAIVoice } from "@/types/models";

/**
 * Change assistant voice
 */
export async function executeChangeVoice(
  newVoice: OpenAIVoice,
  preferences: Preferences,
  setPreferences: (prefs: Preferences) => void
): Promise<ActionResult> {
  const validVoices: OpenAIVoice[] = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
  
  if (!validVoices.includes(newVoice)) {
    return {
      tool: "change_voice",
      success: false,
      error: `Invalid voice: ${newVoice}. Available: ${validVoices.join(", ")}`,
    };
  }

  setPreferences({ ...preferences, openaiVoice: newVoice });

  const voiceDescriptions: Record<string, string> = {
    alloy: "neutral and balanced",
    echo: "warm and friendly",
    fable: "expressive with a British accent",
    onyx: "deep and authoritative",
    nova: "energetic and upbeat",
    shimmer: "soft and gentle",
  };

  return {
    tool: "change_voice",
    success: true,
    data: {
      newVoice,
      description: voiceDescriptions[newVoice],
      voiceText: `I've changed my voice to ${newVoice}, which is ${voiceDescriptions[newVoice]}. How do I sound?`,
    },
  };
}

/**
 * Toggle wake word
 */
export async function executeToggleWakeWord(
  enabled: boolean,
  preferences: Preferences,
  setPreferences: (prefs: Preferences) => void
): Promise<ActionResult> {
  setPreferences({ ...preferences, wakeWordEnabled: enabled });

  return {
    tool: "toggle_wake_word",
    success: true,
    data: {
      enabled,
      wakeWord: preferences.wakeWord || "Echo",
      voiceText: enabled
        ? `Wake word enabled. You can now say "${preferences.wakeWord || 'Echo'}" to activate me anytime.`
        : "Wake word disabled. You'll need to use the microphone button to talk to me.",
    },
  };
}

/**
 * Set assistant name
 */
export async function executeSetAssistantName(
  newName: string,
  preferences: Preferences,
  setPreferences: (prefs: Preferences) => void
): Promise<ActionResult> {
  const capitalizedName = newName.charAt(0).toUpperCase() + newName.slice(1);
  
  setPreferences({ ...preferences, assistantName: capitalizedName });

  return {
    tool: "set_assistant_name",
    success: true,
    data: {
      newName: capitalizedName,
      voiceText: `Great! You can call me ${capitalizedName} from now on. How can I help you?`,
    },
  };
}

/**
 * Toggle memory
 */
export async function executeToggleMemory(
  enabled: boolean,
  preferences: Preferences,
  setPreferences: (prefs: Preferences) => void
): Promise<ActionResult> {
  setPreferences({ ...preferences, enableMemory: enabled });

  return {
    tool: "toggle_memory",
    success: true,
    data: {
      enabled,
      voiceText: enabled
        ? "Memory enabled. I'll remember important information you tell me."
        : "Memory disabled. I won't save new information, but existing memories are still available.",
    },
  };
}

/**
 * Get current settings
 */
export async function executeGetSettings(preferences: Preferences): Promise<ActionResult> {
  const settings = {
    voice: preferences.openaiVoice || "nova",
    assistantName: preferences.assistantName || "Echo",
    wakeWordEnabled: preferences.wakeWordEnabled || false,
    wakeWord: preferences.wakeWord || "Echo",
    memoryEnabled: preferences.enableMemory || false,
    voiceSpeed: preferences.voiceSpeed || 1.0,
  };

  const voiceText = `Here are my current settings: My voice is ${settings.voice}, my name is ${settings.assistantName}, wake word is ${settings.wakeWordEnabled ? 'enabled' : 'disabled'}, and memory is ${settings.memoryEnabled ? 'enabled' : 'disabled'}.`;

  return {
    tool: "get_settings",
    success: true,
    data: {
      settings,
      voiceText,
    },
  };
}

/**
 * Adjust voice speed
 */
export async function executeAdjustVoiceSpeed(
  speed: number,
  preferences: Preferences,
  setPreferences: (prefs: Preferences) => void
): Promise<ActionResult> {
  // Clamp speed between 0.5 and 2.0
  const clampedSpeed = Math.max(0.5, Math.min(2.0, speed));
  
  setPreferences({ ...preferences, voiceSpeed: clampedSpeed });

  return {
    tool: "adjust_voice_speed",
    success: true,
    data: {
      speed: clampedSpeed,
      voiceText: `I've adjusted my speaking speed to ${clampedSpeed} times normal speed.`,
    },
  };
}

/**
 * Toggle private mode
 */
export async function executeTogglePrivateMode(
  enabled: boolean,
  preferences: Preferences,
  setPreferences: (prefs: Preferences) => void
): Promise<ActionResult> {
  setPreferences({ ...preferences, privateMode: enabled });

  return {
    tool: "toggle_private_mode",
    success: true,
    data: {
      enabled,
      voiceText: enabled
        ? "Private mode enabled. I won't save conversation history."
        : "Private mode disabled. I'll save our conversations for context.",
    },
  };
}

// Note: SETTINGS_TOOLS is now defined in src/services/orchestrator/tools/settings.tools.ts
// Import from there if needed: import { SETTINGS_TOOLS } from './orchestrator/tools/settings.tools';