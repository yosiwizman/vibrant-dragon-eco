"use client";

import { useState } from "react";
import { useVoice } from "@/contexts/VoiceContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Volume2
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
  { icon: <Search className="h-4 w-4" />, label: "Search", command: "Search the web for", color: "text-purple-400" },
  { icon: <Undo className="h-4 w-4" />, label: "Undo", command: "Undo the last action", color: "text-red-400" },
];

export default function FloatingVoiceWidget() {
  const { isListening, isProcessing, isSpeaking, processVoiceCommand, speak, stopSpeaking } = useVoice();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const handleQuickCommand = async (command: string) => {
    try {
      const response = await processVoiceCommand(command);
      await speak(response);
    } catch (error) {
      console.error("Quick command failed:", error);
    }
  };

  if (!isVisible) {
    return (
      <Button
        size="sm"
        className="fixed bottom-24 left-4 z-40 bg-fuchsia-600 hover:bg-fuchsia-500 rounded-full shadow-lg"
        onClick={() => setIsVisible(true)}
      >
        <Volume2 className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-24 left-4 z-40">
      <Card className={cn(
        "border-fuchsia-500/30 bg-black/80 backdrop-blur-lg shadow-xl transition-all duration-300",
        isExpanded ? "w-72" : "w-auto"
      )}>
        <CardContent className="p-2">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-1.5 rounded-full",
                isListening ? "bg-red-500 animate-pulse" :
                isProcessing ? "bg-yellow-500 animate-pulse" :
                isSpeaking ? "bg-green-500 animate-pulse" :
                "bg-fuchsia-500/20"
              )}>
                <Mic className={cn(
                  "h-4 w-4",
                  isListening || isProcessing || isSpeaking ? "text-white" : "text-fuchsia-400"
                )} />
              </div>
              <span className="text-xs font-medium text-white">
                {isListening ? "Listening..." :
                 isProcessing ? "Thinking..." :
                 isSpeaking ? "Speaking..." :
                 "Quick Commands"}
              </span>
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

          {/* Quick Commands Grid */}
          {isExpanded && (
            <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-700">
              {QUICK_COMMANDS.map((cmd) => (
                <Button
                  key={cmd.label}
                  size="sm"
                  variant="ghost"
                  className="flex flex-col items-center gap-1 h-auto py-2 px-1 hover:bg-slate-800"
                  onClick={() => handleQuickCommand(cmd.command)}
                  disabled={isListening || isProcessing}
                >
                  <span className={cmd.color}>{cmd.icon}</span>
                  <span className="text-[10px] text-slate-400">{cmd.label}</span>
                </Button>
              ))}
            </div>
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