import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { usePreferences } from '@/state/preferences';
import { getLocationContext, LocationContext } from '@/services/context';
import { showSuccess } from '@/utils/toast';
import { initializeRAGKnowledge } from '@/services/rag-knowledge';
import { conversationManager, voiceRecorder, voicePlayer } from '@/services/voice';

// Import modular hooks
import { useVoiceState } from '@/hooks/useVoiceState';
import { useVoiceConfig } from '@/hooks/useVoiceConfig';
import { useWakeWord } from '@/hooks/useWakeWord';
import { useVoiceSpeech } from '@/hooks/useVoiceSpeech';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
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

  // Speech hook
  const { speak, stopSpeaking } = useVoiceSpeech({
    config,
    onSpeakingChange: setIsSpeaking,
    onSpeechEnd: () => {
      // Auto-continue conversation mode
      if (conversationModeRef.current && !isStartingRef.current) {
        setTimeout(() => startListeningInternal(true), 500);
      }
    },
  });

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

  // Stop conversation mode (defined early for use in commands hook)
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

  // Voice recording hook
  const { startListening: startListeningInternal, stopListening } = useVoiceRecording({
    openaiApiKey: config.openaiApiKey,
    isListening,
    isStartingRef,
    conversationModeRef,
    onListeningChange: setIsListening,
    onTranscript: handleTranscriptionWithState,
  });

  // Public start listening
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