import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, Download, X, Volume2, Zap, Shield, 
  HardDrive, Wifi, WifiOff, CheckCircle2 
} from "lucide-react";
import { webLLM, isWebLLMSupported } from "@/services/web-llm";
import { offlineVoice } from "@/services/offline-voice";
import { showSuccess, showError } from "@/utils/toast";
import { useNavigate } from "react-router-dom";

interface VoiceWelcomeFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function VoiceWelcomeFlow({ onComplete, onSkip }: VoiceWelcomeFlowProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<"welcome" | "downloading" | "tour">("welcome");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const MODEL_SIZE_GB = 1.5;
  const ESTIMATED_TIME_MIN = 5;

  // Voice-guided tour steps
  const tourSteps = [
    {
      message: "Welcome to Echo! I'm your personal AI assistant. Let me show you around.",
      action: null,
      highlight: null,
    },
    {
      message: "This is your dashboard. You can add widgets by saying 'add weather widget' or 'show me tasks'.",
      action: () => navigate("/"),
      highlight: "dashboard",
    },
    {
      message: "You can chat with me anytime. Just click the microphone button or say 'Hey Echo' if wake word is enabled.",
      action: null,
      highlight: "mic-button",
    },
    {
      message: "I can help you manage tasks, set reminders, take notes, and much more. Try saying 'create a task' or 'remind me in 10 minutes'.",
      action: () => navigate("/tasks"),
      highlight: "tasks",
    },
    {
      message: "You're all set! Feel free to explore. I'm here whenever you need me. Just say 'Hey Echo' to get started.",
      action: null,
      highlight: null,
    },
  ];

  const speak = async (text: string) => {
    setIsSpeaking(true);
    try {
      // Use soft, natural browser voice for onboarding
      await offlineVoice.speak(text, {
        voice: "Google UK English Female", // Soft, natural voice
        rate: 0.9, // Slightly slower for clarity
        pitch: 1.1, // Slightly higher for friendliness
      });
    } catch (error) {
      console.error("Voice playback error:", error);
    }
    setIsSpeaking(false);
  };

  const handleDownloadLocalAI = async () => {
    if (!isWebLLMSupported()) {
      showError("Your browser doesn't support local AI. Please use Chrome, Edge, or Safari.");
      return;
    }

    setIsDownloading(true);
    setStep("downloading");

    try {
      await speak("Great choice! I'm downloading the AI model to your device. This will take a few minutes.");

      await webLLM.initialize((progress) => {
        setDownloadProgress(Math.round(progress * 100));
      });

      showSuccess("Local AI downloaded successfully!");
      await speak("Perfect! The AI model is ready. Now let me give you a quick tour.");
      
      setStep("tour");
      startTour();
    } catch (error: any) {
      console.error("Download error:", error);
      showError(error.message || "Failed to download AI model");
      setIsDownloading(false);
      setStep("welcome");
    }
  };

  const handleSkip = async () => {
    await speak("No problem! You can always download the local AI later from Settings. Enjoy Echo!");
    setTimeout(() => {
      onSkip();
    }, 2000);
  };

  const startTour = async () => {
    for (let i = 0; i < tourSteps.length; i++) {
      setTourStep(i);
      const step = tourSteps[i];
      
      // Execute action if any
      if (step.action) {
        step.action();
      }
      
      // Highlight element if specified
      if (step.highlight) {
        highlightElement(step.highlight);
      }
      
      // Speak the message
      await speak(step.message);
      
      // Wait for speech to complete + pause
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Tour complete
    onComplete();
  };

  const highlightElement = (elementId: string) => {
    // Add visual highlight to UI element
    const element = document.querySelector(`[data-tour="${elementId}"]`);
    if (element) {
      element.classList.add("ring-4", "ring-fuchsia-400", "ring-offset-2");
      setTimeout(() => {
        element.classList.remove("ring-4", "ring-fuchsia-400", "ring-offset-2");
      }, 3000);
    }
  };

  if (step === "downloading") {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-fuchsia-500/30 bg-slate-900 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Download className="h-5 w-5 text-fuchsia-400 animate-bounce" />
              Downloading Local AI
            </CardTitle>
            <CardDescription className="text-slate-400">
              Setting up your private, offline AI assistant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Progress</span>
                <span className="text-fuchsia-400 font-medium">{downloadProgress}%</span>
              </div>
              <Progress value={downloadProgress} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <HardDrive className="h-4 w-4 text-blue-400" />
                <span>{MODEL_SIZE_GB}GB</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span>~{ESTIMATED_TIME_MIN} min</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-500/30">
              <p className="text-xs text-blue-300">
                💡 This is a one-time download. The model stays in your browser cache and works completely offline.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "tour") {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm">
        <Card className="border-fuchsia-500/30 bg-slate-900/95 backdrop-blur shadow-2xl">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-fuchsia-500/20">
                <Volume2 className={`h-5 w-5 text-fuchsia-400 ${isSpeaking ? 'animate-pulse' : ''}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">
                  {tourSteps[tourStep]?.message}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 bg-slate-700 rounded-full h-1">
                    <div 
                      className="bg-fuchsia-500 h-1 rounded-full transition-all"
                      style={{ width: `${((tourStep + 1) / tourSteps.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">
                    {tourStep + 1}/{tourSteps.length}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-fuchsia-500/30 bg-slate-900 shadow-2xl">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8 text-slate-400 hover:text-white"
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl text-white">Welcome to Echo!</CardTitle>
              <CardDescription className="text-slate-400">
                Your voice-first AI assistant
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-fuchsia-500/10 to-purple-500/10 border border-fuchsia-500/20">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-fuchsia-400" />
                Voice-Guided Setup
              </h3>
              <p className="text-sm text-slate-300">
                I can walk you through everything with voice guidance, showing you how to use widgets, create tasks, and more!
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-white">Choose your experience:</h4>
              
              {/* Option 1: Local AI (Recommended) */}
              <button
                onClick={handleDownloadLocalAI}
                disabled={isDownloading}
                className="w-full p-4 rounded-lg border-2 border-fuchsia-500/30 bg-slate-800/50 hover:bg-slate-800 hover:border-fuchsia-500/50 transition-all text-left group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-fuchsia-500/20 group-hover:bg-fuchsia-500/30 transition-colors">
                    <WifiOff className="h-5 w-5 text-fuchsia-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-semibold">Local AI Experience</h4>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/50 text-xs">
                        Recommended
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">
                      Download AI to your device for complete privacy and offline access
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="flex items-center gap-1 text-green-400">
                        <CheckCircle2 className="h-3 w-3" />
                        100% Private
                      </span>
                      <span className="flex items-center gap-1 text-green-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Works Offline
                      </span>
                      <span className="flex items-center gap-1 text-green-400">
                        <CheckCircle2 className="h-3 w-3" />
                        No API Costs
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      💾 Size: {MODEL_SIZE_GB}GB • ⏱️ ~{ESTIMATED_TIME_MIN} minutes
                    </p>
                  </div>
                </div>
              </button>

              {/* Option 2: Skip for now */}
              <button
                onClick={handleSkip}
                className="w-full p-4 rounded-lg border border-slate-700 bg-slate-800/30 hover:bg-slate-800/50 transition-all text-left group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-700 group-hover:bg-slate-600 transition-colors">
                    <Wifi className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-1">Skip for Now</h4>
                    <p className="text-sm text-slate-400">
                      Continue without local AI. You'll need an OpenAI API key for voice features.
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      You can download local AI anytime from Settings
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-500/30">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300">
                <strong>Privacy First:</strong> With local AI, all your data stays on your device. No cloud processing, no data collection.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}