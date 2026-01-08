"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Circle,
  Download,
  Mic,
  LayoutGrid,
  Zap,
  Trophy,
  ArrowRight
} from "lucide-react";
import { showSuccess } from "@/utils/toast";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action?: () => void;
  completed: boolean;
}

const ONBOARDING_STEPS: Omit<OnboardingStep, 'completed'>[] = [
  {
    id: 'download-ai',
    title: 'Download Offline AI',
    description: 'Get the AI model for offline use (1.5GB)',
    icon: Download,
  },
  {
    id: 'first-voice',
    title: 'Try Voice Command',
    description: 'Say "Hey Echo" and ask something',
    icon: Mic,
  },
  {
    id: 'add-widget',
    title: 'Add Your First Widget',
    description: 'Customize your dashboard',
    icon: LayoutGrid,
  },
  {
    id: 'setup-wake-word',
    title: 'Enable Wake Word',
    description: 'Activate Echo hands-free',
    icon: Zap,
  },
];

export default function ProgressiveOnboarding() {
  const { user } = useAuth();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Load completion status
    const loadSteps = () => {
      // Check if welcome tour is complete first
      const welcomeComplete = localStorage.getItem('echo:onboarding-completed');
      if (!welcomeComplete) {
        setIsVisible(false);
        return;
      }

      const saved = localStorage.getItem(`echo:onboarding:${user.id}`);
      const completed = saved ? JSON.parse(saved) : {};

      const stepsWithStatus = ONBOARDING_STEPS.map(step => ({
        ...step,
        completed: completed[step.id] || false,
      }));

      setSteps(stepsWithStatus);

      // Show if not all complete
      const allComplete = stepsWithStatus.every(s => s.completed);
      setIsVisible(!allComplete);
    };

    loadSteps();

    // Re-check when welcome tour completes
    const interval = setInterval(loadSteps, 1000);
    return () => clearInterval(interval);
  }, [user]);

  const markStepComplete = (stepId: string) => {
    if (!user) return;

    const updated = steps.map(s => 
      s.id === stepId ? { ...s, completed: true } : s
    );
    setSteps(updated);

    // Save to storage
    const completed = updated.reduce((acc, s) => ({
      ...acc,
      [s.id]: s.completed,
    }), {});
    localStorage.setItem(`echo:onboarding:${user.id}`, JSON.stringify(completed));

    // Check if all complete
    const allComplete = updated.every(s => s.completed);
    if (allComplete) {
      showSuccess("🎉 Onboarding complete! You've unlocked all features!");
      setTimeout(() => setIsVisible(false), 3000);
    }
  };

  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  if (!isVisible || steps.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-4 w-80 z-40 animate-in slide-in-from-bottom-4">
      <Card className="border-fuchsia-500/30 bg-slate-900/95 backdrop-blur-lg shadow-2xl max-h-[500px] flex flex-col">
        <CardContent className="p-4 space-y-4 overflow-y-auto scrollbar-hide flex-1">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">Getting Started</h3>
              <p className="text-xs text-slate-400">
                {completedCount}/{steps.length} steps complete
              </p>
            </div>
            <Trophy className={`h-6 w-6 ${completedCount === steps.length ? 'text-yellow-400' : 'text-slate-600'}`} />
          </div>

          {/* Progress Bar */}
          <Progress value={progress} className="h-2" />

          {/* Steps */}
          <div className="space-y-2">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <button
                  key={step.id}
                  onClick={() => !step.completed && markStepComplete(step.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all ${
                    step.completed 
                      ? 'bg-green-900/20 border border-green-500/30' 
                      : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {step.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${step.completed ? 'text-green-400' : 'text-fuchsia-400'}`} />
                      <p className={`text-sm font-medium ${step.completed ? 'text-green-300' : 'text-white'}`}>
                        {step.title}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {step.description}
                    </p>
                  </div>
                  {!step.completed && (
                    <ArrowRight className="h-4 w-4 text-slate-500 shrink-0 mt-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Reward */}
          {completedCount === steps.length && (
            <div className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                <p className="text-sm text-yellow-300 font-medium">
                  All features unlocked!
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}