import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, Loader2, Phone, PhoneOff } from "lucide-react";
import { showError } from "@/utils/toast";
import { usePreferences } from "../state/preferences";
import { transcribeAudio, synthesizeSpeech, chatWithOpenAI, playAudioBlob } from "../services/openai-voice";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import type { Message } from "../types/models";

type ConversationState = "idle" | "listening" | "processing" | "speaking";

export default function VoiceChat() {
  const { preferences } = usePreferences();
  const [conversationState, setConversationState] = useState<ConversationState>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isConversationActive, setIsConversationActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const processAudio = async (blob: Blob) => {
    if (!preferences.openaiApiKey) {
      showError("Please set your OpenAI API key in Settings");
      setConversationState("idle");
      return;
    }

    setConversationState("processing");

    try {
      const transcription = await transcribeAudio(blob, preferences.openaiApiKey);
      const userText = transcription.text.trim();

      if (!userText) {
        if (isConversationActive && preferences.conversationMode) {
          startListening();
        } else {
          setConversationState("idle");
        }
        return;
      }

      setCurrentTranscript(userText);

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: userText,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);

      const chatMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await chatWithOpenAI(chatMessages, preferences.openaiApiKey);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      setConversationState("speaking");
      const speechBlob = await synthesizeSpeech(response, preferences.openaiApiKey, preferences.openaiVoice);
      await playAudioBlob(speechBlob);

      if (isConversationActive && preferences.conversationMode) {
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
    setConversationState("idle");
  };

  const toggleListening = async () => {
    if (conversationState === "listening") {
      stopRecording();
    } else if (conversationState === "idle") {
      await startListening();
    }
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
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-6">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-400 text-center">
                    Start a conversation by clicking the microphone or the "Start Conversation" button below.
                  </p>
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
                    <div className="text-[10px] text-slate-400 mb-1">
                      {m.role === "user" ? "You" : "Echo"} • {new Date(m.createdAt).toLocaleTimeString()}
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

            {/* Voice Control Area */}
            <div className="flex flex-col items-center space-y-4">
              {/* State Indicator */}
              <div className="text-center">
                <div
                  className={`w-32 h-32 rounded-full bg-gradient-to-br ${getStateColor()} flex items-center justify-center shadow-2xl transition-all duration-300 ${
                    conversationState === "listening" ? "ring-4 ring-fuchsia-400/50 scale-110" : ""
                  }`}
                >
                  <div className="text-white">{getStateIcon()}</div>
                </div>
                <p className="mt-3 text-lg font-medium text-white">{getStateText()}</p>
              </div>

              {/* Control Buttons */}
              <div className="flex gap-3">
                {!isConversationActive ? (
                  <>
                    <Button
                      size="lg"
                      onClick={startConversation}
                      className="bg-fuchsia-600 text-white hover:bg-fuchsia-500 px-8"
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
                <p className="text-sm text-fuchsia-300">
                  Conversation mode active • Speak naturally, Echo will respond automatically
                </p>
              )}

              {recorderError && (
                <p className="text-sm text-red-400">{recorderError}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}