import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, Volume2, Navigation, CheckSquare, Bell, FileText, 
  Calendar, Search, CloudSun, ChevronRight, ChevronLeft, X 
} from "lucide-react";

interface VoiceTutorialProps {
  open: boolean;
  onClose: () => void;
}

const tutorialSteps = [
  {
    title: "Welcome to Voice Mode",
    icon: Mic,
    color: "text-fuchsia-400",
    content: (
      <div className="space-y-4">
        <p className="text-slate-300">
          Echo is your voice-first AI assistant. You can control almost everything using just your voice!
        </p>
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h4 className="font-medium text-white mb-2">How to activate:</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>• Tap the floating mic button (bottom right)</li>
            <li>• Double-tap for full voice conversation mode</li>
            <li>• Go to Voice Chat page for hands-free operation</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: "Navigation Commands",
    icon: Navigation,
    color: "text-green-400",
    content: (
      <div className="space-y-4">
        <p className="text-slate-300">
          Navigate anywhere in the app using your voice. Just say where you want to go!
        </p>
        <div className="grid gap-2">
          {[
            "Open my tasks",
            "Go to reminders",
            "Show me the calendar",
            "Take me to notes",
            "Open settings",
          ].map((cmd) => (
            <Badge key={cmd} variant="outline" className="border-green-500/50 text-green-300 justify-start">
              "{cmd}"
            </Badge>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Create Things",
    icon: CheckSquare,
    color: "text-blue-400",
    content: (
      <div className="space-y-4">
        <p className="text-slate-300">
          Create tasks, reminders, notes, and calendar events just by speaking naturally.
        </p>
        <div className="grid gap-2">
          {[
            "Add task buy groceries",
            "Remind me to call mom at 5pm",
            "Take a note about the meeting",
            "Schedule a meeting tomorrow at 2pm",
          ].map((cmd) => (
            <Badge key={cmd} variant="outline" className="border-blue-500/50 text-blue-300 justify-start">
              "{cmd}"
            </Badge>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Read & Summarize",
    icon: Volume2,
    color: "text-purple-400",
    content: (
      <div className="space-y-4">
        <p className="text-slate-300">
          Have Echo read your tasks, reminders, notes, and calendar events aloud. Perfect for hands-free use!
        </p>
        <div className="grid gap-2">
          {[
            "Read my tasks",
            "What are my reminders?",
            "Summarize my day",
            "What's on my calendar?",
            "Read my notes",
          ].map((cmd) => (
            <Badge key={cmd} variant="outline" className="border-purple-500/50 text-purple-300 justify-start">
              "{cmd}"
            </Badge>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Search & Information",
    icon: Search,
    color: "text-cyan-400",
    content: (
      <div className="space-y-4">
        <p className="text-slate-300">
          Search the web, check the weather, find nearby places, and get real-time information.
        </p>
        <div className="grid gap-2">
          {[
            "What's the weather?",
            "Find nearby coffee shops",
            "Search for React tutorials",
            "What time is it?",
          ].map((cmd) => (
            <Badge key={cmd} variant="outline" className="border-cyan-500/50 text-cyan-300 justify-start">
              "{cmd}"
            </Badge>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Manage & Update",
    icon: Bell,
    color: "text-yellow-400",
    content: (
      <div className="space-y-4">
        <p className="text-slate-300">
          Complete tasks, dismiss reminders, and reschedule items using voice commands.
        </p>
        <div className="grid gap-2">
          {[
            "Mark first task done",
            "Complete buy groceries task",
            "Dismiss my reminder",
            "Reschedule task to tomorrow",
          ].map((cmd) => (
            <Badge key={cmd} variant="outline" className="border-yellow-500/50 text-yellow-300 justify-start">
              "{cmd}"
            </Badge>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Tips for Best Results",
    icon: Mic,
    color: "text-fuchsia-400",
    content: (
      <div className="space-y-4">
        <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
          <div>
            <h4 className="font-medium text-white">Speak naturally</h4>
            <p className="text-sm text-slate-400">Echo understands conversational language, not just commands.</p>
          </div>
          <div>
            <h4 className="font-medium text-white">Be specific with times</h4>
            <p className="text-sm text-slate-400">"Tomorrow at 3pm" or "in 2 hours" works great.</p>
          </div>
          <div>
            <h4 className="font-medium text-white">Interrupt anytime</h4>
            <p className="text-sm text-slate-400">Tap the mic while Echo is speaking to interrupt.</p>
          </div>
          <div>
            <h4 className="font-medium text-white">Use conversation mode</h4>
            <p className="text-sm text-slate-400">For hands-free operation, use the Voice Chat page.</p>
          </div>
        </div>
      </div>
    ),
  },
];

export default function VoiceTutorial({ open, onClose }: VoiceTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = tutorialSteps[currentStep];
  const StepIcon = step.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white flex items-center gap-2">
              <StepIcon className={`h-5 w-5 ${step.color}`} />
              {step.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:text-white h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="py-4">
          {step.content}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-4">
          {tutorialSteps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentStep ? "bg-fuchsia-500" : "bg-slate-600"
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="border-slate-600 text-slate-300"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            onClick={handleNext}
            className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
          >
            {currentStep === tutorialSteps.length - 1 ? "Get Started" : "Next"}
            {currentStep < tutorialSteps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}