import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, Loader2, Phone, PhoneOff, Wrench, Navigation, Settings, VolumeX } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { usePreferences } from "../state/preferences";
import { useAuth } from "@/contexts/AuthContext";
import { transcribeAudio, synthesizeSpeech, playAudioBlob } from "../services/openai-voice";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import { buildSystemPrompt, parseToolCalls, executeTool, ActionResult } from "@/services/orchestrator";
import { getLocationContext, LocationContext } from "@/services/context";
import { normalizeSpeechInput } from "@/services/conversation-manager";
import { stopSpeaking } from "@/services/enhanced-voice";
import { generateMorningBriefing, configureVoiceNotifications } from "@/services/voice-notifications";
import { supabase } from "@/integrations/supabase/client";
import VoiceCommandExamples from "@/components/VoiceCommandExamples";
import VoiceHistory, { saveVoiceInteraction } from "@/components/VoiceHistory";
import QuietModeControl from "@/components/QuietModeControl";
import type { Message } from "../types/models";

type ConversationState = "idle" | "listening" | "processing" | "speaking";

// Direct OpenAI chat function for voice
async function chatWithOpenAITools(
  messages: { role: string; content: string }[],
  apiKey: string
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export default function VoiceChat() {
  const navigate = useNavigate();
  const { preferences } = usePreferences();
  const { user } = useAuth();
  const [conversationState, setConversationState] = useState<ConversationState>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [lastToolsUsed, setLastToolsUsed] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userLocation, setUserLocation] = useState<LocationContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Try to get user location on mount
  useEffect(() => {
    getLocationContext().then(loc => {
      if (loc) setUserLocation(loc);
    }).catch(() => {
      // Location not available
    });
  }, []);

  // Configure voice notifications
  useEffect(() => {
    if (preferences.openaiApiKey) {
      configureVoiceNotifications({
        apiKey: preferences.openaiApiKey,
        voice: preferences.openaiVoice,
        enabled: true,
      });
    }
  }, [preferences.openaiApiKey, preferences.openaiVoice]);

  // Morning briefing function
  const playMorningBriefing = async () => {
    if (!preferences.openaiApiKey || !user) {
      showError("Please set your OpenAI API key in Settings");
      return;
    }

    setConversationState("processing");
    try {
      const briefing = await generateMorningBriefing(user.id, supabase);
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: briefing,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      setConversationState("speaking");
      const speechBlob = await synthesizeSpeech(briefing, preferences.openaiApiKey, preferences.openaiVoice);
      const audio = new Audio();
      audioRef.current = audio;
      audio.src = URL.createObjectURL(speechBlob);
      
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audio.src);
          audioRef.current = null;
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audio.src);
          audioRef.current = null;
          reject(new Error("Audio playback failed"));
        };
        audio.play().catch(reject);
      });

      if (isConversationActive && preferences.conversationMode) {
        startListening();
      } else {
        setConversationState("idle");
      }
    } catch (err: any) {
      showError(err.message || "Failed to generate briefing");
      setConversationState("idle");
    }
  };

  // Handle pending navigation after speaking
  useEffect(() => {
    if (pendingNavigation && conversationState === "idle") {
      const timer = setTimeout(() => {
        navigate(pendingNavigation);
        setPendingNavigation(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pendingNavigation, conversationState, navigate]);

  const handleSilenceDetected = useCallback(() => {
    if (conversationState === "listening") {
      stopRecording();
    }
  }, [conversationState]);

  const { isRecording, audioBlob, startRecording, stopRecording, error: recorderError } = useVoiceRecorder({
    silenceThreshold: preferences.silenceThreshold,
    silenceTimeout: preferences.silenceTimeout,
    onSilenceDetected: preferences.conversationMode ? handleSilenceDetected : undefined,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (audioBlob && conversationState === "listening") {
      processAudio(audioBlob);
    }
  }, [audioBlob]);

  const stopCurrentAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    stopSpeaking();
  };

  const processAudio = async (blob: Blob) => {
    if (!preferences.openaiApiKey) {
      showError("Please set your OpenAI API key in Settings");
      setConversationState("idle");
      return;
    }

    setConversationState("processing");
    setLastToolsUsed([]);

    try {
      const transcription = await transcribeAudio(blob, preferences.openaiApiKey);
      let userText = transcription.text.trim();

      if (!userText) {
        if (isConversationActive && preferences.conversationMode) {
          startListening();
        } else {
          setConversationState("idle");
        }
        return;
      }

      // Normalize speech input for better understanding
      const normalizedText = normalizeSpeechInput(userText);
      setCurrentTranscript(userText);

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: userText,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Build messages with system prompt for tool usage (location-aware)
      const systemPrompt = buildSystemPrompt(userLocation ? {
        lat: userLocation.lat,
        lng: userLocation.lng,
        city: userLocation.city,
      } : undefined);
      const chatMessages = [
        { role: "system", content: systemPrompt },
        ...messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: normalizedText },
      ];

      let response = await chatWithOpenAITools(chatMessages, preferences.openaiApiKey);

      // Check for tool calls and execute them
      const toolCalls = parseToolCalls(response);
      let toolResults: ActionResult[] = [];
      let navigationPath: string | null = null;

      if (toolCalls.length > 0 && user) {
        for (const toolCall of toolCalls) {
          const result = await executeTool(user.id, toolCall);
          toolResults.push(result);

          // Check for navigation
          if (toolCall.tool === "navigate_to" && result.success && result.data?.path) {
            navigationPath = result.data.path;
          }
        }

        setLastToolsUsed(toolResults.map(r => r.tool));

        // Get a follow-up response summarizing what was done
        if (toolResults.length > 0) {
          const toolResultsText = toolResults.map(r => {
            if (r.tool === "navigate_to") {
              return `Navigation: ${r.success ? `Going to ${r.data?.description}` : r.error}`;
            }
            if (r.data?.voiceText) {
              return `Tool: ${r.tool}\nResult: ${r.data.voiceText}`;
            }
            return `Tool: ${r.tool}\nSuccess: ${r.success}\n${r.success ? `Result: ${JSON.stringify(r.data, null, 2)}` : `Error: ${r.error}`}`;
          }).join("\n\n");

          const followUpMessages = [
            ...chatMessages,
            { role: "assistant", content: response },
            { role: "user", content: `Tool execution results:\n${toolResultsText}\n\nProvide a BRIEF, conversational voice response (1-2 sentences max). If there's voice text in the results, use that. Don't repeat JSON or technical details.` },
          ];

          response = await chatWithOpenAITools(followUpMessages, preferences.openaiApiKey);
        }
      }

      // Clean response for speech (remove JSON blocks and markdown)
      let cleanResponse = response
        .replace(/```json[\s\S]*?```/g, '')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#{1,6}\s/g, '')
        .trim();

      // If we have voice text from tools, prefer that
      const voiceTextResult = toolResults.find(r => r.data?.voiceText);
      if (voiceTextResult?.data?.voiceText) {
        cleanResponse = voiceTextResult.data.voiceText;
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: cleanResponse,
        toolCall: toolResults.length > 0 ? {
          type: "orchestrator",
          input: toolCalls.map(t => t.tool).join(", "),
          outputMeta: { tools: toolResults.map(r => ({ tool: r.tool, success: r.success })) }
        } : undefined,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Speak the response (unless muted)
      if (!isMuted) {
        setConversationState("speaking");
        try {
          const speechBlob = await synthesizeSpeech(cleanResponse, preferences.openaiApiKey, preferences.openaiVoice);
          const audio = new Audio();
          audioRef.current = audio;
          audio.src = URL.createObjectURL(speechBlob);
          
          await new Promise<void>((resolve, reject) => {
            audio.onended = () => {
              URL.revokeObjectURL(audio.src);
              audioRef.current = null;
              resolve();
            };
            audio.onerror = () => {
              URL.revokeObjectURL(audio.src);
              audioRef.current = null;
              reject(new Error("Audio playback failed"));
            };
            audio.play().catch(reject);
          });
        } catch (err) {
          console.error("Speech synthesis error:", err);
        }
      }

      // Save to voice history
      saveVoiceInteraction({
        userText: userText,
        assistantText: cleanResponse,
        timestamp: Date.now(),
        toolsUsed: toolResults.map(r => r.tool),
      });

      // Show success toast for tool actions
      if (toolResults.length > 0) {
        const successCount = toolResults.filter(r => r.success).length;
        if (successCount > 0) {
          showSuccess(`Completed ${successCount} action${successCount > 1 ? 's' : ''}`);
        }
      }

      // Handle navigation after speaking
      if (navigationPath) {
        setPendingNavigation(navigationPath);
      }

      if (isConversationActive && preferences.conversationMode && !navigationPath) {
        startListening();
      } else {
        setConversationState("idle");
      }
    } catch (err: any) {
      showError(err.message || "Voice processing failed");
      setConversationState("idle");
    }
  };

  const startListening = async () => {
    setCurrentTranscript("");
    setConversationState("listening");
    await startRecording();
  };

  const startConversation = async () => {
    if (!preferences.openaiApiKey) {
      showError("Please set your OpenAI API key in Settings");
      return;
    }
    setIsConversationActive(true);
    await startListening();
  };

  const endConversation = () => {
    setIsConversationActive(false);
    stopRecording();
    stopCurrentAudio();
    setConversationState("idle");
  };

  const toggleListening = async () => {
    if (conversationState === "listening") {
      stopRecording();
    } else if (conversationState === "idle") {
      await startListening();
    } else if (conversationState === "speaking") {
      // Stop speaking and start listening
      stopCurrentAudio();
      await startListening();
    }
  };

  const toggleMute = () => {
    if (!isMuted && conversationState === "speaking") {
      stopCurrentAudio();
      setConversationState("idle");
    }
    setIsMuted(!isMuted);
  };

  const clearMessages = () => {
    setMessages([]);
    showSuccess("Conversation cleared");
  };

  const getStateIcon = () => {
    switch (conversationState) {
      case "listening":
        return <Mic className="h-12 w-12 animate-pulse" />;
      case "processing":
        return <Loader2 className="h-12 w-12 animate-spin" />;
      case "speaking":
        return <Volume2 className="h-12 w-12 animate-pulse" />;
      default:
        return <MicOff className="h-12 w-12" />;
    }
  };

  const getStateText = () => {
    switch (conversationState) {
      case "listening":
        return "Listening...";
      case "processing":
        return "Thinking...";
      case "speaking":
        return "Speaking...";
      default:
        return "Ready";
    }
  };

  const getStateColor = () => {
    switch (conversationState) {
      case "listening":
        return "from-fuchsia-500 to-purple-600";
      case "processing":
        return "from-blue-500 to-cyan-600";
      case "speaking":
        return "from-green-500 to-emerald-600";
      default:
        return "from-slate-600 to-slate-700";
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-2xl flex flex-col h-[calc(100vh-88px)]">
        <Card className="flex-1 border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl flex flex-col">
          <CardContent className="flex-1 flex flex-col p-6">
            {/* Header with controls */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">Voice Chat</h2>
                {isConversationActive && (
                  <Badge variant="outline" className="border-green-500 text-green-400 text-xs">
                    Active
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className={`h-8 w-8 ${isMuted ? 'text-red-400' : 'text-slate-400'} hover:text-white`}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                {messages.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearMessages}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-6">
              {messages.length === 0 ? (
                <div className="flex flex-col h-full">
                  <div className="flex flex-col items-center justify-center flex-1 text-center">
                    <div className="text-4xl mb-4">🎙️</div>
                    <p className="text-lg text-white mb-2">Voice-First AI Assistant</p>
                    <p className="text-sm text-slate-400 max-w-md mb-2">
                      Speak naturally to Echo. I can navigate the app, read your tasks and reminders, give you daily summaries, and much more.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                      <Badge variant="outline" className="border-fuchsia-500/50 text-fuchsia-300 text-xs">
                        <Navigation className="h-3 w-3 mr-1" />
                        "Open my tasks"
                      </Badge>
                      <Badge variant="outline" className="border-fuchsia-500/50 text-fuchsia-300 text-xs">
                        "Read my reminders"
                      </Badge>
                      <Badge variant="outline" className="border-fuchsia-500/50 text-fuchsia-300 text-xs">
                        "Summarize my day"
                      </Badge>
                    </div>
                  </div>
                  <VoiceCommandExamples />
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      m.role === "user"
                        ? "ml-auto bg-fuchsia-600/40 text-white"
                        : "bg-slate-800 text-slate-100 border border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1">
                      <span>{m.role === "user" ? "You" : "Echo"}</span>
                      <span>•</span>
                      <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                      {m.toolCall && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-fuchsia-300">
                            <Wrench className="h-3 w-3" />
                            {m.toolCall.input}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Current Transcript */}
            {currentTranscript && conversationState === "processing" && (
              <div className="mb-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-sm text-slate-300 italic">"{currentTranscript}"</p>
              </div>
            )}

            {/* Tools Used Indicator */}
            {lastToolsUsed.length > 0 && conversationState === "processing" && (
              <div className="mb-4 flex items-center gap-2 text-sm text-fuchsia-300">
                <Wrench className="h-4 w-4 animate-spin" />
                <span>Executing: {lastToolsUsed.join(", ")}</span>
              </div>
            )}

            {/* Pending Navigation Indicator */}
            {pendingNavigation && (
              <div className="mb-4 flex items-center gap-2 text-sm text-green-300">
                <Navigation className="h-4 w-4" />
                <span>Navigating to {pendingNavigation}...</span>
              </div>
            )}

            {/* Voice Control Area */}
            <div className="flex flex-col items-center space-y-4">
              {/* State Indicator */}
              <div className="text-center">
                <button
                  onClick={toggleListening}
                  disabled={conversationState === "processing"}
                  className={`w-28 h-28 rounded-full bg-gradient-to-br ${getStateColor()} flex items-center justify-center shadow-2xl transition-all ${
                    conversationState === "listening" ? "ring-4 ring-fuchsia-400/50 scale-110" : ""
                  } ${conversationState !== "processing" ? "hover:scale-105 active:scale-95 cursor-pointer" : "cursor-not-allowed"}`}
                >
                  <div className="text-white">{getStateIcon()}</div>
                </button>
                <p className="mt-3 text-lg font-medium text-white">{getStateText()}</p>
                {conversationState === "speaking" && (
                  <p className="text-xs text-slate-400 mt-1">Tap to interrupt</p>
                )}
              </div>

              {/* Control Buttons */}
              <div className="flex flex-wrap gap-3 justify-center">
                {!isConversationActive ? (
                  <>
                    <Button
                      size="lg"
                      onClick={startConversation}
                      className="bg-fuchsia-600 text-white hover:bg-fuchsia-500 px-6"
                      disabled={conversationState !== "idle"}
                    >
                      <Phone className="mr-2 h-5 w-5" />
                      Start Conversation
                    </Button>
                    <Button
                      size="lg"
                      onClick={toggleListening}
                      variant="outline"
                      className="border-slate-600 text-white hover:bg-slate-700"
                      disabled={conversationState !== "idle"}
                    >
                      <Mic className="mr-2 h-5 w-5" />
                      Push to Talk
                    </Button>
                    <Button
                      size="lg"
                      onClick={playMorningBriefing}
                      variant="outline"
                      className="border-blue-500/50 text-blue-300 hover:bg-blue-500/20"
                      disabled={conversationState !== "idle"}
                    >
                      <Volume2 className="mr-2 h-5 w-5" />
                      Daily Briefing
                    </Button>
                    <QuietModeControl />
                  </>
                ) : (
                  <Button
                    size="lg"
                    onClick={endConversation}
                    variant="destructive"
                    className="px-8"
                  >
                    <PhoneOff className="mr-2 h-5 w-5" />
                    End Conversation
                  </Button>
                )}
              </div>

              {/* Conversation Mode Indicator */}
              {isConversationActive && (
                <p className="text-sm text-fuchsia-300 text-center">
                  Conversation mode active • Speak naturally, Echo will respond automatically
                  {isMuted && " • Audio muted"}
                </p>
              )}

              {/* Quick Tips */}
              {!isConversationActive && conversationState === "idle" && (
                <div className="text-center text-xs text-slate-500 max-w-md">
                  <p>Try: "Open my tasks" • "Read my reminders" • "What's on my calendar?" • "Summarize my day"</p>
                </div>
              )}

              {recorderError && (
                <p className="text-sm text-red-400">{recorderError}</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Voice History */}
        {messages.length === 0 && (
          <VoiceHistory maxItems={3} showClear={false} className="mt-4" />
        )}
      </div>
    </div>
  );
}