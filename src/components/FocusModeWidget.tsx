"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Focus, Play, Pause, RotateCcw, Coffee, Brain, Zap } from "lucide-react";
import { usePreferences } from "@/state/preferences";

interface FocusSession {
  type: "focus" | "break";
  duration: number;
  startTime: Date;
}

const FOCUS_PRESETS = [
  { label: "Pomodoro", focusMinutes: 25, breakMinutes: 5, icon: Brain },
  { label: "Deep Work", focusMinutes: 50, breakMinutes: 10, icon: Focus },
  { label: "Quick Sprint", focusMinutes: 15, breakMinutes: 3, icon: Zap },
];

export default function FocusModeWidget() {
  const { preferences, setPreferences } = usePreferences();
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionType, setSessionType] = useState<"focus" | "break">("focus");
  const [timeRemaining, setTimeRemaining] = useState(25 * 60); // seconds
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const currentPreset = FOCUS_PRESETS[selectedPreset];
  const totalTime = sessionType === "focus" 
    ? currentPreset.focusMinutes * 60 
    : currentPreset.breakMinutes * 60;
  const progress = ((totalTime - timeRemaining) / totalTime) * 100;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      handleSessionComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, isPaused, timeRemaining]);

  const handleSessionComplete = useCallback(() => {
    if (sessionType === "focus") {
      setSessionsCompleted((prev) => prev + 1);
      // Play notification sound
      if (preferences.voiceFeedbackEnabled) {
        const audio = new Audio("/notification.mp3");
        audio.play().catch(() => {});
      }
      // Switch to break
      setSessionType("break");
      setTimeRemaining(currentPreset.breakMinutes * 60);
    } else {
      // Switch back to focus
      setSessionType("focus");
      setTimeRemaining(currentPreset.focusMinutes * 60);
    }
  }, [sessionType, currentPreset, preferences.voiceFeedbackEnabled]);

  const startSession = () => {
    setIsActive(true);
    setIsPaused(false);
    setTimeRemaining(currentPreset.focusMinutes * 60);
    setSessionType("focus");
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const resetSession = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeRemaining(currentPreset.focusMinutes * 60);
    setSessionType("focus");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const PresetIcon = currentPreset.icon;

  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Focus className="h-4 w-4 text-fuchsia-400" />
            Focus Mode
          </h3>
          {sessionsCompleted > 0 && (
            <Badge className="bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/50">
              {sessionsCompleted} sessions
            </Badge>
          )}
        </div>

        {!isActive ? (
          <div className="space-y-3">
            <Select
              value={selectedPreset.toString()}
              onValueChange={(v) => {
                setSelectedPreset(parseInt(v));
                setTimeRemaining(FOCUS_PRESETS[parseInt(v)].focusMinutes * 60);
              }}
            >
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {FOCUS_PRESETS.map((preset, idx) => (
                  <SelectItem
                    key={idx}
                    value={idx.toString()}
                    className="text-white hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <preset.icon className="h-4 w-4" />
                      <span>{preset.label}</span>
                      <span className="text-slate-400 text-xs">
                        ({preset.focusMinutes}m / {preset.breakMinutes}m)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={startSession}
              className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Focus Session
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              {sessionType === "focus" ? (
                <PresetIcon className="h-5 w-5 text-fuchsia-400" />
              ) : (
                <Coffee className="h-5 w-5 text-green-400" />
              )}
              <span className="text-sm text-slate-400">
                {sessionType === "focus" ? "Focus Time" : "Break Time"}
              </span>
            </div>

            <div className="text-center">
              <span className="text-4xl font-mono font-bold text-white">
                {formatTime(timeRemaining)}
              </span>
            </div>

            <Progress
              value={progress}
              className="h-2 bg-slate-700"
            />

            <div className="flex gap-2">
              <Button
                onClick={togglePause}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>
              <Button
                onClick={resetSession}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}