import { useCallback, useRef } from 'react';
import { voiceRecorder, voiceProcessor } from '@/services/voice';
import { offlineVoiceRecorder, isOfflineVoiceRecorderSupported } from '@/services/offline-voice-recorder';
import { showError } from '@/utils/toast';
import { useVoiceFeedback } from '@/components/VoiceFeedback';

export interface UseVoiceRecordingOptions {
  openaiApiKey: string | null;
  isListening: boolean;
  isStartingRef: React.MutableRefObject<boolean>;
  conversationModeRef: React.MutableRefObject<boolean>;
  onListeningChange: (isListening: boolean) => void;
  onTranscript: (text: string, isConversation: boolean) => Promise<void>;
}

export interface UseVoiceRecordingReturn {
  startListening: (isConversation?: boolean) => Promise<void>;
  stopListening: () => void;
}

export function useVoiceRecording(options: UseVoiceRecordingOptions): UseVoiceRecordingReturn {
  const {
    openaiApiKey,
    isListening,
    isStartingRef,
    conversationModeRef,
    onListeningChange,
    onTranscript,
  } = options;

  const { playFeedback } = useVoiceFeedback();
  const startListeningInternalRef = useRef<((isConversation: boolean) => Promise<void>) | null>(null);

  const startListeningInternal = useCallback(async (isConversation: boolean = false) => {
    if (isStartingRef.current || isListening) {
      console.log('[VoiceRecording] Already listening or starting');
      return;
    }

    isStartingRef.current = true;

    const isOnline = navigator.onLine;
    const hasApiKey = !!openaiApiKey;
    const hasOfflineRecorder = isOfflineVoiceRecorderSupported();

    // Use offline recorder if needed
    if ((!isOnline || !hasApiKey) && hasOfflineRecorder) {
      console.log('[VoiceRecording] Using offline voice recorder');
      
      if (!isConversation) playFeedback('start');
      
      onListeningChange(true);
      isStartingRef.current = false;

      offlineVoiceRecorder.start({
        onTranscript: (result) => {
          // Interim results handled elsewhere if needed
        },
        onEnd: async (finalTranscript) => {
          onListeningChange(false);
          if (!isConversation) playFeedback('stop');
          
          if (finalTranscript?.trim()) {
            await onTranscript(finalTranscript, isConversation);
          }
        },
        onError: (error) => {
          onListeningChange(false);
          playFeedback('error');
          showError(error.message || 'Voice recognition failed');
        },
      });
      
      return;
    }

    // Use OpenAI Whisper
    if (!openaiApiKey) {
      isStartingRef.current = false;
      showError('Please add your OpenAI API key in Settings');
      return;
    }

    if (!isConversation) playFeedback('start');

    voiceRecorder.start(
      {
        onStart: () => {
          onListeningChange(true);
          isStartingRef.current = false;
          console.log(`[VoiceRecording] Recording started (${isConversation ? 'conversation' : 'single'} mode)`);
        },
        onStop: () => {
          if (!isConversation) playFeedback('stop');
        },
        onData: async (blob) => {
          console.log(`[VoiceRecording] Recording complete, size: ${blob.size}`);
          onListeningChange(false);
          
          // Lower threshold - even 1KB might contain speech
          if (blob.size < 1000) {
            console.log('[VoiceRecording] Recording too small, likely no audio captured');
            if (!isConversation) {
              showError('Recording too short. Please speak for at least 1 second.');
            }
            // Continue conversation mode even on short recordings
            if (conversationModeRef.current && !isStartingRef.current) {
              console.log('[VoiceRecording] Continuing conversation mode...');
              setTimeout(() => startListeningInternalRef.current?.(true), 500);
            }
            return;
          }

          try {
            const text = await voiceProcessor.transcribe(blob, openaiApiKey!);
            await onTranscript(text, isConversation);
          } catch (error: any) {
            console.error('[VoiceRecording] Transcription error:', error);
            
            // Only show error toast in single mode, not conversation mode
            if (!isConversation) {
              playFeedback('error');
              showError(error.message || 'Transcription failed');
            } else {
              // In conversation mode, just log and continue listening
              console.log('[VoiceRecording] Transcription failed in conversation mode, continuing...');
            }
            
            // Continue conversation mode even on transcription failure
            if (conversationModeRef.current && !isStartingRef.current) {
              console.log('[VoiceRecording] Restarting listening after error...');
              setTimeout(() => startListeningInternalRef.current?.(true), 1000);
            }
          }
        },
        onError: (error) => {
          console.error('[VoiceRecording] Recording error:', error);
          isStartingRef.current = false;
          onListeningChange(false);
          playFeedback('error');
          showError(error.message || 'Recording failed');
        },
        onSilenceDetected: isConversation ? () => {
          console.log('[VoiceRecording] Silence detected, stopping');
          voiceRecorder.stop();
        } : undefined,
      },
      isConversation
    );
  }, [isListening, openaiApiKey, playFeedback, onListeningChange, onTranscript, isStartingRef, conversationModeRef]);

  // Update ref for recursive calls
  startListeningInternalRef.current = startListeningInternal;

  const startListening = useCallback(async (isConversation: boolean = false) => {
    await startListeningInternal(isConversation);
  }, [startListeningInternal]);

  const stopListening = useCallback(() => {
    console.log('[VoiceRecording] Stopping listening');
    isStartingRef.current = false;
    voiceRecorder.stop();
    onListeningChange(false);
  }, [isStartingRef, onListeningChange]);

  return {
    startListening,
    stopListening,
  };
}