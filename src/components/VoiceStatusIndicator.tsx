import { useLocation } from "react-router-dom";
import { useVoice } from "@/contexts/VoiceContext";
import { useAuth } from "@/contexts/AuthContext";
import { Mic, Loader2, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VoiceStatusIndicator() {
  const location = useLocation();
  const { user } = useAuth();
  const { 
    isListening, 
    isProcessing, 
    isSpeaking, 
    lastTranscript, 
    currentTranscript,
    lastResponse,
    stopListening,
    stopSpeaking 
  } = useVoice();

  // Don't show on login page or when not authenticated
  if (location.pathname === "/login" || !user) {
    return null;
  }

  if (!isListening && !isProcessing && !isSpeaking) {
    return null;
  }

  // Get the best transcript to display
  const displayTranscript = currentTranscript || lastTranscript;

  const handleStop = () => {
    if (isListening) {
      stopListening();
    } else if (isSpeaking) {
      stopSpeaking();
    }
  };

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 border border-fuchsia-500/30 backdrop-blur-lg shadow-2xl max-w-md">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isListening && (
            <>
              <div className="relative shrink-0">
                <Mic className="h-5 w-5 text-red-400 animate-pulse" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-ping" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm text-white font-medium">Listening...</span>
                {displayTranscript && (
                  <span className="text-xs text-slate-400 truncate">
                    "{displayTranscript}"
                  </span>
                )}
              </div>
            </>
          )}
          {isProcessing && (
            <>
              <Loader2 className="h-5 w-5 text-yellow-400 animate-spin shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-sm text-white font-medium">Processing...</span>
                {displayTranscript && (
                  <span className="text-xs text-slate-400 truncate">
                    "{displayTranscript.slice(0, 40)}{displayTranscript.length > 40 ? '...' : ''}"
                  </span>
                )}
              </div>
            </>
          )}
          {isSpeaking && (
            <>
              <Volume2 className="h-5 w-5 text-green-400 animate-pulse shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-sm text-white font-medium">Speaking...</span>
                {lastResponse && (
                  <span className="text-xs text-slate-400 truncate">
                    {lastResponse.slice(0, 40)}{lastResponse.length > 40 ? '...' : ''}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Stop Button */}
        {(isListening || isSpeaking) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleStop}
            className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}