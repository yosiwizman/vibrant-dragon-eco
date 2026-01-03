import { useEffect, useState } from "react";
import type { Preferences } from "../types/models";

const KEY = "echo:prefs";

const DEFAULT: Preferences = {
  baseUrl: "",
  privateMode: true,
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

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences());

  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  return { preferences, setPreferences };
}