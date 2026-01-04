import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mic, Loader2, Volume2, PhoneOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOpenAIKey } from "@/hooks/useOpenAIKey";
import { useVoice } from "@/contexts/VoiceContext";

export default function MicButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { hasKey: hasOpenAIKey } = useOpenAIKey();
  const {
    isListening, 
    isProcessing, 
    isSpeaking,
    isConversationMode,
    currentTranscript,
    startConversationMode,
    stopConversationMode,
    stopSpeaking
  } = useVoice();

  // Don't show on voice, chat, or login pages, or when not authenticated
  if (location.pathname === "/voice" || location.pathname === "/chat" || location.pathname === "/login" || !user) {
    return null;
  }

  const handleMicClick = async () => {
    if (isConversationMode) {
      stopConversationMode();
    } else if (isSpeaking) {
      stopSpeaking();
    } else if (!isProcessing) {
      await startConversationMode();
    }
  };

  const handleMicLongPress = () => {
    navigate("/voice");
  };

  const getMicState = () => {
    if (isConversationMode) {
      if (isListening) return { icon: Mic, color: "bg-green-500 animate-pulse ring-4 ring-green-500/30", label: "Listening..." };
      if (isProcessing) return { icon: Loader2, color: "bg-green-600", label: "Processing..." };
      if (isSpeaking) return { icon: Volume2, color: "bg-green-500 animate-pulse", label: "Speaking..." };
      return { icon: PhoneOff, color: "bg-green-600 ring-2 ring-green-400/50", label: "In Conversation" };
    }
    if (isListening) return { icon: Mic, color: "bg-red-500 animate-pulse ring-4 ring-red-500/30", label: "Listening..." };
    if (isProcessing) return { icon: Loader2, color: "bg-yellow-500", label: "Processing..." };
    if (isSpeaking) return { icon: Volume2, color: "bg-green-500 animate-pulse", label: "Speaking..." };
    return { icon: Mic, color: "bg-fuchsia-600 hover:bg-fuchsia-500", label: "Start Conversation" };
  };

  const micState = getMicState();
  const MicIcon = micState.icon;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Conversation Mode Status */}
      {isConversationMode && (
        <div className="p-3 rounded-2xl bg-green-900/95 border border-green-500/50 backdrop-blur-lg shadow-2xl animate-in slide-in-from-bottom-2 max-w-xs">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-xs text-green-300 font-medium">
              {isListening ? "Listening..." : 
               isProcessing ? "Thinking..." : 
               isSpeaking ? "Speaking..." : 
               "Ready"}
            </p>
          </div>
          {currentTranscript && (
            <p className="text-sm text-white">
              <span className="text-green-300">You: </span>"{currentTranscript}"
            </p>
          )}
          {!currentTranscript && !isListening && !isProcessing && !isSpeaking && (
            <p className="text-xs text-green-400/70">Say "goodbye" to end conversation</p>
          )}
        </div>
      )}

      {/* Live Transcript Display (non-conversation mode) */}
      {!isConversationMode && (isListening || isProcessing) && currentTranscript && (
        <div className="p-3 rounded-2xl bg-slate-900/95 border border-fuchsia-500/30 backdrop-blur-lg shadow-2xl animate-in slide-in-from-bottom-2 max-w-xs">
          <p className="text-xs text-fuchsia-300 mb-1">You said:</p>
          <p className="text-sm text-white">"{currentTranscript}"</p>
        </div>
      )}

      {/* Mic Button Only - No message button */}
      <button
        onClick={handleMicClick}
        onDoubleClick={handleMicLongPress}
        disabled={isProcessing && !isConversationMode}
        className={`h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${micState.color} text-white hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label={micState.label}
        title={isConversationMode ? "Click to end conversation" : "Click to start conversation (double-tap for voice chat page)"}
      >
        <MicIcon className={`h-6 w-6 ${isProcessing && !isConversationMode ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}