import { useCallback, useRef } from 'react';
import { voicePlayer } from '@/services/voice';
import { VoiceConfig } from '@/services/voice/types';

export interface UseVoiceSpeechOptions {
  config: VoiceConfig;
  onSpeakingChange: (isSpeaking: boolean) => void;
  onSpeechEnd?: () => void;
}

export interface UseVoiceSpeechReturn {
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;
}

export function useVoiceSpeech(options: UseVoiceSpeechOptions): UseVoiceSpeechReturn {
  const { config, onSpeakingChange, onSpeechEnd } = options;
  const onSpeechEndRef = useRef(onSpeechEnd);

  // Keep callback ref updated
  onSpeechEndRef.current = onSpeechEnd;

  const stopSpeaking = useCallback(() => {
    voicePlayer.stop();
    onSpeakingChange(false);
  }, [onSpeakingChange]);

  const speak = useCallback(async (text: string) => {
    if (!text?.trim()) return;

    stopSpeaking();

    try {
      onSpeakingChange(true);
      
      await voicePlayer.speak(text, config.openaiApiKey, {
        voice: config.openaiVoice,
        rate: config.voiceSpeed,
        onEnd: () => {
          onSpeakingChange(false);
          onSpeechEndRef.current?.();
        },
        onError: (error) => {
          console.error('[VoiceSpeech] Speech error:', error);
          onSpeakingChange(false);
        },
      });
    } catch (error: any) {
      console.error('[VoiceSpeech] Speak error:', error);
      onSpeakingChange(false);
    }
  }, [config.openaiApiKey, config.openaiVoice, config.voiceSpeed, stopSpeaking, onSpeakingChange]);

  return {
    speak,
    stopSpeaking,
  };
}