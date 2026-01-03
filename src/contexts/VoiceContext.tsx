import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { usePreferences } from "@/state/preferences";
import { transcribeAudio, synthesizeSpeech, playAudioBlob } from "@/services/openai-voice";
import { buildSystemPrompt, parseToolCalls, executeTool, ActionResult } from "@/services/orchestrator";
import { getLocationContext, LocationContext } from "@/services/context";
import { normalizeSpeechInput } from "@/services/conversation-manager";
import { showError, showSuccess } from "@/utils/toast";

interface VoiceContextType {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  lastTranscript: string;
  startListening: () => Promise<void>;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  processVoiceCommand: (text: string) => Promise<string>;
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
  
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [userLocation, setUserLocation] = useState<LocationContext | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Get location on mount
  useEffect(() => {
    getLocationContext().then(loc => {
      if (loc) setUserLocation(loc);
    }).catch(() => {});
  }, []);

  const stopSpeaking = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!preferences.openaiApiKey) {
      showError("OpenAI API key not configured");
      return;
    }

    try {
      setIsSpeaking(true);
      const speechBlob = await synthesizeSpeech(
        text,
        preferences.openaiApiKey,
        preferences.openaiVoice
      );
      
      const audio = new Audio();
      currentAudioRef.current = audio;
      audio.src = URL.createObjectURL(speechBlob);
      
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audio.src);
          currentAudioRef.current = null;
          setIsSpeaking(false);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audio.src);
          currentAudioRef.current = null;
          setIsSpeaking(false);
          reject(new Error("Audio playback failed"));
        };
        audio.play().catch(reject);
      });
    } catch (error) {
      setIsSpeaking(false);
      throw error;
    }
  }, [preferences.openaiApiKey, preferences.openaiVoice]);

  const processVoiceCommand = useCallback(async (text: string): Promise<string> => {
    if (!preferences.openaiApiKey || !user) {
      throw new Error("Not configured");
    }

    setIsProcessing(true);
    setLastTranscript(text);

    try {
      const normalizedText = normalizeSpeechInput(text);
      
      const systemPrompt = buildSystemPrompt(userLocation ? {
        lat: userLocation.lat,
        lng: userLocation.lng,
        city: userLocation.city,
      } : undefined);

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
          ],
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        throw new Error("AI request failed");
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

      setIsProcessing(false);
      return finalResponse;
    } catch (error) {
      setIsProcessing(false);
      throw error;
    }
  }, [preferences.openaiApiKey, user, userLocation, navigate]);

  const startListening = useCallback(async () => {
    if (isListening) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        stream.getTracks().forEach((track) => track.stop());
        
        if (blob.size > 0 && preferences.openaiApiKey) {
          try {
            const transcription = await transcribeAudio(blob, preferences.openaiApiKey);
            const text = transcription.text.trim();
            
            if (text) {
              const response = await processVoiceCommand(text);
              await speak(response);
            }
          } catch (error: any) {
            showError(error.message || "Voice processing failed");
          }
        }
      };

      mediaRecorderRef.current.start(100);
      setIsListening(true);
    } catch (error: any) {
      showError(error.message || "Failed to start recording");
    }
  }, [isListening, preferences.openaiApiKey, processVoiceCommand, speak]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsListening(false);
  }, []);

  return (
    <VoiceContext.Provider
      value={{
        isListening,
        isProcessing,
        isSpeaking,
        lastTranscript,
        startListening,
        stopListening,
        speak,
        stopSpeaking,
        processVoiceCommand,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}