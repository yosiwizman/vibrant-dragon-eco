import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { usePreferences } from "@/state/preferences";
import { showSuccess } from "@/utils/toast";
import { 
  Sparkles, 
  Mic, 
  Brain, 
  CheckCircle, 
  ArrowRight,
  Key,
  Volume2
} from "lucide-react";

const STORAGE_KEY = "echo:onboarding:completed";

export default function WelcomeModal() {
  const { preferences, setPreferences } = usePreferences();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState(preferences.openaiApiKey || "");

  useEffect(() => {
    // Check if onboarding was completed
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed && !preferences.openaiApiKey) {
      setIsOpen(true);
    }
  }, [preferences.openaiApiKey]);

  const handleComplete = () => {
    if (apiKey) {
      setPreferences({ ...preferences, openaiApiKey: apiKey });
    }
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
    showSuccess("Welcome to Echo! You're all set.");
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
  };

  const features = [
    { icon: <Mic className="h-5 w-5" />, title: "Voice Conversations", desc: "Talk naturally with your AI assistant" },
    { icon: <Brain className="h-5 w-5" />, title: "Smart Memory", desc: "Echo remembers your preferences" },
    { icon: <Sparkles className="h-5 w-5" />, title: "Powerful Tools", desc: "Search, weather, reminders & more" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-slate-900 border-fuchsia-500/30 max-w-lg">
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-white flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-fuchsia-400" />
                Welcome to Echo
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Your personal AI assistant with voice-first interaction
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50">
                  <div className="p-2 rounded-lg bg-fuchsia-500/20 text-fuchsia-400">
                    {feature.icon}
                  </div>
                  <div>
                    <p className="font-medium text-white">{feature.title}</p>
                    <p className="text-sm text-slate-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleSkip} className="text-slate-400">
                Skip for now
              </Button>
              <Button onClick={() => setStep(2)} className="bg-fuchsia-600 text-white hover:bg-fuchsia-500">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-fuchsia-400" />
                Connect OpenAI
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Enter your OpenAI API key to enable voice and chat features
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label className="text-slate-300">OpenAI API Key</Label>
                <Input
                  type="password"
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Get your API key from{" "}
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-fuchsia-400 hover:underline"
                  >
                    platform.openai.com
                  </a>
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-sm text-slate-300 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Your key is stored locally and never shared
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-slate-600 text-slate-400">
                  <Volume2 className="h-3 w-3 mr-1" /> Voice Chat
                </Badge>
                <Badge variant="outline" className="border-slate-600 text-slate-400">
                  <Brain className="h-3 w-3 mr-1" /> GPT-4o
                </Badge>
                <Badge variant="outline" className="border-slate-600 text-slate-400">
                  <Mic className="h-3 w-3 mr-1" /> Whisper STT
                </Badge>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)} className="text-slate-400">
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSkip} className="border-slate-600 text-slate-300">
                  Skip
                </Button>
                <Button 
                  onClick={handleComplete} 
                  className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
                  disabled={!apiKey}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete Setup
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}