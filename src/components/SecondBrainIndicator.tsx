"use client";

import { useState, useEffect } from "react";
import { 
  Brain, 
  Mic, 
  MicOff, 
  Languages, 
  ShieldCheck,
  X,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSecondBrain } from "@/hooks/useSecondBrain";
import { speakerIdentification } from "@/services/second-brain/speaker-identification";

interface SecondBrainIndicatorProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export default function SecondBrainIndicator({ 
  position = 'top-right' 
}: SecondBrainIndicatorProps) {
  const [state, actions] = useSecondBrain();
  const [isExpanded, setIsExpanded] = useState(false);
  const [recentTranslation, setRecentTranslation] = useState<string | null>(null);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);

  // Update current speaker
  useEffect(() => {
    if (!state.isActive) return;

    const interval = setInterval(() => {
      const speaker = speakerIdentification.getCurrentSpeaker();
      setCurrentSpeaker(speaker?.name || speaker?.id || null);
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isActive]);

  // Don't render if not active
  if (!state.isActive) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-50 transition-all duration-300`}
    >
      {/* Collapsed View */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-full shadow-lg
            ${state.isPrivacyMode 
              ? 'bg-yellow-500/90 text-yellow-900' 
              : 'bg-purple-600/90 text-white'
            }
            hover:scale-105 transition-transform
          `}
        >
          {state.isPrivacyMode ? (
            <ShieldCheck className="h-4 w-4" />
          ) : (
            <Brain className="h-4 w-4 animate-pulse" />
          )}
          <span className="text-xs font-medium">
            {state.isPrivacyMode ? 'Privacy Mode' : 'Second Brain Active'}
          </span>
          <ChevronDown className="h-3 w-3" />
        </button>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="bg-slate-900/95 backdrop-blur-sm border border-purple-500/30 rounded-xl shadow-xl p-4 min-w-[280px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-400" />
              <span className="font-semibold text-white text-sm">Second Brain</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsExpanded(false)}
              >
                <ChevronUp className="h-4 w-4 text-slate-400" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={actions.stop}
              >
                <X className="h-4 w-4 text-slate-400" />
              </Button>
            </div>
          </div>

          {/* Status Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <StatusBadge
              icon={state.isPrivacyMode ? MicOff : Mic}
              label={state.isPrivacyMode ? 'Muted' : 'Listening'}
              active={!state.isPrivacyMode}
              color={state.isPrivacyMode ? 'yellow' : 'green'}
            />
            <StatusBadge
              icon={Languages}
              label="Translation"
              active={true}
              color="blue"
            />
          </div>

          {/* Current Speaker */}
          {currentSpeaker && !state.isPrivacyMode && (
            <div className="mb-3 p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-slate-300">
                  Speaking: <span className="text-white font-medium">{currentSpeaker}</span>
                </span>
              </div>
            </div>
          )}

          {/* Recent Translation */}
          {recentTranslation && (
            <div className="mb-3 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Languages className="h-3 w-3 text-blue-400" />
                <span className="text-xs text-blue-400">Translation</span>
              </div>
              <p className="text-xs text-white">{recentTranslation}</p>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span>{state.speakerCount} speakers</span>
            <span>{state.segmentCount} segments</span>
          </div>

          {/* Privacy Toggle */}
          {!state.isPrivacyMode ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={actions.enterPrivacyMode}
            >
              <ShieldCheck className="h-3 w-3 mr-1" />
              Enter Privacy Mode
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
              onClick={actions.exitPrivacyMode}
            >
              <Mic className="h-3 w-3 mr-1" />
              Resume Listening
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({
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
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border ${colorClasses[color]}`}>
      <Icon className="h-3 w-3" />
      <span className="text-xs">{label}</span>
    </div>
  );
}