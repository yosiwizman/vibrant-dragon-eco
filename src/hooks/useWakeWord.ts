import { useEffect, useRef, useCallback } from 'react';
import { 
  startWakeWordDetection, 
  stopWakeWordDetection, 
  isWakeWordSupported 
} from '@/services/wake-word-detection';
import { showSuccess } from '@/utils/toast';

export interface UseWakeWordOptions {
  enabled: boolean;
  wakeWord: string;
  assistantName: string;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isConversationMode: boolean;
  onWakeWordDetected: () => void;
}

export interface UseWakeWordReturn {
  isSupported: boolean;
  isActive: boolean;
}

export function useWakeWord(options: UseWakeWordOptions): UseWakeWordReturn {
  const {
    enabled,
    wakeWord,
    assistantName,
    isListening,
    isProcessing,
    isSpeaking,
    isConversationMode,
    onWakeWordDetected,
  } = options;

  const wakeWordActiveRef = useRef(false);
  const onWakeWordDetectedRef = useRef(onWakeWordDetected);

  // Keep callback ref updated
  useEffect(() => {
    onWakeWordDetectedRef.current = onWakeWordDetected;
  }, [onWakeWordDetected]);

  useEffect(() => {
    const shouldBeActive = enabled &&
                          isWakeWordSupported() &&
                          !isListening &&
                          !isProcessing &&
                          !isSpeaking &&
                          !isConversationMode;

    console.log('[WakeWord] Checking status:', {
      enabled,
      supported: isWakeWordSupported(),
      isListening,
      isProcessing,
      isSpeaking,
      isConversationMode,
      shouldBeActive,
      currentlyActive: wakeWordActiveRef.current,
    });

    if (shouldBeActive && !wakeWordActiveRef.current) {
      console.log('[WakeWord] Starting wake word detection for:', wakeWord);
      
      const started = startWakeWordDetection({
        wakeWord: wakeWord || 'echo',
        onWakeWordDetected: () => {
          console.log('[WakeWord] Wake word detected! Starting conversation mode...');
          wakeWordActiveRef.current = false;
          showSuccess(`${assistantName} is listening...`);
          onWakeWordDetectedRef.current();
        },
        onError: (error) => {
          console.error('[WakeWord] Error:', error);
          wakeWordActiveRef.current = false;
        },
      });
      
      wakeWordActiveRef.current = started;
      console.log('[WakeWord] Detection started:', started);
    } else if (!shouldBeActive && wakeWordActiveRef.current) {
      console.log('[WakeWord] Stopping wake word detection');
      stopWakeWordDetection();
      wakeWordActiveRef.current = false;
    }

    return () => {
      if (wakeWordActiveRef.current) {
        console.log('[WakeWord] Cleanup - stopping detection');
        stopWakeWordDetection();
        wakeWordActiveRef.current = false;
      }
    };
  }, [enabled, wakeWord, assistantName, isListening, isProcessing, isSpeaking, isConversationMode]);

  return {
    isSupported: isWakeWordSupported(),
    isActive: wakeWordActiveRef.current,
  };
}