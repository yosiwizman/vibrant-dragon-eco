"use client";

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useVoice } from "@/contexts/VoiceContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/state/preferences";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Mic,
  X,
  ChevronUp,
  ChevronDown,
  CheckSquare,
  Bell,
  FileText,
  Calendar,
  Search,
  CloudSun,
  MapPin,
  Undo,
  Volume2,
  Sparkles,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickCommand {
  icon: React.ReactNode;
  label: string;
  command: string;
  color: string;
}

const QUICK_COMMANDS: QuickCommand[] = [
  { icon: <CheckSquare className="h-4 w-4" />, label: "Tasks", command: "Read my tasks", color: "text-green-400" },
  { icon: <Bell className="h-4 w-4" />, label: "Reminders", command: "Read my reminders", color: "text-yellow-400" },
  { icon: <Calendar className="h-4 w-4" />, label: "Calendar", command: "What's on my calendar today", color: "text-blue-400" },
  { icon: <FileText className="h-4 w-4" />, label: "Summary", command: "Give me a summary of my day", color: "text-orange-400" },
  { icon: <CloudSun className="h-4 w-4" />, label: "Weather", command: "What's the weather", color: "text-cyan-400" },
  { icon: <MapPin className="h-4 w-4" />, label: "Nearby", command: "Find nearby coffee shops", color: "text-pink-400" },
  { icon: <Search className="h-4 w-4" />, label: "Search", command: "Search the web for latest news", color: "text-purple-400" },
  { icon: <Undo className="h-4 w-4" />, label: "Undo", command: "Undo the last action", color: "text-red-400" },
];

const STORAGE_KEY = "echo:voice-widget-visible";

export default function FloatingVoiceWidget() {
  const location = useLocation();
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const { isListening, isProcessing, isSpeaking, lastTranscript, processVoiceCommand, speak, stopSpeaking, startListening, stopListening } = useVoice();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === "true";
    }
    return false;
  });
  const [lastResponse, setLastResponse] = useState<string | null>(null);

  // Persist visibility preference
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isVisible));
  }, [isVisible]);

  // Don't show on login page, voice page, or when not authenticated
  if (location.pathname === "/login" || location.pathname === "/voice" || !user) {
    return null;
  }

  // Show toggle button when widget is hidden
  if (!isVisible) {
    return (
      <div className="fixed bottom-24 left-4 z-40">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              onClick={() => setIsVisible(true)}
              className="h-10 w-10 rounded-full bg-fuchsia-600 hover:bg-fuchsia-500 shadow-lg shadow-fuchsia-500/25"
            >
              <Sparkles className="h-5 w-5 text-white" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-slate-900 border-slate-700">
            <p className="text-white">Show Quick Commands</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  const handleQuickCommand = async (command: string) => {
    try {
      setLastResponse(null);
      const response = await processVoiceCommand(command);
      setLastResponse(response);
      await speak(response);
    } catch (error) {
      console.error("Quick command failed:", error);
      setLastResponse("Sorry, something went wrong.");
    }
  };

  const handleMicClick = async () => {
    if (isListening) {
      stopListening();
    } else if (!isProcessing && !isSpeaking) {
      await startListening();
    }
  };

  const getStatusText = () => {
    if (isListening) return "Listening...";
    if (isProcessing) return "Thinking...";
    if (isSpeaking) return "Speaking...";
    return preferences.assistantName || "Echo";
  };

  const getStatusColor = () => {
    if (isListening) return "bg-red-500";
    if (isProcessing) return "bg-yellow-500";
    if (isSpeaking) return "bg-green-500";
    return "bg-fuchsia-500/20";
  };

  return (
    <div className="fixed bottom-24 left-4 z-40">
      <Card className={cn(
        "border-fuchsia-500/30 bg-black/90 backdrop-blur-lg shadow-xl transition-all duration-300",
        isExpanded ? "w-80" : "w-auto"
      )}>
        <CardContent className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleMicClick}
                disabled={isProcessing}
                className={cn(
                  "p-2 rounded-full transition-all",
                  getStatusColor(),
                  (isListening || isProcessing || isSpeaking) && "animate-pulse",
                  !isProcessing && "hover:scale-110 cursor-pointer"
                )}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <Mic className={cn(
                    "h-4 w-4",
                    isListening || isProcessing || isSpeaking ? "text-white" : "text-fuchsia-400"
                  )} />
                )}
              </button>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-white">
                  {getStatusText()}
                </span>
                {isListening && lastTranscript && (
                  <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                    "{lastTranscript}"
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                onClick={() => setIsVisible(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Last Response Preview */}
          {lastResponse && !isExpanded && (
            <div className="mt-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-xs text-slate-300 line-clamp-2">{lastResponse}</p>
            </div>
          )}

          {/* Quick Commands Grid */}
          {isExpanded && (
            <>
              <div className="grid grid-cols-4 gap-1.5 pt-3 mt-3 border-t border-slate-700">
                {QUICK_COMMANDS.map((cmd) => (
                  <Tooltip key={cmd.label}>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex flex-col items-center gap-1 h-auto py-2 px-1 hover:bg-slate-800"
                        onClick={() => handleQuickCommand(cmd.command)}
                        disabled={isListening || isProcessing}
                      >
                        <span className={cmd.color}>{cmd.icon}</span>
                        <span className="text-[10px] text-slate-400">{cmd.label}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-slate-900 border-slate-700">
                      <p className="text-xs text-white">"{cmd.command}"</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>

              {/* Last Response */}
              {lastResponse && (
                <div className="mt-3 p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Last response:</p>
                  <p className="text-xs text-slate-200 line-clamp-3">{lastResponse}</p>
                </div>
              )}

              {/* Tip */}
              <p className="text-[10px] text-slate-500 text-center mt-2">
                Click mic to speak • Press ⌘K for more commands
              </p>
            </>
          )}

          {/* Stop Speaking Button */}
          {isSpeaking && (
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-2 border-red-500/50 text-red-400 hover:bg-red-500/20"
              onClick={stopSpeaking}
            >
              <X className="h-4 w-4 mr-2" />
              Stop Speaking
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}