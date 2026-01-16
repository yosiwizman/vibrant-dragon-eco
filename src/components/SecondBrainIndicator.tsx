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

interface SecondBrainIndicatorProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

// State interface
interface SecondBrainState {
  isActive: boolean;
  isPrivacyMode: boolean;
  speakerCount: number;
  segmentCount: number;
}

export default function SecondBrainIndicator({ 
  position = 'top-right' 
}: SecondBrainIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [state, setState] = useState<SecondBrainState>({
    isActive: false,
    isPrivacyMode: false,
    speakerCount: 0,
    segmentCount: 0,
  });
  const [loaded, setLoaded] = useState(false);

  // Load services and poll for status
  useEffect(() => {
    let mounted = true;
    let interval: ReturnType<typeof setInterval> | null = null;

    async function init() {
      try {
        // Import the always-on assistant module
        const assistantModule = await import('@/services/always-on-assistant');
        
        if (!mounted) return;

        // Poll for status
        const checkStatus = () => {
          try {
            const status = assistantModule.alwaysOnAssistant.getStatus();
            setState({
              isActive: status.isActive,
              isPrivacyMode: status.privacyMode,
              speakerCount: status.speakerCount,
              segmentCount: status.segmentCount,
            });
          } catch (e) {
            // Ignore errors
          }
        };

        checkStatus();
        interval = setInterval(checkStatus, 2000);
        setLoaded(true);
      } catch (error) {
        console.warn('[SecondBrainIndicator] Failed to initialize:', error);
      }
    }

    init();

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
    };
  }, []);

  // Load speaker identification lazily
  useEffect(() => {
    if (!state.isActive) return;

    let mounted = true;
    let interval: ReturnType<typeof setInterval> | null = null;

    async function loadSpeakerID() {
      try {
        const module = await import('@/services/second-brain/speaker-identification');
        
        if (!mounted) return;

        const checkSpeaker = () => {
          try {
            const speaker = module.speakerIdentification.getCurrentSpeaker();
            setCurrentSpeaker(speaker?.name || speaker?.id || null);
          } catch (e) {
            // Ignore errors
          }
        };

        checkSpeaker();
        interval = setInterval(checkSpeaker, 1000);
      } catch (error) {
        console.warn('[SecondBrainIndicator] Failed to load speaker identification:', error);
      }
    }

    loadSpeakerID();

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
    };
  }, [state.isActive]);

  // Handle stop
  const handleStop = async () => {
    try {
      const assistantModule = await import('@/services/always-on-assistant');
      assistantModule.alwaysOnAssistant.stop();
      setState(prev => ({ ...prev, isActive: false }));
    } catch (e) {
      console.error('[SecondBrainIndicator] Failed to stop:', e);
    }
  };

  // Handle privacy toggle
  const handleTogglePrivacy = async () => {
    try {
      const assistantModule = await import('@/services/always-on-assistant');
      assistantModule.alwaysOnAssistant.exitPrivacyMode();
      setState(prev => ({ ...prev, isPrivacyMode: !prev.isPrivacyMode }));
    } catch (e) {
      console.error('[SecondBrainIndicator] Failed to toggle privacy:', e);
    }
  };

  // Don't render if not loaded or not active
  if (!loaded || !state.isActive) return null;

  const positionClasses = {
    'top-right': 'top-20 right-4',
    'top-left': 'top-20 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-40 transition-all duration-300`}
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
                onClick={handleStop}
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
              onClick={handleTogglePrivacy}
            >
              <ShieldCheck className="h-3 w-3 mr-1" />
              Enter Privacy Mode
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
              onClick={handleTogglePrivacy}
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