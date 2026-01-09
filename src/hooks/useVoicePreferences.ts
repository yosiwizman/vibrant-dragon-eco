/**
 * Voice Preferences Hook
 * Exposes preferences to voice control system via global window object
 */

import { useEffect } from "react";
import { usePreferences } from "@/state/preferences";

export function useVoicePreferences() {
  const { preferences, setPreferences } = usePreferences();

  useEffect(() => {
    // Expose preferences to voice control system
    (window as any).getVoicePreferences = () => preferences;
    (window as any).setVoicePreferences = setPreferences;

    return () => {
      delete (window as any).getVoicePreferences;
      delete (window as any).setVoicePreferences;
    };
  }, [preferences, setPreferences]);

  return { preferences, setPreferences };
}