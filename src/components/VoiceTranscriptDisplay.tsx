"use client";

import { useVoice } from "@/contexts/VoiceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Loader2, Volume2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceTranscriptDisplayProps {
  className?: string;
  showResponse?: boolean;
  compact?: boolean;
}

export default function VoiceTranscriptDisplay({ 
  className, 
  showResponse = true,
  compact = false 
}: VoiceTranscriptDisplayProps) {
  const { 
    isListening, 
    isProcessing, 
    isSpeaking, 
    currentTranscript, 
    lastTranscript, 
    lastResponse 
  } = useVoice();

  // Don't show anything if nothing is happening
  if (!isListening && !isProcessing && !isSpeaking && !lastTranscript && !lastResponse) {
    return null;
  }

  const getStatusBadge = () => {
    if (isListening) {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/50 animate-pulse">
          <Mic className="h-3 w-3 mr-1" />
          Listening...
        </Badge>
      );
    }
    if (isProcessing) {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Processing...
        </Badge>
      );
    }
    if (isSpeaking) {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/50 animate-pulse">
          <Volume2 className="h-3 w-3 mr-1" />
          Speaking...
        </Badge>
      );
    }
    return null;
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {getStatusBadge()}
        {(isListening || isProcessing) && currentTranscript && (
          <span className="text-sm text-slate-300 truncate max-w-[200px]">
            "{currentTranscript}"
          </span>
        )}
      </div>
    );
  }

  return (
    <Card className={cn(
      "border-fuchsia-500/30 bg-black/60 backdrop-blur-lg",
      className
    )}>
      <CardContent className="p-4 space-y-3">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          {getStatusBadge()}
          {(lastTranscript || currentTranscript) && (
            <span className="text-xs text-slate-500">
              {new Date().toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Current/Last Transcript (What you said) */}
        {(currentTranscript || lastTranscript) && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <MessageSquare className="h-3 w-3" />
              <span>You said:</span>
            </div>
            <p className="text-sm text-white bg-fuchsia-600/20 rounded-lg px-3 py-2 border border-fuchsia-500/30">
              "{currentTranscript || lastTranscript}"
            </p>
          </div>
        )}

        {/* Response (What Echo said) */}
        {showResponse && lastResponse && !isProcessing && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Volume2 className="h-3 w-3" />
              <span>Echo:</span>
            </div>
            <p className="text-sm text-slate-200 bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700">
              {lastResponse}
            </p>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && !currentTranscript && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Transcribing your voice...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}