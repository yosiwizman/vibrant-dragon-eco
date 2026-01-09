import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { usePreferences } from "@/state/preferences";
import { useOpenAIKey } from "@/hooks/useOpenAIKey";
import { transcribeAudio, synthesizeSpeech } from "@/services/openai-voice";
import { buildSystemPrompt, parseToolCalls, executeTool, ActionResult } from "@/services/orchestrator";
import { getLocationContext, LocationContext } from "@/services/context";
import { normalizeSpeechInput } from "@/services/conversation-manager";
import { showError, showSuccess } from "@/utils/toast";
import { useVoiceFeedback } from "@/components/VoiceFeedback";
import { hasActiveFlow, processMultiStepResponse, cancelFlow, handleInlineModification, detectMultiStepIntent, startMultiStepFlow } from "@/services/multi-step-conversation";
import { initializeRAGKnowledge } from "@/services/rag-knowledge";
import { logVoiceCommand, logAIError } from "@/services/ai-logging";
import { getMemoryContext } from "@/services/memory";
import { saveChatMessage, getChatContext } from "@/services/chat-history";
import { startWakeWordDetection, stopWakeWordDetection, isWakeWordSupported } from "@/services/wake-word-detection";
import { isEnterPhrase, isExitPhrase, startListeningSession, addTranscript, endListeningSession, getSessionStatus } from "@/services/quiet-mode";
import { voiceRateLimiter, openAIRateLimiter } from "@/services/rate-limiter";
import { trackVoiceCommand, trackError } from "@/services/analytics";
import { webLLM, isWebLLMSupported } from "@/services/web-llm";
import { offlineVoice, isOfflineVoiceSupported } from "@/services/offline-voice";
import { offlineVoiceRecorder, isOfflineVoiceRecorderSupported } from "@/services/offline-voice-recorder";
import { alwaysOnAssistant } from "@/services/always-on-assistant";
import { factChecker } from "@/services/real-time-fact-checker";
import { conversationIndexer } from "@/services/conversation-indexer";
import { conversationMemory } from "@/services/conversation-memory";
import { performanceMonitor } from "@/services/performance-monitor";
import { intentPredictor } from "@/services/intent-predictor";
import { streamingTTS, processWithStreaming } from "@/services/streaming-tts";
import { retryAPICall } from "@/utils/retry";
import { getUserFriendlyError } from "@/utils/error-messages";
import { responseCache } from "@/services/response-cache";

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
  const { apiKey: openaiApiKey, hasKey: hasOpenAIKey } = useOpenAIKey();
  const { playFeedback } = useVoiceFeedback();
  
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isQuietMode, setIsQuietMode] = useState(false);
  const [isConversationMode, setIsConversationMode] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [lastResponse, setLastResponse] = useState("");
  const [userLocation, setUserLocation] = useState<LocationContext | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const conversationModeRef = useRef(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartRef = useRef<number | null>(null);

  // Sync ref with state
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
          console.error("Wake word error:", error);
        },
      });
    } else {
      stopWakeWordDetection();
    }

    return () => {
      stopWakeWordDetection();
    };
  }, [preferences.wakeWordEnabled, preferences.wakeWord, isListening, isProcessing, isSpeaking, isConversationMode]);

  const stopSpeaking = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      URL.revokeObjectURL(currentAudioRef.current.src);
      currentAudioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text || text.trim().length === 0) {
      console.warn("Empty text provided to speak function");
      return;
    }

    // Stop any current audio
    stopSpeaking();

    const isOnline = navigator.onLine;
    const hasOpenAI = !!openaiApiKey;
    const hasOfflineVoice = isOfflineVoiceSupported();
    const preferOpenAI = preferences.preferOpenAIVoice !== false; // Default to true

    // Use offline voice ONLY if offline OR no API key OR user explicitly disabled OpenAI preference
    if ((!isOnline || !hasOpenAI || !preferOpenAI) && hasOfflineVoice && !hasOpenAI) {
      try {
        setIsSpeaking(true);
        console.log('[Voice] Using offline TTS (Web Speech API)');
        
        await offlineVoice.speak(text, {
          rate: preferences.voiceSpeed || 1.0,
        });
        
        setIsSpeaking(false);
        return;
      } catch (error: any) {
        console.error("Offline speech synthesis error:", error);
        setIsSpeaking(false);
        return;
      }
    }

    // Use OpenAI TTS (online mode)
    if (!openaiApiKey) {
      console.error("OpenAI API key not configured");
      showError("OpenAI API key not configured. Go to Settings to add it.");
      return;
    }

    try {
      setIsSpeaking(true);
      console.log('[Voice] Using OpenAI TTS (online mode)');
      
      const speechBlob = await synthesizeSpeech(
        text,
        openaiApiKey,
        preferences.openaiVoice || "nova"
      );
      
      console.log("Speech blob received, size:", speechBlob.size);
      
      if (speechBlob.size === 0) {
        throw new Error("Empty audio blob received");
      }
      
      const audio = new Audio();
      currentAudioRef.current = audio;
      const audioUrl = URL.createObjectURL(speechBlob);
      audio.src = audioUrl;
      
      // Set volume
      audio.volume = 1.0;
      
      await new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          URL.revokeObjectURL(audioUrl);
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
          }
          setIsSpeaking(false);
          
          // Auto-continue conversation mode after speaking
          if (conversationModeRef.current) {
            setTimeout(() => startListeningInternal(true), 500);
          }
        };

        audio.onended = () => {
          console.log("Audio playback ended");
          cleanup();
          resolve();
        };
        
        audio.onerror = (e) => {
          console.error("Audio playback error:", e);
          cleanup();
          reject(new Error("Audio playback failed"));
        };

        audio.oncanplaythrough = () => {
          console.log("Audio can play through, starting playback");
          audio.play().catch((err) => {
            console.error("Play failed:", err);
            cleanup();
            reject(err);
          });
        };

        // Fallback if oncanplaythrough doesn't fire
        setTimeout(() => {
          if (audio.readyState >= 3) {
            audio.play().catch((err) => {
              console.error("Fallback play failed:", err);
              cleanup();
              reject(err);
            });
          }
        }, 100);
      });
    } catch (error: any) {
      console.error("Speech synthesis error:", error);
      setIsSpeaking(false);
      // Don't show error toast for every TTS failure, just log it
    }
  }, [openaiApiKey, preferences.openaiVoice, preferences.voiceSpeed, stopSpeaking]);

  const processVoiceCommand = useCallback(async (text: string): Promise<string> => {
    if (!user) {
      throw new Error("Please log in to use AI features");
    }

    const isOnline = navigator.onLine;
    const hasOpenAI = !!openaiApiKey;
    const hasWebLLM = isWebLLMSupported();

    // Determine which AI to use
    const useLocalAI = !isOnline || !hasOpenAI;

    if (!hasOpenAI && !hasWebLLM) {
      throw new Error("Please add your OpenAI API key in Settings or enable offline AI");
    }

    // Check voice rate limit
    const voiceCheck = voiceRateLimiter.checkLimit(user.id);
    if (!voiceCheck.allowed) {
      const waitTime = Math.ceil((voiceCheck.resetAt - Date.now()) / 1000);
      throw new Error(`Too many voice commands. Please wait ${waitTime} seconds.`);
    }

    // Only check OpenAI rate limit if using OpenAI
    if (!useLocalAI) {
      const apiCheck = openAIRateLimiter.checkLimit(user.id, 0.01);
      if (!apiCheck.allowed) {
        throw new Error(apiCheck.reason || "API rate limit exceeded");
      }
    }

    setIsProcessing(true);
    setLastTranscript(text);
    setCurrentTranscript("");

    try {
      const normalizedText = normalizeSpeechInput(text);

      // Use local AI if offline or no API key
      if (useLocalAI && hasWebLLM) {
        console.log('[Voice] Using local WebLLM (offline mode)');
        
        // Initialize WebLLM if needed
        const modelCached = await webLLM.isModelCached();
        if (!modelCached) {
          throw new Error("Offline AI not downloaded. Please download the model in Settings.");
        }

        await webLLM.initialize();

        // Build simple prompt for local AI
        const systemPrompt = `You are ${preferences.assistantName || "Echo"}, a helpful AI assistant.
Current time: ${new Date().toLocaleString()}
Location: ${userLocation?.city || "Unknown"}

Parse the user's command and respond naturally. For tasks, reminders, notes, etc., acknowledge what you'll do.`;

        const response = await webLLM.chat([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: normalizedText },
        ]);

        // Parse tool calls from local AI response
        const toolCalls = parseToolCalls(response);
        
        if (toolCalls.length > 0) {
          for (const toolCall of toolCalls) {
            await executeTool(user.id, toolCall);
          }
        }

        setLastResponse(response);
        setIsProcessing(false);
        trackVoiceCommand(text, true, user.id);
        
        return response;
      }

      // Use OpenAI (online mode)
      console.log('[Voice] Using OpenAI (online mode)');
      
      // Get memory context if enabled
      let memoryContext = "";
      if (preferences.enableMemory) {
        memoryContext = await getMemoryContext(user.id);
      }

      // Get chat history context if enabled
      let chatHistory: { role: "user" | "assistant"; content: string }[] = [];
      if (preferences.enableChatHistory) {
        chatHistory = await getChatContext(user.id, Math.min(preferences.chatHistoryLimit || 10, 20));
      }
      
      const systemPrompt = buildSystemPrompt(
        userLocation ? {
          lat: userLocation.lat,
          lng: userLocation.lng,
          city: userLocation.city,
        } : undefined,
        preferences.assistantName,
        memoryContext
      );

      // Build messages with chat history
      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...chatHistory.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: normalizedText },
      ];

      // Save user message to chat history
      if (preferences.enableChatHistory && !preferences.privateMode) {
        saveChatMessage(user.id, "user", normalizedText);
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI request failed: ${errorText}`);
      }

      const data = await response.json();
      let aiResponse = data.choices[0].message.content;

      // Execute tool calls
      const toolCalls = parseToolCalls(aiResponse);
      let toolResults: ActionResult[] = [];

      if (toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          const result = await executeTool(user.id, toolCall);
          toolResults.push(result);

          // Handle navigation
          if (toolCall.tool === "navigate_to" && result.success && result.data?.path) {
            navigate(result.data.path);
          }
        }

        // Get follow-up response
        if (toolResults.length > 0) {
          const toolResultsText = toolResults.map(r => {
            if (r.data?.voiceText) return r.data.voiceText;
            return `${r.tool}: ${r.success ? "Success" : r.error}`;
          }).join("\n");

          const followUpResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: normalizedText },
                { role: "assistant", content: aiResponse },
                { role: "user", content: `Results: ${toolResultsText}\n\nGive a brief voice response.` },
              ],
              max_tokens: 256,
            }),
          });

          if (followUpResponse.ok) {
            const followUpData = await followUpResponse.json();
            aiResponse = followUpData.choices[0].message.content;
          }
        }
      }

      // Clean response
      const cleanResponse = aiResponse
        .replace(/```json[\s\S]*?```/g, '')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/\*\*/g, '')
        .trim();

      // Use voice text if available
      const voiceTextResult = toolResults.find(r => r.data?.voiceText);
      const finalResponse = voiceTextResult?.data?.voiceText || cleanResponse;

      // Save assistant response to chat history
      if (preferences.enableChatHistory && !preferences.privateMode) {
        saveChatMessage(user.id, "assistant", finalResponse);
      }

      setLastResponse(finalResponse);
      setIsProcessing(false);
      
      // Track successful voice command
      trackVoiceCommand(text, true, user.id);
      
      return finalResponse;
    } catch (error: any) {
      setIsProcessing(false);
      console.error("Voice command processing error:", error);
      
      // Track failed voice command
      trackVoiceCommand(text, false, user.id);
      trackError(error.message, { command: text }, user.id);
      
      throw error;
    }
  }, [openaiApiKey, user, userLocation, navigate, preferences.enableMemory, preferences.enableChatHistory, preferences.chatHistoryLimit, preferences.privateMode, preferences.assistantName]);

  // Internal function to start listening (used by conversation mode)
  const startListeningInternal = useCallback(async (isConversation: boolean = false) => {
    if (isListening) return;

    const isOnline = navigator.onLine;
    const hasOpenAI = !!openaiApiKey;
    const hasOfflineVoiceRecorder = isOfflineVoiceRecorderSupported();

    // Use offline voice recorder if offline or no API key
    if ((!isOnline || !hasOpenAI) && hasOfflineVoiceRecorder) {
      console.log('[Voice] Using offline voice recorder (Web Speech API)');
      
      if (!isConversation) {
        playFeedback("start");
      }
      
      setIsListening(true);
      setCurrentTranscript("");
      
      offlineVoiceRecorder.start({
        onTranscript: (result) => {
          if (result.isFinal) {
            setCurrentTranscript(result.transcript);
          }
        },
        onEnd: async (finalTranscript) => {
          setIsListening(false);
          
          if (!isConversation) {
            playFeedback("stop");
          }
          
          if (finalTranscript && finalTranscript.trim()) {
            try {
              const response = await processVoiceCommand(finalTranscript);
              await speak(response);
              
              if (conversationModeRef.current) {
                setTimeout(() => startListeningInternal(true), 500);
              }
            } catch (error: any) {
              playFeedback("error");
              showError(error.message || "Voice processing failed");
              
              if (conversationModeRef.current) {
                await speak("Sorry, I had trouble with that. Please try again.");
                setTimeout(() => startListeningInternal(true), 500);
              }
            }
          } else {
            if (conversationModeRef.current) {
              setTimeout(() => startListeningInternal(true), 500);
            }
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

    // Use OpenAI Whisper (online mode) - original implementation
    if (!openaiApiKey) {
      showError("Please add your OpenAI API key in Settings or enable offline mode");
      return;
    }

    try {
      if (!isConversation) {
        playFeedback("start");
      }
      setCurrentTranscript("");
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      streamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Set up audio analysis for silence detection in conversation mode
      if (isConversation) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        source.connect(analyserRef.current);
        silenceStartRef.current = null;
      }
      
      // Force WebM format for OpenAI Whisper compatibility
      let mimeType = "audio/webm";
      
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      } else if (MediaRecorder.isTypeSupported("audio/mpeg")) {
        mimeType = "audio/mpeg";
      } else {
        console.warn("[Voice] No supported audio format found, using default");
        mimeType = "audio/webm"; // Fallback
      }
      
      console.log(`[Voice] Using audio format: ${mimeType}`);

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000 // 128kbps for good quality
      });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        if (!isConversation) {
          playFeedback("stop");
        }
        const blob = new Blob(chunksRef.current, { type: mimeType });
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        
        if (blob.size > 0) {
          let transcriptText = "";
          try {
            setIsProcessing(true);
            console.log("Transcribing audio, blob size:", blob.size);
            
            const isOnline = navigator.onLine;
            const hasOpenAI = !!openaiApiKey;
            const hasOfflineVoice = isOfflineVoiceSupported();
            
            // Use offline voice recognition if offline or no API key
            if ((!isOnline || !hasOpenAI) && hasOfflineVoice) {
              console.log('[Voice] Using offline STT (Web Speech API)');
              // Note: Web Speech API works with live audio, not blobs
              // For now, we'll show a message that offline transcription requires live mode
              throw new Error("Offline transcription requires using the microphone button. Please try again.");
            }
            
            // Use OpenAI Whisper (online mode)
            if (!openaiApiKey) {
              throw new Error("OpenAI API key required for transcription");
            }
            
            console.log('[Voice] Using OpenAI Whisper (online mode)');
            const transcription = await transcribeAudio(blob, openaiApiKey);
            transcriptText = transcription.text.trim();
            
            console.log("Transcription result:", transcriptText);
            setCurrentTranscript(transcriptText);
            
            if (transcriptText) {
              // Check for exit phrases in conversation mode
              if (conversationModeRef.current && /\b(goodbye|bye|stop|exit|end conversation|that's all|thank you|thanks)\b/i.test(transcriptText)) {
                setIsProcessing(false);
                await speak("Goodbye! Let me know if you need anything else.");
                stopConversationMode();
                return;
              }

              // Check for quiet mode entry/exit
              if (isEnterPhrase(transcriptText) && user) {
                const contextMatch = transcriptText.match(/for\s+(.+?)(?:\s*$|,)/i);
                const context = contextMatch ? contextMatch[1] : undefined;
                enterQuietMode(context);
                setIsProcessing(false);
                await speak(`Entering quiet mode${context ? ` for ${context}` : ""}. I'll stay quiet and just listen. Say "${preferences.quietModeExitPhrase || "Echo summarize"}" when you're done.`);
                return;
              }

              if (isExitPhrase(transcriptText) && isQuietMode && user) {
                const result = await exitQuietMode();
                setIsProcessing(false);
                if (result) {
                  let summaryText = result.summary;
                  if (result.bulletPoints.length > 0) {
                    summaryText += ` Key points: ${result.bulletPoints.slice(0, 3).join(". ")}.`;
                  }
                  if (result.actionItems.length > 0) {
                    summaryText += ` Action items: ${result.actionItems.join(". ")}.`;
                  }
                  playFeedback("success");
                  await speak(summaryText);
                } else {
                  await speak("I didn't capture any conversation during the listening session.");
                }
                return;
              }

              // If in quiet mode, just record the transcript
              if (isQuietMode && user) {
                addTranscript(user.id, transcriptText);
                setIsProcessing(false);
                // Don't respond, just keep listening
                if (conversationModeRef.current) {
                  setTimeout(() => startListeningInternal(true), 500);
                }
                return;
              }

              // Check for multi-step conversation
              if (user && hasActiveFlow(user.id)) {
                const flowResult = processMultiStepResponse(user.id, transcriptText);
                if (flowResult.complete && flowResult.collectedData) {
                  // Flow complete, process the collected data
                  playFeedback("success");
                  const response = await processVoiceCommand(
                    `Create ${flowResult.state?.intent.replace(/_/g, " ")} with: ${JSON.stringify(flowResult.collectedData)}`
                  );
                  await speak(response);
                  // Continue conversation mode
                  if (conversationModeRef.current) {
                    setTimeout(() => startListeningInternal(true), 500);
                  }
                } else if (flowResult.nextPrompt) {
                  setIsProcessing(false);
                  await speak(flowResult.nextPrompt);
                  // Continue conversation mode
                  if (conversationModeRef.current) {
                    setTimeout(() => startListeningInternal(true), 500);
                  }
                }
                return;
              }

              // Check for inline modifications
              if (user) {
                const modResult = handleInlineModification(user.id, transcriptText);
                if (modResult.handled && modResult.message) {
                  playFeedback("success");
                  setIsProcessing(false);
                  await speak(modResult.message);
                  // Continue conversation mode
                  if (conversationModeRef.current) {
                    setTimeout(() => startListeningInternal(true), 500);
                  }
                  return;
                }
              }

              // Check if user wants to start a multi-step flow
              const multiStepIntent = detectMultiStepIntent(transcriptText);
              if (multiStepIntent && user) {
                const flowStart = startMultiStepFlow(user.id, multiStepIntent);
                if (flowStart) {
                  setIsProcessing(false);
                  await speak(flowStart.prompt);
                  // Continue conversation mode
                  if (conversationModeRef.current) {
                    setTimeout(() => startListeningInternal(true), 500);
                  }
                  return;
                }
              }

              // Check for cancel/undo commands
              if (/\b(cancel|stop|never\s*mind)\b/i.test(transcriptText) && user && hasActiveFlow(user.id)) {
                cancelFlow(user.id);
                setIsProcessing(false);
                await speak("Cancelled. What else can I help with?");
                // Continue conversation mode
                if (conversationModeRef.current) {
                  setTimeout(() => startListeningInternal(true), 500);
                }
                return;
              }

              const response = await processVoiceCommand(transcriptText);
              playFeedback("success");
              
              // Log the voice interaction
              if (user) {
                logVoiceCommand(user.id, transcriptText, response);
              }
              
              await speak(response);
              
              // Note: Auto-continue is now handled in speak() cleanup
            } else {
              setIsProcessing(false);
              // If no speech detected but in conversation mode, keep listening
              if (conversationModeRef.current) {
                setTimeout(() => startListeningInternal(true), 500);
              }
            }
          } catch (error: any) {
            playFeedback("error");
            setIsProcessing(false);
            console.error("Voice processing error:", error);
            showError(error.message || "Voice processing failed");
            
            // Log the error
            if (user) {
              logAIError(user.id, error.message || "Voice processing failed", { transcript: transcriptText });
            }
            
            // Continue conversation mode even after error
            if (conversationModeRef.current) {
              await speak("Sorry, I had trouble with that. Please try again.");
              setTimeout(() => startListeningInternal(true), 500);
            }
          }
        } else {
          setIsProcessing(false);
          // If no audio but in conversation mode, keep listening
          if (conversationModeRef.current) {
            setTimeout(() => startListeningInternal(true), 500);
          }
        }
      };

      mediaRecorderRef.current.start(100);
      setIsListening(true);
      
      // In conversation mode, use silence detection to auto-stop
      if (isConversation && analyserRef.current) {
        const checkSilence = () => {
          if (!analyserRef.current || !mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") {
            return;
          }
          
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Calculate average volume
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          
          // Threshold for silence (adjust as needed)
          const silenceThreshold = 10;
          const silenceDuration = 2000; // 2 seconds of silence to stop
          
          if (average < silenceThreshold) {
            if (silenceStartRef.current === null) {
              silenceStartRef.current = Date.now();
            } else if (Date.now() - silenceStartRef.current > silenceDuration) {
              // Silence detected for long enough, stop recording
              console.log("Silence detected, stopping recording");
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                mediaRecorderRef.current.stop();
              }
              return;
            }
          } else {
            // Reset silence timer when sound is detected
            silenceStartRef.current = null;
          }
          
          // Continue checking
          if (conversationModeRef.current) {
            silenceTimeoutRef.current = setTimeout(checkSilence, 100);
          }
        };
        
        // Start checking after a brief delay to allow user to start speaking
        silenceTimeoutRef.current = setTimeout(checkSilence, 1000);
      }
    } catch (error: any) {
      console.error("Failed to start recording:", error);
      showError(error.message || "Failed to start recording. Please check microphone permissions.");
    }
  }, [isListening, openaiApiKey, processVoiceCommand, speak, playFeedback, user, isQuietMode, preferences.quietModeExitPhrase]);

  const startListening = useCallback(async () => {
    await startListeningInternal(false);
  }, [startListeningInternal]);

  const stopListening = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    analyserRef.current = null;
    silenceStartRef.current = null;
    setIsListening(false);
  }, []);

  const startConversationMode = useCallback(async () => {
    if (isConversationMode) return;
    
    console.log("Starting conversation mode");
    setIsConversationMode(true);
    conversationModeRef.current = true;
    
    // Play a greeting
    await speak(`Hi! I'm ${preferences.assistantName || "Echo"}. How can I help you?`);
    
    // Start listening
    await startListeningInternal(true);
  }, [isConversationMode, speak, startListeningInternal, preferences.assistantName]);

  const stopConversationMode = useCallback(() => {
    console.log("Stopping conversation mode");
    conversationModeRef.current = false;
    setIsConversationMode(false);
    
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    stopListening();
    stopSpeaking();
  }, [stopListening, stopSpeaking]);

  const enterQuietMode = useCallback((context?: string) => {
    if (!user) return;
    startListeningSession(user.id, context);
    setIsQuietMode(true);
    showSuccess(`Entering quiet mode${context ? ` for ${context}` : ""}. I'll just listen.`);
  }, [user]);

  const exitQuietMode = useCallback(async () => {
    if (!user || !openaiApiKey) {
      setIsQuietMode(false);
      return null;
    }

    try {
      const result = await endListeningSession(user.id, openaiApiKey);
      setIsQuietMode(false);
      
      if (result.success) {
        return {
          summary: result.summary || "",
          bulletPoints: result.bulletPoints || [],
          actionItems: result.actionItems || [],
        };
      }
    } catch (error) {
      console.error("Failed to exit quiet mode:", error);
    }
    
    setIsQuietMode(false);
    return null;
  }, [user, openaiApiKey]);

  // Check quiet mode status on mount
  useEffect(() => {
    if (user) {
      const status = getSessionStatus(user.id);
      setIsQuietMode(status.isActive);
    }
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      stopConversationMode();
    };
  }, []);

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