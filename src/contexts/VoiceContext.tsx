import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { usePreferences } from "@/state/preferences";
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

interface VoiceContextType {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isQuietMode: boolean;
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
  const { playFeedback } = useVoiceFeedback();
  
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isQuietMode, setIsQuietMode] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [lastResponse, setLastResponse] = useState("");
  const [userLocation, setUserLocation] = useState<LocationContext | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

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
    if (preferences.wakeWordEnabled && isWakeWordSupported() && !isListening && !isProcessing && !isSpeaking) {
      startWakeWordDetection({
        wakeWord: preferences.wakeWord || "echo",
        onWakeWordDetected: () => {
          showSuccess(`${preferences.assistantName || "Echo"} is listening...`);
          startListening();
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
  }, [preferences.wakeWordEnabled, preferences.wakeWord, isListening, isProcessing, isSpeaking]);

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
    if (!preferences.openaiApiKey) {
      console.error("OpenAI API key not configured");
      showError("OpenAI API key not configured. Go to Settings to add it.");
      return;
    }

    if (!text || text.trim().length === 0) {
      console.warn("Empty text provided to speak function");
      return;
    }

    // Stop any current audio
    stopSpeaking();

    try {
      setIsSpeaking(true);
      console.log("Synthesizing speech for:", text.substring(0, 50) + "...");
      
      const speechBlob = await synthesizeSpeech(
        text,
        preferences.openaiApiKey,
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
  }, [preferences.openaiApiKey, preferences.openaiVoice, stopSpeaking]);

  const processVoiceCommand = useCallback(async (text: string): Promise<string> => {
    if (!preferences.openaiApiKey || !user) {
      throw new Error("Not configured - please add your OpenAI API key in Settings");
    }

    setIsProcessing(true);
    setLastTranscript(text);
    setCurrentTranscript("");

    try {
      const normalizedText = normalizeSpeechInput(text);
      
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
          Authorization: `Bearer ${preferences.openaiApiKey}`,
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
              Authorization: `Bearer ${preferences.openaiApiKey}`,
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
      return finalResponse;
    } catch (error: any) {
      setIsProcessing(false);
      console.error("Voice command processing error:", error);
      throw error;
    }
  }, [preferences.openaiApiKey, user, userLocation, navigate, preferences.enableMemory, preferences.enableChatHistory, preferences.chatHistoryLimit, preferences.privateMode, preferences.assistantName]);

  const startListening = useCallback(async () => {
    if (isListening) return;

    if (!preferences.openaiApiKey) {
      showError("Please add your OpenAI API key in Settings first");
      return;
    }

    try {
      playFeedback("start");
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
      
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        playFeedback("stop");
        const blob = new Blob(chunksRef.current, { type: mimeType });
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        
        if (blob.size > 0 && preferences.openaiApiKey) {
          let transcriptText = "";
          try {
            setIsProcessing(true);
            console.log("Transcribing audio, blob size:", blob.size);
            
            const transcription = await transcribeAudio(blob, preferences.openaiApiKey);
            transcriptText = transcription.text.trim();
            
            console.log("Transcription result:", transcriptText);
            setCurrentTranscript(transcriptText);
            
            if (transcriptText) {
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
                } else if (flowResult.nextPrompt) {
                  setIsProcessing(false);
                  await speak(flowResult.nextPrompt);
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
                  return;
                }
              }

              // Check for cancel/undo commands
              if (/\b(cancel|stop|never\s*mind)\b/i.test(transcriptText) && user && hasActiveFlow(user.id)) {
                cancelFlow(user.id);
                setIsProcessing(false);
                await speak("Cancelled. What else can I help with?");
                return;
              }

              const response = await processVoiceCommand(transcriptText);
              playFeedback("success");
              
              // Log the voice interaction
              if (user) {
                logVoiceCommand(user.id, transcriptText, response);
              }
              
              await speak(response);
            } else {
              setIsProcessing(false);
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
          }
        } else {
          setIsProcessing(false);
        }
      };

      mediaRecorderRef.current.start(100);
      setIsListening(true);
    } catch (error: any) {
      console.error("Failed to start recording:", error);
      showError(error.message || "Failed to start recording. Please check microphone permissions.");
    }
  }, [isListening, preferences.openaiApiKey, processVoiceCommand, speak, playFeedback, user, isQuietMode, preferences.quietModeExitPhrase]);

  const stopListening = useCallback(() => {
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
    setIsListening(false);
  }, []);

  const enterQuietMode = useCallback((context?: string) => {
    if (!user) return;
    startListeningSession(user.id, context);
    setIsQuietMode(true);
    showSuccess(`Entering quiet mode${context ? ` for ${context}` : ""}. I'll just listen.`);
  }, [user]);

  const exitQuietMode = useCallback(async () => {
    if (!user || !preferences.openaiApiKey) {
      setIsQuietMode(false);
      return null;
    }

    try {
      const result = await endListeningSession(user.id, preferences.openaiApiKey);
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
  }, [user, preferences.openaiApiKey]);

  // Check quiet mode status on mount
  useEffect(() => {
    if (user) {
      const status = getSessionStatus(user.id);
      setIsQuietMode(status.isActive);
    }
  }, [user]);

  return (
    <VoiceContext.Provider
      value={{
        isListening,
        isProcessing,
        isSpeaking,
        isQuietMode,
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
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}