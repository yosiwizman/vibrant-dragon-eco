import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { usePreferences } from '@/state/preferences';
import { showSuccess } from '@/utils/toast';

// Import modular hooks
import { useVoiceState } from '@/hooks/useVoiceState';
import { useVoiceConfig } from '@/hooks/useVoiceConfig';
import { useWakeWord } from '@/hooks/useWakeWord';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';

// Lazy imports for heavy services to prevent blocking
let getLocationContext: any = null;
let initializeRAGKnowledge: any = null;
let conversationManager: any = null;
let voiceRecorder: any = null;
let voicePlayer: any = null;

// Initialize services lazily
async function initializeServices() {
  try {
    if (!getLocationContext) {
      const contextModule = await import('@/services/context');
      getLocationContext = contextModule.getLocationContext;
    }
    if (!initializeRAGKnowledge) {
      const ragModule = await import('@/services/rag-knowledge');
      initializeRAGKnowledge = ragModule.initializeRAGKnowledge;
    }
    if (!conversationManager || !voiceRecorder || !voicePlayer) {
      const voiceModule = await import('@/services/voice');
      conversationManager = voiceModule.conversationManager;
      voiceRecorder = voiceModule.voiceRecorder;
      voicePlayer = voiceModule.voicePlayer;
    }
    return true;
  } catch (error) {
    console.error('[VoiceContext] Failed to initialize services:', error);
    return false;
  }
}

// Location context type
interface LocationContext {
  city?: string;
  country?: string;
  timezone?: string;
  coordinates?: { lat: number; lng: number };
}

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
  
  // Services initialized state
  const [servicesReady, setServicesReady] = useState(false);
  
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

  // Initialize services on mount
  useEffect(() => {
    initializeServices().then(ready => {
      setServicesReady(ready);
    });
  }, []);

  // Get location on mount (after services ready)
  useEffect(() => {
    if (!servicesReady || !getLocationContext) return;
    
    getLocationContext().then((loc: LocationContext | null) => {
      if (loc) setUserLocation(loc);
    }).catch(() => {});
  }, [servicesReady]);

  // Initialize RAG knowledge base (after services ready)
  useEffect(() => {
    if (!servicesReady || !user || !initializeRAGKnowledge) return;
    
    initializeRAGKnowledge(user.id);
  }, [user, servicesReady]);

  // Check quiet mode status on mount (after services ready)
  useEffect(() => {
    if (!servicesReady || !user || !conversationManager) return;
    
    const isActive = conversationManager.checkQuietModeStatus(user.id);
    setIsQuietMode(isActive);
  }, [user, setIsQuietMode, servicesReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isStartingRef.current = false;
      if (voiceRecorder) voiceRecorder.stop();
      if (voicePlayer) voicePlayer.stop();
    };
  }, [isStartingRef]);

  // Stop speaking function
  const stopSpeaking = useCallback(() => {
    if (voicePlayer) voicePlayer.stop();
    setIsSpeaking(false);
  }, [setIsSpeaking]);

  // Speak function with auto-continue for conversation mode
  const speak = useCallback(async (text: string) => {
    if (!text?.trim() || !voicePlayer) return;

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
    if (!user || !conversationManager) return;
    conversationManager.enterQuietMode(user.id, context);
    setIsQuietMode(true);
    showSuccess(`Entering quiet mode${context ? ` for ${context}` : ''}. I'll just listen.`);
  }, [user, setIsQuietMode]);

  const exitQuietMode = useCallback(async () => {
    if (!user || !config.openaiApiKey || !conversationManager) {
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
    if (conversationManager) conversationManager.stopConversation();
    
    if (voiceRecorder) voiceRecorder.stop();
    setIsListening(false);
    if (voicePlayer) voicePlayer.stop();
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

    if (!voiceRecorder) {
      console.log('[Voice] Voice recorder not ready');
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
    if (voiceRecorder) voiceRecorder.stop();
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
    if (conversationManager) conversationManager.startConversation();
    
    // Get user's preferred name for personalized greeting
    const userName = preferences.preferredName?.trim();
    console.log('[Voice] User preferred name:', userName || '(not set)');
    
    // Personalized greeting - always use name if available
    let greeting: string;
    if (userName) {
      greeting = `Hi ${userName}! How can I help you?`;
    } else {
      greeting = `Hi there! How can I help you?`;
    }
    
    console.log('[Voice] Greeting:', greeting);
    
    // Speak greeting - the onEnd callback will automatically start listening
    await speak(greeting);
  }, [isConversationMode, speak, preferences.preferredName, setIsConversationMode, conversationModeRef]);

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