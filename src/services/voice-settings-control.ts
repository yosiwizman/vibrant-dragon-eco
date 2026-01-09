/**
 * Voice Settings Control Service
 * Enables complete voice control of application settings
 */

import type { Preferences } from "@/types/models";
import type { OpenAIVoice } from "@/types/models";

export interface VoiceSettingsCommand {
  action: "change_voice" | "toggle_wake_word" | "set_assistant_name" | "toggle_memory" | "get_settings";
  value?: string | boolean;
}

export interface VoiceSettingsResult {
  success: boolean;
  message: string;
  voiceResponse: string;
  settingChanged?: string;
  newValue?: any;
}

/**
 * Parse voice command for settings operations
 */
export function parseSettingsVoiceCommand(text: string): VoiceSettingsCommand | null {
  const lower = text.toLowerCase().trim();

  // Change voice
  if (lower.includes("change") && (lower.includes("voice") || lower.includes("sound"))) {
    const voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
    for (const voice of voices) {
      if (lower.includes(voice)) {
        return {
          action: "change_voice",
          value: voice,
        };
      }
    }
    return { action: "change_voice" }; // Will prompt for voice
  }

  // Toggle wake word
  if (lower.includes("wake word") || lower.includes("hey echo")) {
    if (lower.includes("enable") || lower.includes("turn on") || lower.includes("activate")) {
      return { action: "toggle_wake_word", value: true };
    }
    if (lower.includes("disable") || lower.includes("turn off") || lower.includes("deactivate")) {
      return { action: "toggle_wake_word", value: false };
    }
    return { action: "toggle_wake_word" }; // Will toggle
  }

  // Set assistant name
  if (lower.includes("call you") || lower.includes("your name")) {
    const nameMatch = lower.match(/call you (\w+)/i) || lower.match(/name (?:is |to )?(\w+)/i);
    if (nameMatch) {
      return {
        action: "set_assistant_name",
        value: nameMatch[1],
      };
    }
  }

  // Toggle memory
  if (lower.includes("memory")) {
    if (lower.includes("enable") || lower.includes("turn on")) {
      return { action: "toggle_memory", value: true };
    }
    if (lower.includes("disable") || lower.includes("turn off")) {
      return { action: "toggle_memory", value: false };
    }
  }

  // Get settings
  if (lower.includes("what are my settings") || lower.includes("show settings") || lower.includes("current settings")) {
    return { action: "get_settings" };
  }

  return null;
}

/**
 * Execute voice settings command
 */
export function executeVoiceSettingsCommand(
  command: VoiceSettingsCommand,
  currentPreferences: Preferences,
  updatePreferences: (prefs: Preferences) => void
): VoiceSettingsResult {
  switch (command.action) {
    case "change_voice":
      return handleChangeVoice(command, currentPreferences, updatePreferences);
    case "toggle_wake_word":
      return handleToggleWakeWord(command, currentPreferences, updatePreferences);
    case "set_assistant_name":
      return handleSetAssistantName(command, currentPreferences, updatePreferences);
    case "toggle_memory":
      return handleToggleMemory(command, currentPreferences, updatePreferences);
    case "get_settings":
      return handleGetSettings(currentPreferences);
    default:
      return {
        success: false,
        message: "Unknown settings command",
        voiceResponse: "I didn't understand that settings command.",
      };
  }
}

/**
 * Handle change voice command
 */
function handleChangeVoice(
  command: VoiceSettingsCommand,
  prefs: Preferences,
  updatePrefs: (p: Preferences) => void
): VoiceSettingsResult {
  if (!command.value) {
    const currentVoice = prefs.openaiVoice || "nova";
    return {
      success: false,
      message: "Voice not specified",
      voiceResponse: `My current voice is ${currentVoice}. Which voice would you like? Available voices are: Alloy, Echo, Fable, Onyx, Nova, and Shimmer.`,
    };
  }

  const newVoice = command.value as OpenAIVoice;
  const validVoices: OpenAIVoice[] = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
  
  if (!validVoices.includes(newVoice)) {
    return {
      success: false,
      message: `Invalid voice: ${newVoice}`,
      voiceResponse: `I don't have a voice called ${newVoice}. Available voices are: Alloy, Echo, Fable, Onyx, Nova, and Shimmer.`,
    };
  }

  updatePrefs({ ...prefs, openaiVoice: newVoice });

  return {
    success: true,
    message: `Voice changed to ${newVoice}`,
    voiceResponse: `I've changed my voice to ${newVoice}. How do I sound?`,
    settingChanged: "openaiVoice",
    newValue: newVoice,
  };
}

/**
 * Handle toggle wake word command
 */
function handleToggleWakeWord(
  command: VoiceSettingsCommand,
  prefs: Preferences,
  updatePrefs: (p: Preferences) => void
): VoiceSettingsResult {
  const newValue = command.value !== undefined ? command.value : !prefs.wakeWordEnabled;
  
  updatePrefs({ ...prefs, wakeWordEnabled: newValue as boolean });

  return {
    success: true,
    message: `Wake word ${newValue ? 'enabled' : 'disabled'}`,
    voiceResponse: newValue
      ? `Wake word enabled. You can now say "${prefs.wakeWord || 'Echo'}" to activate me anytime.`
      : "Wake word disabled. You'll need to use the microphone button to talk to me.",
    settingChanged: "wakeWordEnabled",
    newValue,
  };
}

/**
 * Handle set assistant name command
 */
function handleSetAssistantName(
  command: VoiceSettingsCommand,
  prefs: Preferences,
  updatePrefs: (p: Preferences) => void
): VoiceSettingsResult {
  if (!command.value) {
    return {
      success: false,
      message: "Name not specified",
      voiceResponse: "What would you like to call me?",
    };
  }

  const newName = String(command.value).charAt(0).toUpperCase() + String(command.value).slice(1);
  
  updatePrefs({ ...prefs, assistantName: newName });

  return {
    success: true,
    message: `Assistant name changed to ${newName}`,
    voiceResponse: `Great! You can call me ${newName} from now on.`,
    settingChanged: "assistantName",
    newValue: newName,
  };
}

/**
 * Handle toggle memory command
 */
function handleToggleMemory(
  command: VoiceSettingsCommand,
  prefs: Preferences,
  updatePrefs: (p: Preferences) => void
): VoiceSettingsResult {
  const newValue = command.value !== undefined ? command.value : !prefs.enableMemory;
  
  updatePrefs({ ...prefs, enableMemory: newValue as boolean });

  return {
    success: true,
    message: `Memory ${newValue ? 'enabled' : 'disabled'}`,
    voiceResponse: newValue
      ? "Memory enabled. I'll remember important information you tell me."
      : "Memory disabled. I won't save new information, but existing memories are still available.",
    settingChanged: "enableMemory",
    newValue,
  };
}

/**
 * Handle get settings command
 */
function handleGetSettings(prefs: Preferences): VoiceSettingsResult {
  const settings = [
    `My voice is ${prefs.openaiVoice || 'Nova'}`,
    `My name is ${prefs.assistantName || 'Echo'}`,
    `Wake word is ${prefs.wakeWordEnabled ? 'enabled' : 'disabled'}`,
    `Memory is ${prefs.enableMemory ? 'enabled' : 'disabled'}`,
  ];

  return {
    success: true,
    message: "Current settings retrieved",
    voiceResponse: `Here are my current settings: ${settings.join(". ")}.`,
  };
}

/**
 * Check if text is a settings command
 */
export function isSettingsCommand(text: string): boolean {
  const lower = text.toLowerCase();
  
  const settingsKeywords = [
    "settings",
    "preferences",
    "change voice",
    "wake word",
    "call you",
    "your name",
    "memory",
  ];
  
  return settingsKeywords.some(kw => lower.includes(kw));
}

/**
 * Get available voice options
 */
export function getAvailableVoices(): string[] {
  return ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
}

/**
 * Get voice descriptions
 */
export function getVoiceDescriptions(): Record<string, string> {
  return {
    alloy: "Neutral and balanced",
    echo: "Warm and friendly",
    fable: "Expressive British accent",
    onyx: "Deep and authoritative",
    nova: "Energetic and upbeat",
    shimmer: "Soft and gentle",
  };
}