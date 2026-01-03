import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mic, MessageSquare, X, Send, Loader2, Volume2, MicOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/state/preferences";
import { useVoice } from "@/contexts/VoiceContext";
import { showError, showSuccess } from "@/utils/toast";

export default function MicButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const { isListening, isProcessing, isSpeaking, startListening, stopListening, processVoiceCommand, speak, stopSpeaking } = useVoice();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [quickInput, setQuickInput] = useState("");
  const [isTextProcessing, setIsTextProcessing] = useState(false);

  // Don't show on voice or chat pages
  if (location.pathname === "/voice" || location.pathname === "/chat") {
    return null;
  }

  const handleMicClick = async () => {
    if (isListening) {
      stopListening();
    } else if (isSpeaking) {
      stopSpeaking();
    } else {
      await startListening();
    }
  };

  const handleMicLongPress = () => {
    navigate("/voice");
  };

  const handleChatClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleQuickSend = async () => {
    if (!quickInput.trim() || !user || !preferences.openaiApiKey) {
      if (!preferences.openaiApiKey) {
        showError("Please set your OpenAI API key in Settings");
      }
      return;
    }

    setIsTextProcessing(true);

    try {
      const response = await processVoiceCommand(quickInput);
      showSuccess("Done!");
      
      // Optionally speak the response
      if (response && response.length < 200) {
        await speak(response);
      }

      setQuickInput("");
      setIsExpanded(false);
    } catch (error: any) {
      showError(error.message || "Failed to process");
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
    if (isListening) return { icon: Mic, color: "bg-red-500 animate-pulse", label: "Listening..." };
    if (isProcessing) return { icon: Loader2, color: "bg-blue-500", label: "Processing..." };
    if (isSpeaking) return { icon: Volume2, color: "bg-green-500 animate-pulse", label: "Speaking..." };
    return { icon: Mic, color: "bg-fuchsia-600 hover:bg-fuchsia-500", label: "Voice command" };
  };

  const micState = getMicState();
  const MicIcon = micState.icon;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {/* Quick Input */}
      {isExpanded && (
        <div className="flex items-center gap-2 p-2 rounded-full bg-slate-900/95 border border-fuchsia-500/30 backdrop-blur-lg shadow-2xl animate-in slide-in-from-bottom-2">
          <Input
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Quick command..."
            className="w-64 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 rounded-full"
            disabled={isTextProcessing}
            autoFocus
          />
          <Button
            size="icon"
            onClick={handleQuickSend}
            disabled={isTextProcessing || !quickInput.trim()}
            className="rounded-full bg-fuchsia-600 hover:bg-fuchsia-500 h-9 w-9"
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
            className="rounded-full text-slate-400 hover:text-white h-9 w-9"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Status indicator */}
      {(isListening || isProcessing || isSpeaking) && (
        <div className="px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-xs text-slate-300 animate-in fade-in">
          {micState.label}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Chat Button */}
        <button
          onClick={handleChatClick}
          className={`h-12 w-12 rounded-full flex items-center justify-center shadow-xl transition-all ${
            isExpanded 
              ? "bg-slate-700 text-white" 
              : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
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
          className={`h-16 w-16 rounded-full flex items-center justify-center shadow-2xl transition-all ${micState.color} text-white hover:scale-105 active:scale-95`}
          aria-label={micState.label}
          title={`${micState.label} (double-click for full voice chat)`}
        >
          <MicIcon className={`h-7 w-7 ${isProcessing ? 'animate-spin' : ''}`} />
          <span className="absolute -z-10 h-24 w-24 rounded-full blur-2xl bg-fuchsia-500/40" />
        </button>
      </div>

      {/* Hint */}
      {!isListening && !isProcessing && !isSpeaking && !isExpanded && (
        <p className="text-[10px] text-slate-500 text-center max-w-[120px]">
          Tap to speak • Double-tap for voice chat
        </p>
      )}
    </div>
  );
}