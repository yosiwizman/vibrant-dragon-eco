import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mic, MessageSquare, X, Send, Loader2, Volume2, PhoneOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/state/preferences";
import { useOpenAIKey } from "@/hooks/useOpenAIKey";
import { useVoice } from "@/contexts/VoiceContext";
import { showError, showSuccess } from "@/utils/toast";

export default function MicButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const { apiKey: openaiApiKey, hasKey: hasOpenAIKey } = useOpenAIKey();
  const {
    isListening, 
    isProcessing, 
    isSpeaking,
    isConversationMode,
    currentTranscript,
    lastResponse,
    startListening, 
    stopListening, 
    processVoiceCommand, 
    speak, 
    stopSpeaking,
    startConversationMode,
    stopConversationMode
  } = useVoice();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [quickInput, setQuickInput] = useState("");
  const [isTextProcessing, setIsTextProcessing] = useState(false);

  // Don't show on voice, chat, or login pages, or when not authenticated
  if (location.pathname === "/voice" || location.pathname === "/chat" || location.pathname === "/login" || !user) {
    return null;
  }

  const handleMicClick = async () => {
    if (isConversationMode) {
      // Stop conversation mode
      stopConversationMode();
    } else if (isSpeaking) {
      stopSpeaking();
    } else if (!isProcessing) {
      // Start conversation mode instead of single recording
      await startConversationMode();
    }
  };

  const handleMicLongPress = () => {
    navigate("/voice");
  };

  const handleChatClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleQuickSend = async () => {
    if (!quickInput.trim() || !user || !openaiApiKey) {
      if (!openaiApiKey) {
        showError("Please set your OpenAI API key in Settings");
      }
      return;
    }

    setIsTextProcessing(true);

    try {
      const response = await processVoiceCommand(quickInput);
      showSuccess("Done!");
      
      if (response && response.length < 200) {
        await speak(response);
      }

      setQuickInput("");
      setIsExpanded(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process";
      showError(errorMessage);
    } finally {
      setIsTextProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleQuickSend();
    }
    if (e.key === "Escape") {
      setIsExpanded(false);
    }
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

      {/* Quick Input */}
      {isExpanded && (
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-900/95 border border-slate-700 backdrop-blur-lg shadow-2xl animate-in slide-in-from-bottom-2">
          <Input
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Quick command..."
            className="w-56 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 rounded-xl h-9 text-sm"
            disabled={isTextProcessing}
            autoFocus
          />
          <Button
            size="icon"
            onClick={handleQuickSend}
            disabled={isTextProcessing || !quickInput.trim()}
            className="rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 h-9 w-9"
          >
            {isTextProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsExpanded(false)}
            className="rounded-xl text-slate-400 hover:text-white h-9 w-9"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Chat Button */}
        <button
          onClick={handleChatClick}
          className={`h-11 w-11 rounded-full flex items-center justify-center shadow-lg transition-all ${
            isExpanded 
              ? "bg-slate-700 text-white" 
              : "bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white"
          }`}
          aria-label="Quick message"
          title="Quick message"
        >
          <MessageSquare className="h-5 w-5" />
        </button>

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
      </div>
    </div>
  );
}