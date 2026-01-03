"use client";

import { useVoice } from "@/contexts/VoiceContext";
import { Badge } from "@/components/ui/badge";
import { Mic, Loader2, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveVoiceIndicatorProps {
  className?: string;
  onClick?: () => void;
}

export default function LiveVoiceIndicator({ className, onClick }: LiveVoiceIndicatorProps) {
  const { isListening, isProcessing, isSpeaking, currentTranscript, lastTranscript, lastResponse } = useVoice();

  // Don't show if nothing is happening
  if (!isListening && !isProcessing && !isSpeaking) {
    return null;
  }

  // Get the best transcript to display
  const displayTranscript = currentTranscript || lastTranscript;

  const getIcon = () => {
    if (isListening) return <Mic className="h-3 w-3" />;
    if (isProcessing) return <Loader2 className="h-3 w-3 animate-spin" />;
    if (isSpeaking) return <Volume2 className="h-3 w-3" />;
    return null;
  };

  const getText = () => {
    if (isListening) return "Listening...";
    if (isProcessing) return "Processing...";
    if (isSpeaking) return "Speaking...";
    return "";
  };

  const getColor = () => {
    if (isListening) return "bg-red-500/20 text-red-400 border-red-500/50";
    if (isProcessing) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    if (isSpeaking) return "bg-green-500/20 text-green-400 border-green-500/50";
    return "";
  };

  const getDisplayText = () => {
    if (isListening && displayTranscript) {
      return `"${displayTranscript.slice(0, 30)}${displayTranscript.length > 30 ? '...' : ''}"`;
    }
    if (isProcessing && displayTranscript) {
      return `"${displayTranscript.slice(0, 30)}${displayTranscript.length > 30 ? '...' : ''}"`;
    }
    if (isSpeaking && lastResponse) {
      return `"${lastResponse.slice(0, 30)}${lastResponse.length > 30 ? '...' : ''}"`;
    }
    return null;
  };

  const extraText = getDisplayText();

  return (
    <Badge 
      className={cn(
        "cursor-pointer animate-pulse flex items-center gap-1.5 max-w-xs",
        getColor(),
        className
      )}
      onClick={onClick}
    >
      {getIcon()}
      <span className="hidden sm:inline">{getText()}</span>
      {extraText && (
        <span className="hidden md:inline text-xs opacity-75 truncate max-w-[150px]">
          {extraText}
        </span>
      )}
    </Badge>
  );
}