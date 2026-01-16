import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mic, Loader2, Volume2, PhoneOff, MicOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOpenAIKey } from "@/hooks/useOpenAIKey";
import { useVoice } from "@/contexts/VoiceContext";
import { showError } from "@/utils/toast";

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
    lastResponse,
    startConversationMode,
    stopConversationMode,
    stopSpeaking,
    startListening,
    stopListening
  } = useVoice();

  // Don't show on voice, chat, or login pages, or when not authenticated
  if (location.pathname === "/voice" || location.pathname === "/chat" || location.pathname === "/login" || !user) {
    return null;
  }

  const handleMicClick = async () => {
    if (!hasOpenAIKey) {
      showError('Please add your OpenAI API key in Settings');
      navigate('/settings');
      return;
    }

    if (isConversationMode) {
      // In conversation mode, clicking ends the conversation
      stopConversationMode();
    } else if (isSpeaking) {
      // If speaking outside conversation mode, stop
      stopSpeaking();
    } else if (isListening) {
      // If listening outside conversation mode, stop
      stopListening();
    } else if (!isProcessing) {
      // Start conversation mode - this will greet and auto-listen
      await startConversationMode();
    }
  };

  const handleMicLongPress = () => {
    navigate("/voice");
  };

  const getMicState = () => {
    if (isConversationMode) {
      if (isListening) return { 
        icon: Mic, 
        color: "bg-green-500 animate-pulse ring-4 ring-green-500/30", 
        label: "Listening...",
        pulseColor: "bg-green-400"
      };
      if (isProcessing) return { 
        icon: Loader2, 
        color: "bg-yellow-500", 
        label: "Thinking...",
        pulseColor: "bg-yellow-400"
      };
      if (isSpeaking) return { 
        icon: Volume2, 
        color: "bg-blue-500 animate-pulse", 
        label: "Speaking...",
        pulseColor: "bg-blue-400"
      };
      return { 
        icon: PhoneOff, 
        color: "bg-green-600 ring-2 ring-green-400/50", 
        label: "Tap to end",
        pulseColor: "bg-green-400"
      };
    }
    if (isListening) return { 
      icon: Mic, 
      color: "bg-red-500 animate-pulse ring-4 ring-red-500/30", 
      label: "Listening...",
      pulseColor: "bg-red-400"
    };
    if (isProcessing) return { 
      icon: Loader2, 
      color: "bg-yellow-500", 
      label: "Processing...",
      pulseColor: "bg-yellow-400"
    };
    if (isSpeaking) return { 
      icon: Volume2, 
      color: "bg-green-500 animate-pulse", 
      label: "Speaking...",
      pulseColor: "bg-green-400"
    };
    return { 
      icon: Mic, 
      color: "bg-fuchsia-600 hover:bg-fuchsia-500", 
      label: "Start Conversation",
      pulseColor: "bg-fuchsia-400"
    };
  };

  const micState = getMicState();
  const MicIcon = micState.icon;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Conversation Mode Status Panel */}
      {isConversationMode && (
        <div className="p-3 rounded-2xl bg-slate-900/95 border border-green-500/50 backdrop-blur-lg shadow-2xl animate-in slide-in-from-bottom-2 max-w-xs min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${micState.pulseColor} ${isListening || isSpeaking ? 'animate-pulse' : ''}`} />
            <p className="text-xs text-green-300 font-medium">
              {isListening ? "🎤 Listening... (speak now)" :
               isProcessing ? "🤔 Processing..." :
               isSpeaking ? "🔊 Speaking..." :
               "⏳ Starting..."}
            </p>
          </div>
          
          {/* Show current transcript while listening/processing */}
          {(isListening || isProcessing) && currentTranscript && (
            <div className="mb-2">
              <p className="text-xs text-slate-400">You said:</p>
              <p className="text-sm text-white">"{currentTranscript}"</p>
            </div>
          )}
          
          {/* Show last response while speaking */}
          {isSpeaking && lastResponse && (
            <div className="mb-2">
              <p className="text-xs text-slate-400">Echo:</p>
              <p className="text-sm text-white line-clamp-2">"{lastResponse}"</p>
            </div>
          )}
          
          {/* Instructions when listening */}
          {isListening && (
            <p className="text-xs text-green-400/70">
              🎙️ Hands-free mode • I'll hear you automatically
            </p>
          )}
          
          {/* Tap to end hint */}
          <p className="text-xs text-slate-500 mt-1">
            Say "goodbye" or tap mic to end
          </p>
        </div>
      )}

      {/* Single command mode transcript display */}
      {!isConversationMode && (isListening || isProcessing) && currentTranscript && (
        <div className="p-3 rounded-2xl bg-slate-900/95 border border-fuchsia-500/30 backdrop-blur-lg shadow-2xl animate-in slide-in-from-bottom-2 max-w-xs">
          <p className="text-xs text-fuchsia-300 mb-1">You said:</p>
          <p className="text-sm text-white">"{currentTranscript}"</p>
        </div>
      )}

      {/* Mic Button */}
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
      
      {/* Label below button */}
      {!isConversationMode && !isListening && !isProcessing && !isSpeaking && (
        <span className="text-xs text-slate-400 text-center">
          Tap to talk
        </span>
      )}
    </div>
  );
}