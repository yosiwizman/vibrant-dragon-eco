import { useMemo } from 'react';
import { usePreferences } from '@/state/preferences';
import { useOpenAIKey } from '@/hooks/useOpenAIKey';
import { VoiceConfig } from '@/services/voice/types';

export function useVoiceConfig(): VoiceConfig {
  const { preferences } = usePreferences();
  const { apiKey: openaiApiKey } = useOpenAIKey();

  return useMemo(() => ({
    openaiApiKey,
    assistantName: preferences.assistantName || 'Echo',
    openaiVoice: preferences.openaiVoice || 'nova',
    voiceSpeed: preferences.voiceSpeed || 1.0,
    preferOpenAIVoice: preferences.preferOpenAIVoice !== false,
    enableMemory: preferences.enableMemory || false,
    enableChatHistory: preferences.enableChatHistory || false,
    chatHistoryLimit: preferences.chatHistoryLimit || 10,
    privateMode: preferences.privateMode || false,
  }), [openaiApiKey, preferences]);
}