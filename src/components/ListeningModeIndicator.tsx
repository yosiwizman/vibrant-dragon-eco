"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/state/preferences";
import { getSessionStatus, endListeningSession } from "@/services/quiet-mode";
import { EarOff, Mic, Clock, FileText, X } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

interface ListeningModeIndicatorProps {
  onSummaryReady?: (summary: string, bulletPoints: string[], actionItems: string[]) => void;
}

export default function ListeningModeIndicator({ onSummaryReady }: ListeningModeIndicatorProps) {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcriptCount, setTranscriptCount] = useState(0);
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkStatus = () => {
      const status = getSessionStatus(user.id);
      setIsActive(status.isActive);
      setDuration(status.duration || 0);
      setTranscriptCount(status.transcriptCount || 0);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [user]);

  const handleEndSession = async () => {
    if (!user || !preferences.openaiApiKey) {
      showError("API key required to generate summary");
      return;
    }

    setIsEnding(true);
    try {
      const result = await endListeningSession(user.id, preferences.openaiApiKey);
      
      if (result.success) {
        showSuccess("Listening session ended");
        setIsActive(false);
        
        if (onSummaryReady && result.summary) {
          onSummaryReady(
            result.summary,
            result.bulletPoints || [],
            result.actionItems || []
          );
        }
      } else {
        showError(result.error || "Failed to end session");
      }
    } catch (error) {
      showError("Failed to end listening session");
    }
    setIsEnding(false);
  };

  if (!isActive) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-bottom-4">
      <Card className="border-purple-500/50 bg-purple-950/90 backdrop-blur-lg shadow-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <EarOff className="h-5 w-5 text-purple-400" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
              </div>
              <span className="font-semibold text-white">Listening Mode</span>
            </div>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50">
              Active
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="flex items-center gap-2 text-sm text-purple-200">
              <Clock className="h-4 w-4 text-purple-400" />
              <span>{duration} min</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-purple-200">
              <FileText className="h-4 w-4 text-purple-400" />
              <span>{transcriptCount} segments</span>
            </div>
          </div>

          <p className="text-xs text-purple-300 mb-3">
            I'm quietly listening. Say "{preferences.quietModeExitPhrase || "Echo summarize"}" or tap below when done.
          </p>

          <Button
            onClick={handleEndSession}
            disabled={isEnding}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white"
          >
            {isEnding ? (
              <>Processing...</>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                End & Summarize
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}