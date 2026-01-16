import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { usePreferences } from '@/state/preferences';
import { getLocationContext, LocationContext } from '@/services/context';
import { showSuccess } from '@/utils/toast';
import { initializeRAGKnowledge } from '@/services/rag-knowledge';
import { conversationManager, voiceRecorder, voicePlayer } from '@/services/voice';
import { conversationMemory } from '@/services/conversation-memory';
import { intentPredictor } from '@/services/intent-predictor';

// Import modular hooks
import { useVoiceState } from '@/hooks/useVoiceState';
import { useVoiceConfig } from '@/hooks/useVoiceConfig';
import { useWakeWord } from '@/hooks/useWakeWord';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';

interface VoiceContextType {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isQuietMode: boolean;
  isConversationMode: boolean;
  lastTranscript: string;
  currentTranscript: string;
  lastResponse: string;
  startListening: () => Promise<void>;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  processVoiceCommand: (text: string) => Promise<string>;
  enterQuietMode: (context?: string) => void;
  exitQuietMode: () => Promise<{ summary: string; bulletPoints: string[]; actionItems: string[] } | null>;
  startConversationMode: () => Promise<void>;
  stopConversationMode: () => void;
}

const VoiceContext = createContext<VoiceContextType | null>(null);

export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const config = useVoiceConfig();
  
  // Location state
  const [userLocation, setUserLocation] = useState<LocationContext | null>(null);
  
  // Voice state management
  const voiceState = useVoiceState();
  const {
    isListening,
    isProcessing,
    isSpeaking,
    isQuietMode,
    isConversationMode,
    lastTranscript,
    currentTranscript,
    lastResponse,
    setIsListening,
    setIsProcessing,
    setIsSpeaking,
    setIsQuietMode,
    setIsConversationMode,
    setLastTranscript,
    setCurrentTranscript,
    setLastResponse,
    conversationModeRef,
    isStartingRef,
  } = voiceState;

  // Ref to hold the startListening function for use in callbacks
  const startListeningRef = useRef<((isConversation: boolean) => Promise<void>) | null>(null);

  // Get location on mount
  useEffect(() => {
    getLocationContext().then(loc => {
      if (loc) setUserLocation(loc);
    }).catch(() => {});
  }, []);

  // Initialize RAG knowledge base
  useEffect(() => {
    if (user) {
      initializeRAGKnowledge(user.id);
    }
  }, [user]);

  // Check quiet mode status on mount
  useEffect(() => {
    if (user) {
      const isActive = conversationManager.checkQuietModeStatus(user.id);
      setIsQuietMode(isActive);
    }
  }, [user, setIsQuietMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isStartingRef.current = false;
      voiceRecorder.stop();
      voicePlayer.stop();
    };
  }, [isStartingRef]);

  // Stop speaking function
  const stopSpeaking = useCallback(() => {
    voicePlayer.stop();
    setIsSpeaking(false);
  }, [setIsSpeaking]);

  // Speak function with auto-continue for conversation mode
  const speak = useCallback(async (text: string) => {
    if (!text?.trim()) return;

    stopSpeaking();

    try {
      setIsSpeaking(true);
      console.log('[Voice] Speaking:', text.substring(0, 50) + '...');
      
      await voicePlayer.speak(text, config.openaiApiKey, {
        voice: config.openaiVoice,
        rate: config.voiceSpeed,
        onEnd: () => {
          console.log('[Voice] Speech ended');
          setIsSpeaking(false);
          
          // Auto-continue conversation mode - start listening again
          if (conversationModeRef.current && !isStartingRef.current) {
            console.log('[Voice] Auto-continuing conversation mode, starting to listen...');
            setTimeout(() => {
              if (conversationModeRef.current && startListeningRef.current) {
                startListeningRef.current(true);
              }
            }, 300);
          }
        },
        onError: (error) => {
          console.error('[Voice] Speech error:', error);
          setIsSpeaking(false);
          
          // Even on error, try to continue conversation
          if (conversationModeRef.current && !isStartingRef.current) {
            setTimeout(() => {
              if (conversationModeRef.current && startListeningRef.current) {
                startListeningRef.current(true);
              }
            }, 500);
          }
        },
      });
    } catch (error: any) {
      console.error('[Voice] Speak error:', error);
      setIsSpeaking(false);
      
      // Even on error, try to continue conversation
      if (conversationModeRef.current && !isStartingRef.current) {
        setTimeout(() => {
          if (conversationModeRef.current && startListeningRef.current) {
            startListeningRef.current(true);
          }
        }, 500);
      }
    }
  }, [config.openaiApiKey, config.openaiVoice, config.voiceSpeed, stopSpeaking, setIsSpeaking, conversationModeRef, isStartingRef]);

  // Quiet mode handlers
  const enterQuietMode = useCallback((context?: string) => {
    if (!user) return;
    conversationManager.enterQuietMode(user.id, context);
    setIsQuietMode(true);
    showSuccess(`Entering quiet mode${context ? ` for ${context}` : ''}. I'll just listen.`);
  }, [user, setIsQuietMode]);

  const exitQuietMode = useCallback(async () => {
    if (!user || !config.openaiApiKey) {
      setIsQuietMode(false);
      return null;
    }

    const result = await conversationManager.exitQuietMode(user.id, config.openaiApiKey);
    setIsQuietMode(false);
    return result;
  }, [user, config.openaiApiKey, setIsQuietMode]);

  // Stop conversation mode
  const stopConversationMode = useCallback(() => {
    console.log('[Voice] Stopping conversation mode');
    conversationModeRef.current = false;
    setIsConversationMode(false);
    isStartingRef.current = false;
    conversationManager.stopConversation();
    
    voiceRecorder.stop();
    setIsListening(false);
    voicePlayer.stop();
    setIsSpeaking(false);
  }, [conversationModeRef, isStartingRef, setIsConversationMode, setIsListening, setIsSpeaking]);

  // Voice commands hook
  const { processCommand, handleTranscription } = useVoiceCommands({
    userId: user?.id || null,
    config,
    userLocation,
    isQuietMode,
    onProcessingChange: setIsProcessing,
    onTranscriptChange: setLastTranscript,
    onResponseChange: setLastResponse,
    speak,
    stopConversationMode,
    enterQuietMode,
    exitQuietMode,
  });

  // Wrapped transcription handler that also sets current transcript
  const handleTranscriptionWithState = useCallback(async (text: string, isConversation: boolean) => {
    setCurrentTranscript(text);
    await handleTranscription(text, isConversation);
  }, [handleTranscription, setCurrentTranscript]);

  // Start listening function (internal)
  const startListeningInternal = useCallback(async (isConversation: boolean = false) => {
    if (isStartingRef.current || isListening) {
      console.log('[Voice] Already listening or starting');
      return;
    }

    if (!config.openaiApiKey) {
      console.log('[Voice] No API key');
      return;
    }

    isStartingRef.current = true;
    console.log(`[Voice] Starting listening (conversation: ${isConversation})`);

    voiceRecorder.start(
      {
        onStart: () => {
          setIsListening(true);
          isStartingRef.current = false;
          console.log(`[Voice] Recording started (${isConversation ? 'conversation' : 'single'} mode)`);
        },
        onStop: () => {
          console.log('[Voice] Recording stopped');
        },
        onData: async (blob) => {
          console.log(`[Voice] Recording complete, size: ${blob.size}`);
          setIsListening(false);
          
          // Check minimum size
          if (blob.size < 1000) {
            console.log('[Voice] Recording too small, likely no audio captured');
            // Continue conversation mode even on short recordings
            if (conversationModeRef.current && !isStartingRef.current) {
              console.log('[Voice] Continuing conversation mode after short recording...');
              setTimeout(() => startListeningRef.current?.(true), 500);
            }
            return;
          }

          try {
            // Import transcription function
            const { transcribeAudio } = await import('@/services/openai-voice');
            const result = await transcribeAudio(blob, config.openaiApiKey!);
            const text = (result.text || '').trim();
            
            console.log('[Voice] Transcription result:', text || '(empty)');
            
            if (!text) {
              console.log('[Voice] Empty transcription');
              // Continue conversation mode even on empty transcription
              if (conversationModeRef.current && !isStartingRef.current) {
                console.log('[Voice] Continuing conversation mode after empty transcription...');
                setTimeout(() => startListeningRef.current?.(true), 500);
              }
              return;
            }
            
            // Process the transcription
            await handleTranscriptionWithState(text, isConversation);
          } catch (error: any) {
            console.error('[Voice] Transcription error:', error);
            
            // Continue conversation mode even on transcription failure
            if (conversationModeRef.current && !isStartingRef.current) {
              console.log('[Voice] Continuing conversation mode after error...');
              setTimeout(() => startListeningRef.current?.(true), 1000);
            }
          }
        },
        onError: (error) => {
          console.error('[Voice] Recording error:', error);
          isStartingRef.current = false;
          setIsListening(false);
        },
        onSilenceDetected: isConversation ? () => {
          console.log('[Voice] Silence detected, stopping recording');
          voiceRecorder.stop();
        } : undefined,
      },
      isConversation // Enable silence detection for conversation mode
    );
  }, [config.openaiApiKey, isListening, isStartingRef, conversationModeRef, setIsListening, handleTranscriptionWithState]);

  // Update the ref whenever the function changes
  useEffect(() => {
    startListeningRef.current = startListeningInternal;
  }, [startListeningInternal]);

  // Stop listening
  const stopListening = useCallback(() => {
    console.log('[Voice] Stopping listening');
    isStartingRef.current = false;
    voiceRecorder.stop();
    setIsListening(false);
  }, [isStartingRef, setIsListening]);

  // Public start listening (single command mode)
  const startListening = useCallback(async () => {
    await startListeningInternal(false);
  }, [startListeningInternal]);

  // Start conversation mode
  const startConversationMode = useCallback(async () => {
    if (isConversationMode) return;
    
    console.log('[Voice] Starting conversation mode');
    setIsConversationMode(true);
    conversationModeRef.current = true;
    conversationManager.startConversation();
    
    // Speak greeting - the onEnd callback will automatically start listening
    await speak(`Hi! I'm ${config.assistantName}. How can I help you?`);
  }, [isConversationMode, speak, config.assistantName, setIsConversationMode, conversationModeRef]);

  // Wake word detection
  useWakeWord({
    enabled: preferences.wakeWordEnabled || false,
    wakeWord: preferences.wakeWord || 'echo',
    assistantName: config.assistantName,
    isListening,
    isProcessing,
    isSpeaking,
    isConversationMode,
    onWakeWordDetected: startConversationMode,
  });

  return (
    <VoiceContext.Provider
      value={{
        isListening,
        isProcessing,
        isSpeaking,
        isQuietMode,
        isConversationMode,
        lastTranscript,
        currentTranscript,
        lastResponse,
        startListening,
        stopListening,
        speak,
        stopSpeaking,
        processVoiceCommand: processCommand,
        enterQuietMode,
        exitQuietMode,
        startConversationMode,
        stopConversationMode,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}