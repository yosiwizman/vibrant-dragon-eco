import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Mic, Volume2, Clock, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

interface VoiceInteraction {
  id: string;
  userText: string;
  assistantText: string;
  timestamp: number;
  toolsUsed?: string[];
}

const STORAGE_KEY = "echo:voice-history";
const MAX_HISTORY = 20;

export function saveVoiceInteraction(interaction: Omit<VoiceInteraction, "id">) {
  try {
    const existing = getVoiceHistory();
    const newInteraction: VoiceInteraction = {
      ...interaction,
      id: crypto.randomUUID(),
    };
    const updated = [newInteraction, ...existing].slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save voice interaction:", error);
  }
}

export function getVoiceHistory(): VoiceInteraction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearVoiceHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

interface VoiceHistoryProps {
  className?: string;
  maxItems?: number;
  showClear?: boolean;
}

export default function VoiceHistory({ className = "", maxItems = 5, showClear = true }: VoiceHistoryProps) {
  const [history, setHistory] = useState<VoiceInteraction[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setHistory(getVoiceHistory());
    
    // Listen for storage changes
    const handleStorage = () => setHistory(getVoiceHistory());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleClear = () => {
    clearVoiceHistory();
    setHistory([]);
  };

  const displayedHistory = expanded ? history : history.slice(0, maxItems);

  if (history.length === 0) {
    return null;
  }

  return (
    <Card className={`border-fuchsia-500/20 bg-black/30 backdrop-blur ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-fuchsia-400" />
            Recent Voice Commands
          </CardTitle>
          {showClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-slate-400 hover:text-red-400 h-7 px-2"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className={expanded ? "h-[300px]" : ""}>
          <div className="space-y-2">
            {displayedHistory.map((interaction) => (
              <div
                key={interaction.id}
                className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50"
              >
                <div className="flex items-start gap-2">
                  <Mic className="h-3 w-3 text-fuchsia-400 mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">"{interaction.userText}"</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {interaction.assistantText.slice(0, 60)}...
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-500">
                        {format(interaction.timestamp, "h:mm a")}
                      </span>
                      {interaction.toolsUsed && interaction.toolsUsed.length > 0 && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1 border-slate-600 text-slate-400">
                          {interaction.toolsUsed[0]}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {history.length > maxItems && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-2 text-slate-400 hover:text-white h-7"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Show {history.length - maxItems} more
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}