import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { usePreferences } from "@/state/preferences";
import { useOpenAIKey } from "@/hooks/useOpenAIKey";
import { getLocationContext, LocationContext } from "@/services/context";
import { showError, showSuccess } from "@/utils/toast";
import { useVoiceFeedback } from "@/components/VoiceFeedback";
import { initializeRAGKnowledge } from "@/services/rag-knowledge";
import { logVoiceCommand, logAIError } from "@/services/ai-logging";
import { startWakeWordDetection, stopWakeWordDetection, isWakeWordSupported } from "@/services/wake-word-detection";
import { offlineVoiceRecorder, isOfflineVoiceRecorderSupported } from "@/services/offline-voice-recorder";

// Import modular voice services
import { 
  voiceRecorder, 
  voicePlayer, 
  voiceProcessor, 
  conversationManager,
  VoiceConfig 
} from "@/services/voice";

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
    throw new Error("useVoice must be used within a VoiceProvider");
  }
  return context;
}

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const { apiKey: openaiApiKey } = useOpenAIKey();
  const { playFeedback } = useVoiceFeedback();
  
  // State
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isQuietMode, setIsQuietMode] = useState(false);
  const [isConversationMode, setIsConversationMode] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [lastResponse, setLastResponse] = useState("");
  const [userLocation, setUserLocation] = useState<LocationContext | null>(null);
  
  // Refs
  const conversationModeRef = useRef(false);
  const isStartingRef = useRef(false);

  // Sync conversation mode ref
  useEffect(() => {
    conversationModeRef.current = isConversationMode;
  }, [isConversationMode]);

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
  }, [user]);

  // Wake word detection
  useEffect(() => {
    if (preferences.wakeWordEnabled && isWakeWordSupported() && !isListening && !isProcessing && !isSpeaking && !isConversationMode) {
      startWakeWordDetection({
        wakeWord: preferences.wakeWord || "echo",
        onWakeWordDetected: () => {
          showSuccess(`${preferences.assistantName || "Echo"} is listening...`);
          startConversationMode();
        },
        onError: (error) => {
          console.error("[Voice] Wake word error:", error);
        },
      });
    } else {
      stopWakeWordDetection();
    }

    return () => stopWakeWordDetection();
  }, [preferences.wakeWordEnabled, preferences.wakeWord, isListening, isProcessing, isSpeaking, isConversationMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isStartingRef.current = false;
      voiceRecorder.stop();
      voicePlayer.stop();
    };
  }, []);

  // Get voice config from preferences
  const getVoiceConfig = useCallback((): VoiceConfig => ({
    openaiApiKey,
    assistantName: preferences.assistantName || "Echo",
    openaiVoice: preferences.openaiVoice || "nova",
    voiceSpeed: preferences.voiceSpeed || 1.0,
    preferOpenAIVoice: preferences.preferOpenAIVoice !== false,
    enableMemory: preferences.enableMemory || false,
    enableChatHistory: preferences.enableChatHistory || false,
    chatHistoryLimit: preferences.chatHistoryLimit || 10,
    privateMode: preferences.privateMode || false,
  }), [openaiApiKey, preferences]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    voicePlayer.stop();
    setIsSpeaking(false);
  }, []);

  // Speak text
  const speak = useCallback(async (text: string) => {
    if (!text?.trim()) return;

    stopSpeaking();
    const config = getVoiceConfig();

    try {
      setIsSpeaking(true);
      
      await voicePlayer.speak(text, openaiApiKey, {
        voice: config.openaiVoice,
        rate: config.voiceSpeed,
        onEnd: () => {
          setIsSpeaking(false);
          // Auto-continue conversation mode
          if (conversationModeRef.current && !isStartingRef.current) {
            setTimeout(() => startListeningInternal(true), 500);
          }
        },
        onError: (error) => {
          console.error("[Voice] Speech error:", error);
          setIsSpeaking(false);
        },
      });
    } catch (error: any) {
      console.error("[Voice] Speak error:", error);
      setIsSpeaking(false);
    }
  }, [openaiApiKey, getVoiceConfig, stopSpeaking]);

  // Process voice command
  const processVoiceCommand = useCallback(async (text: string): Promise<string> => {
    const currentUser = user;
    if (!currentUser) {
      throw new Error("Please log in to use AI features");
    }

    setIsProcessing(true);
    setLastTranscript(text);
    setCurrentTranscript("");

    try {
      const config = getVoiceConfig();
      
      const result = await voiceProcessor.processCommand(
        text,
        currentUser.id,
        openaiApiKey,
        config,
        userLocation,
        (path) => navigate(path)
      );

      setLastResponse(result.response);
      setIsProcessing(false);
      
      return result.response;
    } catch (error: any) {
      setIsProcessing(false);
      console.error("[Voice] Processing error:", error);
      
      if (user) {
        logAIError(user.id, error.message, { command: text });
      }
      
      throw error;
    }
  }, [user, openaiApiKey, userLocation, navigate, getVoiceConfig]);

  // Handle transcription result
  const handleTranscription = useCallback(async (text: string, isConversation: boolean) => {
    if (!text?.trim()) {
      setIsProcessing(false);
      if (conversationModeRef.current && !isStartingRef.current) {
        setTimeout(() => startListeningInternal(true), 500);
      }
      return;
    }

    setCurrentTranscript(text);

    // Check for special commands via conversation manager
    if (user) {
      const result = conversationManager.handleTranscript(user.id, text);
      
      if (result.handled) {
        switch (result.action) {
          case 'exit':
            setIsProcessing(false);
            await speak(result.message!);
            stopConversationMode();
            return;
            
          case 'quiet-enter':
            if (result.data?.context !== undefined) {
              enterQuietMode(result.data.context);
            } else if (isQuietMode) {
              conversationManager.addQuietModeTranscript(user.id, text);
            }
            setIsProcessing(false);
            if (result.message) await speak(result.message);
            return;
            
          case 'quiet-exit':
            const quietResult = await exitQuietMode();
            setIsProcessing(false);
            if (quietResult) {
              let summaryText = quietResult.summary;
              if (quietResult.bulletPoints.length > 0) {
                summaryText += ` Key points: ${quietResult.bulletPoints.slice(0, 3).join(". ")}.`;
              }
              playFeedback("success");
              await speak(summaryText);
            } else {
              await speak("I didn't capture any conversation during the listening session.");
            }
            return;
            
          case 'multi-step':
            if (result.data?.complete) {
              playFeedback("success");
              const response = await processVoiceCommand(
                `Create ${result.data.intent?.replace(/_/g, " ")} with: ${JSON.stringify(result.data.collectedData)}`
              );
              await speak(response);
            } else if (result.message) {
              setIsProcessing(false);
              await speak(result.message);
            }
            return;
            
          case 'modification':
            playFeedback("success");
            setIsProcessing(false);
            await speak(result.message!);
            return;
            
          case 'cancel':
            setIsProcessing(false);
            await speak(result.message!);
            return;
        }
      }
    }

    // Process as regular command
    try {
      const response = await processVoiceCommand(text);
      playFeedback("success");
      
      if (user) {
        logVoiceCommand(user.id, text, response);
      }
      
      await speak(response);
    } catch (error: any) {
      playFeedback("error");
      setIsProcessing(false);
      showError(error.message || "Voice processing failed");
      
      if (conversationModeRef.current) {
        await speak("Sorry, I had trouble with that. Please try again.");
      }
    }
  }, [user, isQuietMode, processVoiceCommand, speak, playFeedback]);

  // Internal start listening function
  const startListeningInternal = useCallback(async (isConversation: boolean = false) => {
    if (isStartingRef.current || isListening) {
      console.log("[Voice] Already listening or starting");
      return;
    }

    isStartingRef.current = true;

    const isOnline = navigator.onLine;
    const hasApiKey = !!openaiApiKey;
    const hasOfflineRecorder = isOfflineVoiceRecorderSupported();

    // Use offline recorder if needed
    if ((!isOnline || !hasApiKey) && hasOfflineRecorder) {
      console.log("[Voice] Using offline voice recorder");
      
      if (!isConversation) playFeedback("start");
      
      setIsListening(true);
      setCurrentTranscript("");
      isStartingRef.current = false;

      offlineVoiceRecorder.start({
        onTranscript: (result) => {
          if (result.isFinal) {
            setCurrentTranscript(result.transcript);
          }
        },
        onEnd: async (finalTranscript) => {
          setIsListening(false);
          if (!isConversation) playFeedback("stop");
          
          if (finalTranscript?.trim()) {
            await handleTranscription(finalTranscript, isConversation);
          }
        },
        onError: (error) => {
          setIsListening(false);
          playFeedback("error");
          showError(error.message || "Voice recognition failed");
        },
      });
      
      return;
    }

    // Use OpenAI Whisper
    if (!openaiApiKey) {
      isStartingRef.current = false;
      showError("Please add your OpenAI API key in Settings");
      return;
    }

    if (!isConversation) playFeedback("start");
    setCurrentTranscript("");

    voiceRecorder.start(
      {
        onStart: () => {
          setIsListening(true);
          isStartingRef.current = false;
          console.log(`[Voice] Recording started (${isConversation ? 'conversation' : 'single'} mode)`);
        },
        onStop: () => {
          if (!isConversation) playFeedback("stop");
        },
        onData: async (blob) => {
          console.log(`[Voice] Recording complete, size: ${blob.size}`);
          setIsListening(false);
          
          if (blob.size < 5000) {
            setIsProcessing(false);
            if (!isConversation) {
              showError("Recording too short. Please speak for at least 1 second.");
            }
            if (conversationModeRef.current && !isStartingRef.current) {
              setTimeout(() => startListeningInternal(true), 500);
            }
            return;
          }

          try {
            setIsProcessing(true);
            const text = await voiceProcessor.transcribe(blob, openaiApiKey!);
            await handleTranscription(text, isConversation);
          } catch (error: any) {
            playFeedback("error");
            setIsProcessing(false);
            console.error("[Voice] Transcription error:", error);
            showError(error.message || "Transcription failed");
            
            if (conversationModeRef.current) {
              await speak("Sorry, I had trouble with that. Please try again.");
            }
          }
        },
        onError: (error) => {
          console.error("[Voice] Recording error:", error);
          isStartingRef.current = false;
          setIsListening(false);
          playFeedback("error");
          showError(error.message || "Recording failed");
        },
        onSilenceDetected: isConversation ? () => {
          console.log("[Voice] Silence detected, stopping");
          voiceRecorder.stop();
        } : undefined,
      },
      isConversation
    );
  }, [isListening, openaiApiKey, playFeedback, handleTranscription, speak]);

  // Public API
  const startListening = useCallback(async () => {
    await startListeningInternal(false);
  }, [startListeningInternal]);

  const stopListening = useCallback(() => {
    console.log("[Voice] Stopping listening");
    isStartingRef.current = false;
    voiceRecorder.stop();
    setIsListening(false);
  }, []);

  const startConversationMode = useCallback(async () => {
    if (isConversationMode) return;
    
    console.log("[Voice] Starting conversation mode");
    setIsConversationMode(true);
    conversationModeRef.current = true;
    conversationManager.startConversation();
    
    await speak(`Hi! I'm ${preferences.assistantName || "Echo"}. How can I help you?`);
  }, [isConversationMode, speak, preferences.assistantName]);

  const stopConversationMode = useCallback(() => {
    console.log("[Voice] Stopping conversation mode");
    conversationModeRef.current = false;
    setIsConversationMode(false);
    isStartingRef.current = false;
    conversationManager.stopConversation();
    
    stopListening();
    stopSpeaking();
  }, [stopListening, stopSpeaking]);

  const enterQuietMode = useCallback((context?: string) => {
    if (!user) return;
    conversationManager.enterQuietMode(user.id, context);
    setIsQuietMode(true);
    showSuccess(`Entering quiet mode${context ? ` for ${context}` : ""}. I'll just listen.`);
  }, [user]);

  const exitQuietMode = useCallback(async () => {
    if (!user || !openaiApiKey) {
      setIsQuietMode(false);
      return null;
    }

    const result = await conversationManager.exitQuietMode(user.id, openaiApiKey);
    setIsQuietMode(false);
    return result;
  }, [user, openaiApiKey]);

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
        processVoiceCommand,
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