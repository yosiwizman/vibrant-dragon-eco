import { ToolDefinition } from '../types';

export const SETTINGS_TOOLS: ToolDefinition[] = [
  {
    name: "change_voice",
    description: "Change the assistant's voice. Use when user says 'change your voice', 'use a different voice', 'sound like [voice name]'.",
    parameters: { voice: "alloy|echo|fable|onyx|nova|shimmer" },
    category: "settings",
  },
  {
    name: "toggle_wake_word",
    description: "Enable or disable wake word detection. Use when user says 'enable wake word', 'turn on hey echo', 'disable wake word'.",
    parameters: { enabled: "boolean" },
    category: "settings",
  },
  {
    name: "set_assistant_name",
    description: "Change the assistant's name. Use when user says 'I'll call you [name]', 'your name is [name]', 'change your name to [name]'.",
    parameters: { name: "string" },
    category: "settings",
  },
  {
    name: "toggle_memory",
    description: "Enable or disable memory. Use when user says 'enable memory', 'turn on memory', 'disable memory'.",
    parameters: { enabled: "boolean" },
    category: "settings",
  },
  {
    name: "get_settings",
    description: "Get current settings. Use when user asks 'what are my settings', 'show settings', 'what's configured'.",
    parameters: {},
    category: "settings",
  },
  {
    name: "adjust_voice_speed",
    description: "Adjust speaking speed. Use when user says 'speak faster', 'slow down', 'talk slower', 'speed up'.",
    parameters: { speed: "number (0.5 to 2.0)" },
    category: "settings",
  },
  {
    name: "toggle_private_mode",
    description: "Enable or disable private mode. Use when user says 'enable private mode', 'go private', 'disable private mode'.",
    parameters: { enabled: "boolean" },
    category: "settings",
  },
];