import { usePreferences } from "@/state/preferences";
import { useProviders } from "@/hooks/useProviders";

/**
 * Centralized hook to get the OpenAI API key.
 * 
 * Priority:
 * 1. preferences.openaiApiKey (localStorage) - Primary source
 * 2. api_providers table (Supabase) - Fallback for advanced users
 * 
 * This ensures all parts of the app use the same API key source.
 */
export function useOpenAIKey(): {
  apiKey: string | undefined;
  hasKey: boolean;
  source: "preferences" | "providers" | "none";
} {
  const { preferences } = usePreferences();
  const { providers } = useProviders();

  // Primary: Check preferences (localStorage)
  if (preferences.openaiApiKey && preferences.openaiApiKey.trim().length > 0) {
    return {
      apiKey: preferences.openaiApiKey,
      hasKey: true,
      source: "preferences",
    };
  }

  // Fallback: Check api_providers table
  const openaiProvider = providers.find(
    (p) => p.provider_name === "openai" && p.is_enabled && p.api_key
  );

  if (openaiProvider?.api_key) {
    return {
      apiKey: openaiProvider.api_key,
      hasKey: true,
      source: "providers",
    };
  }

  return {
    apiKey: undefined,
    hasKey: false,
    source: "none",
  };
}

/**
 * Get the OpenAI API key from preferences or providers.
 * This is a non-hook version for use in services.
 */
export function getOpenAIKeyFromPreferences(): string | undefined {
  try {
    const raw = localStorage.getItem("echo:prefs");
    if (raw) {
      const prefs = JSON.parse(raw);
      if (prefs.openaiApiKey && prefs.openaiApiKey.trim().length > 0) {
        return prefs.openaiApiKey;
      }
    }
  } catch {
    // Ignore parsing errors
  }
  return undefined;
}