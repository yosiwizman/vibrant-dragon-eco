import { useLocation } from "react-router-dom";
import { useVoice } from "@/contexts/VoiceContext";
import { useAuth } from "@/contexts/AuthContext";
import { Mic, Loader2, Volume2 } from "lucide-react";

export default function VoiceStatusIndicator() {
  const location = useLocation();
  const { user } = useAuth();
  const { isListening, isProcessing, isSpeaking, lastTranscript } = useVoice();

  // Don't show on login page or when not authenticated
  if (location.pathname === "/login" || !user) {
    return null;
  }

  if (!isListening && !isProcessing && !isSpeaking) {
    return null;
  }

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2">
      <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900/95 border border-fuchsia-500/30 backdrop-blur-lg shadow-2xl">
        {isListening && (
          <>
            <div className="relative">
              <Mic className="h-5 w-5 text-red-400 animate-pulse" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-ping" />
            </div>
            <span className="text-sm text-white">Listening...</span>
          </>
        )}
        {isProcessing && (
          <>
            <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
            <span className="text-sm text-white">
              {lastTranscript ? `"${lastTranscript.slice(0, 30)}${lastTranscript.length > 30 ? '...' : ''}"` : "Processing..."}
            </span>
          </>
        )}
        {isSpeaking && (
          <>
            <Volume2 className="h-5 w-5 text-green-400 animate-pulse" />
            <span className="text-sm text-white">Speaking...</span>
          </>
        )}
      </div>
    </div>
  );
}