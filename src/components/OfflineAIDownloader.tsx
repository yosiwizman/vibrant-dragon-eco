"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Brain,
  CheckCircle,
  AlertCircle,
  Loader2,
  Smartphone,
  Monitor,
  Mic,
  Volume2
} from "lucide-react";
import { webLLM, isWebLLMSupported, getModelSize } from "@/services/web-llm";
import { isOfflineVoiceSupported } from "@/services/offline-voice";
import { showSuccess, showError } from "@/utils/toast";

export default function OfflineAIDownloader() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloadingAI, setIsDownloadingAI] = useState(false);
  const [aiProgress, setAIProgress] = useState(0);
  const [isAICached, setIsAICached] = useState(false);
  const [isAISupported, setIsAISupported] = useState(true);
  const [isVoiceSupported, setIsVoiceSupported] = useState(true);

  useEffect(() => {
    checkSupport();
    checkCache();
  }, []);

  const checkSupport = () => {
    setIsAISupported(isWebLLMSupported());
    setIsVoiceSupported(isOfflineVoiceSupported());
  };

  const checkCache = async () => {
    const cached = await webLLM.isModelCached();
    setIsAICached(cached);
  };

  const handleDownloadAI = async () => {
    setIsDownloadingAI(true);
    
    const unsubscribe = webLLM.onProgress((p) => {
      setAIProgress(p);
    });

    try {
      await webLLM.initialize();
      setIsAICached(true);
      showSuccess("Offline AI model downloaded and ready!");
    } catch (error) {
      console.error("Failed to download AI model:", error);
      showError("Failed to download offline AI model");
    } finally {
      setIsDownloadingAI(false);
      unsubscribe();
    }
  };

  const testVoice = () => {
    if (!isVoiceSupported) {
      showError("Web Speech API not supported in this browser");
      return;
    }

    const utterance = new SpeechSynthesisUtterance("Hello! This is how I sound in offline mode.");
    window.speechSynthesis.speak(utterance);
    showSuccess("Voice test successful!");
  };

  if (!isAISupported && !isVoiceSupported) {
    return (
      <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/30">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-300 font-medium">Offline Mode Not Supported</p>
            <p className="text-xs text-red-400/80 mt-1">
              Your browser doesn't support offline AI features. Please use Chrome, Safari, or Edge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const modelSize = getModelSize();
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* AI Model Download */}
        {isAISupported && (
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className={isAICached 
              ? "bg-green-600 text-white hover:bg-green-500" 
              : "bg-fuchsia-600 text-white hover:bg-fuchsia-500"
            }
          >
            <Brain className="h-5 w-5 mr-2" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">
                {isAICached ? "✅ AI Model Ready" : "📥 Download AI Model"}
              </span>
              <span className="text-xs opacity-80">
                {isAICached ? "Click to manage" : `${modelSize} - One-time`}
              </span>
            </div>
          </Button>
        )}

        {/* Voice Test */}
        {isVoiceSupported && (
          <Button
            onClick={testVoice}
            size="lg"
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Volume2 className="h-5 w-5 mr-2" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">✅ Voice Ready</span>
              <span className="text-xs opacity-80">Built-in - Test now</span>
            </div>
          </Button>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Brain className="h-5 w-5 text-fuchsia-400" />
              Offline AI Model
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Device Info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              {isMobile ? (
                <Smartphone className="h-5 w-5 text-blue-400" />
              ) : (
                <Monitor className="h-5 w-5 text-purple-400" />
              )}
              <div>
                <p className="text-sm text-white font-medium">
                  {isMobile ? "Mobile Device" : "Desktop Device"}
                </p>
                <p className="text-xs text-slate-400">
                  Model size: {modelSize}
                </p>
              </div>
            </div>

            {/* What You're Downloading */}
            <div className="space-y-2">
              <p className="text-sm text-white font-medium">What you're downloading:</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-2 rounded bg-slate-800/50">
                  <Brain className="h-4 w-4 text-fuchsia-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-white font-medium">AI Model (LLaMA 3.2)</p>
                    <p className="text-xs text-slate-400">
                      Processes your commands locally - {modelSize}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 rounded bg-slate-800/50">
                  <Mic className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-white font-medium">Voice Recognition (Built-in)</p>
                    <p className="text-xs text-slate-400">
                      Already in your browser - 0MB
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 rounded bg-slate-800/50">
                  <Volume2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-white font-medium">Voice Synthesis (Built-in)</p>
                    <p className="text-xs text-slate-400">
                      Already in your browser - 0MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            {isAICached ? (
              <div className="p-4 rounded-lg bg-green-900/20 border border-green-500/30">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-300 font-medium">Offline AI Ready!</p>
                    <p className="text-xs text-green-400/80 mt-1">
                      The AI model is downloaded. Voice commands work 100% offline!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/30">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-300 font-medium">Download Required</p>
                    <p className="text-xs text-blue-400/80 mt-1">
                      Download the AI model ({modelSize}) to enable offline mode. Voice recognition and synthesis are already built into your browser.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Download Progress */}
            {isDownloadingAI && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Downloading AI model...</span>
                  <span className="text-slate-400">{aiProgress}%</span>
                </div>
                <Progress value={aiProgress} className="h-2" />
                <p className="text-xs text-slate-500">
                  This may take 2-5 minutes. You can continue using the app.
                </p>
              </div>
            )}

            {/* What Works Offline */}
            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-medium">What works offline after download:</p>
              <ul className="space-y-1 text-xs text-slate-500">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  Voice commands (speak and hear responses)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  Natural conversations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  Task and reminder management
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  Notes, calendar, and contacts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  Knowledge base search
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  All 14 widgets
                </li>
              </ul>
            </div>

            {/* Storage Info */}
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Total Download Size:</span>
                <span className="text-sm text-white font-medium">{modelSize}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Voice (Built-in):</span>
                <Badge className="bg-green-500/20 text-green-300 border-green-500/50 text-[10px]">
                  0MB - Free
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="border-slate-600 text-slate-300"
                disabled={isDownloadingAI}
              >
                {isAICached ? "Close" : "Cancel"}
              </Button>
              {!isAICached && (
                <Button
                  onClick={handleDownloadAI}
                  disabled={isDownloadingAI}
                  className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
                >
                  {isDownloadingAI ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Downloading {aiProgress}%
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download AI Model ({modelSize})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}