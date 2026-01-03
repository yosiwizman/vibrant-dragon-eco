"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  MessageSquare, 
  Keyboard, 
  Bell, 
  CheckSquare,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "echo:onboarding-completed";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  tips: string[];
  color: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to Echo!",
    description: "Your personal AI voice assistant. Let me show you around.",
    icon: <Sparkles className="h-12 w-12" />,
    tips: [
      "Echo is designed for voice-first interaction",
      "You can also use text chat if you prefer",
      "All your data stays private and secure",
    ],
    color: "text-fuchsia-400",
  },
  {
    title: "Voice Commands",
    description: "Speak naturally to Echo. Just tap the microphone and talk.",
    icon: <Mic className="h-12 w-12" />,
    tips: [
      '"Add a task to buy groceries"',
      '"Remind me to call mom at 5pm"',
      '"What\'s the weather like?"',
      '"Read my tasks"',
    ],
    color: "text-red-400",
  },
  {
    title: "Text Chat",
    description: "Prefer typing? Use the chat interface for the same features.",
    icon: <MessageSquare className="h-12 w-12" />,
    tips: [
      "Full conversation history",
      "Web search integration",
      "Same AI capabilities as voice",
    ],
    color: "text-blue-400",
  },
  {
    title: "Keyboard Shortcuts",
    description: "Power users can navigate quickly with keyboard shortcuts.",
    icon: <Keyboard className="h-12 w-12" />,
    tips: [
      "Press ⌘K to open command palette",
      "Press ? to see all shortcuts",
      "Navigate anywhere with ⌘+Shift+key",
    ],
    color: "text-green-400",
  },
  {
    title: "Stay Organized",
    description: "Echo helps you manage tasks, reminders, notes, and more.",
    icon: <CheckSquare className="h-12 w-12" />,
    tips: [
      "Create recurring reminders",
      "Set task priorities",
      "Get daily summaries",
      "Undo recent actions",
    ],
    color: "text-yellow-400",
  },
  {
    title: "You're All Set!",
    description: "Start by setting up your OpenAI API key in Settings.",
    icon: <Bell className="h-12 w-12" />,
    tips: [
      "Go to Settings → Enter your OpenAI API key",
      "Choose your preferred voice",
      "Start talking to Echo!",
    ],
    color: "text-purple-400",
  },
];

export default function OnboardingTour() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (user) {
      const completed = localStorage.getItem(STORAGE_KEY);
      if (!completed) {
        // Small delay to let the app load first
        const timer = setTimeout(() => setIsOpen(true), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = TOUR_STEPS[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {TOUR_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    index === currentStep
                      ? "w-6 bg-fuchsia-500"
                      : index < currentStep
                      ? "w-1.5 bg-fuchsia-500/50"
                      : "w-1.5 bg-slate-700"
                  )}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="py-6 text-center">
          <div className={cn("mx-auto mb-4", step.color)}>
            {step.icon}
          </div>
          <DialogTitle className="text-xl text-white mb-2">
            {step.title}
          </DialogTitle>
          <p className="text-slate-400 mb-6">{step.description}</p>

          <div className="space-y-2 text-left">
            {step.tips.map((tip, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/50"
              >
                <Badge
                  variant="outline"
                  className="border-slate-600 text-slate-400 text-xs shrink-0"
                >
                  {index + 1}
                </Badge>
                <span className="text-sm text-slate-300">{tip}</span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white"
          >
            {currentStep === TOUR_STEPS.length - 1 ? (
              "Get Started"
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}