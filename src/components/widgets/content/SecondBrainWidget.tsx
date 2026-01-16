"use client";

import { useState, useEffect } from "react";
import { 
  Brain, 
  Mic, 
  MicOff, 
  Languages, 
  Users2, 
  ShieldCheck,
  Volume2,
  VolumeX,
  Settings,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useSecondBrain } from "@/hooks/useSecondBrain";
import { speakerIdentification } from "@/services/second-brain/speaker-identification";
import { whisperMode } from "@/services/second-brain/whisper-mode";

export default function SecondBrainWidget() {
  const [state, actions] = useSecondBrain();
  const [showSettings, setShowSettings] = useState(false);
  const [whisperEnabled, setWhisperEnabled] = useState(true);
  const [speakerStats, setSpeakerStats] = useState({
    totalSpeakers: 0,
    namedSpeakers: 0,
    recentSpeakers: 0,
    totalConversations: 0,
  });

  useEffect(() => {
    // Update speaker stats periodically
    const interval = setInterval(() => {
      setSpeakerStats(speakerIdentification.getStatistics());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleToggle = async () => {
    if (state.isActive) {
      actions.stop();
    } else {
      await actions.start();
    }
  };

  const handleWhisperToggle = (enabled: boolean) => {
    setWhisperEnabled(enabled);
    if (enabled) {
      whisperMode.enable();
    } else {
      whisperMode.disable();
    }
  };

  return (
    <div className="h-full flex flex-col p-4 bg-gradient-to-br from-purple-900/20 to-fuchsia-900/10 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${state.isActive ? 'bg-purple-500/20' : 'bg-slate-700/50'}`}>
            <Brain className={`h-5 w-5 ${state.isActive ? 'text-purple-400' : 'text-slate-400'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Second Brain</h3>
            <p className="text-xs text-slate-400">
              {state.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="h-4 w-4 text-slate-400" />
        </Button>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <StatusIndicator
          icon={state.isActive ? Mic : MicOff}
          label="Listening"
          active={state.isActive && !state.isPrivacyMode}
          color="green"
        />
        <StatusIndicator
          icon={ShieldCheck}
          label="Privacy"
          active={state.isPrivacyMode}
          color="yellow"
        />
        <StatusIndicator
          icon={Languages}
          label="Translation"
          active={state.isActive}
          color="blue"
        />
        <StatusIndicator
          icon={Activity}
          label="Fact Check"
          active={state.isFactCheckingEnabled}
          color="purple"
        />
      </div>

      {/* Speaker Stats */}
      {state.isActive && (
        <div className="mb-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Users2 className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-medium text-white">Speakers Detected</span>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs">
              {speakerStats.recentSpeakers} active
            </Badge>
            <Badge variant="outline" className="text-xs">
              {speakerStats.namedSpeakers} named
            </Badge>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {whisperEnabled ? (
                <Volume2 className="h-4 w-4 text-slate-400" />
              ) : (
                <VolumeX className="h-4 w-4 text-slate-400" />
              )}
              <span className="text-xs text-slate-300">Whisper Mode</span>
            </div>
            <Switch
              checked={whisperEnabled}
              onCheckedChange={handleWhisperToggle}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-300">Fact Checking</span>
            </div>
            <Switch
              checked={state.isFactCheckingEnabled}
              onCheckedChange={(checked) => 
                checked ? actions.enableFactChecking() : actions.disableFactChecking()
              }
            />
          </div>
        </div>
      )}

      {/* Main Toggle Button */}
      <div className="mt-auto">
        <Button
          onClick={handleToggle}
          className={`w-full ${
            state.isActive
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-slate-700 hover:bg-slate-600'
          }`}
        >
          {state.isActive ? (
            <>
              <MicOff className="h-4 w-4 mr-2" />
              Stop Second Brain
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Start Second Brain
            </>
          )}
        </Button>
      </div>

      {/* Privacy Mode Button */}
      {state.isActive && !state.isPrivacyMode && (
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full text-xs"
          onClick={actions.enterPrivacyMode}
        >
          <ShieldCheck className="h-3 w-3 mr-1" />
          Enter Privacy Mode
        </Button>
      )}
      {state.isPrivacyMode && (
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full text-xs border-yellow-500/50 text-yellow-400"
          onClick={actions.exitPrivacyMode}
        >
          <ShieldCheck className="h-3 w-3 mr-1" />
          Exit Privacy Mode
        </Button>
      )}
    </div>
  );
}

function StatusIndicator({
  icon: Icon,
  label,
  active,
  color,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  color: 'green' | 'yellow' | 'blue' | 'purple';
}) {
  const colorClasses = {
    green: active ? 'bg-green-500/20 text-green-400' : 'bg-slate-700/50 text-slate-500',
    yellow: active ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700/50 text-slate-500',
    blue: active ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-500',
    purple: active ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700/50 text-slate-500',
  };

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg ${colorClasses[color]}`}>
      <Icon className="h-3 w-3" />
      <span className="text-xs">{label}</span>
    </div>
  );
}