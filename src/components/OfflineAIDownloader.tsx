"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Download, 
  Brain,
  CheckCircle,
  AlertCircle,
  Loader2,
  Smartphone,
  Monitor
} from "lucide-react";
import { webLLM, isWebLLMSupported, getModelSize } from "@/services/web-llm";
import { showSuccess, showError } from "@/utils/toast";

export default function OfflineAIDownloader() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCached, setIsCached] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    checkSupport();
    checkCache();
  }, []);

  const checkSupport = () => {
    setIsSupported(isWebLLMSupported());
  };

  const checkCache = async () => {
    const cached = await webLLM.isModelCached();
    setIsCached(cached);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    
    const unsubscribe = webLLM.onProgress((p) => {
      setProgress(p);
    });

    try {
      await webLLM.initialize();
      setIsCached(true);
      showSuccess("Offline AI ready!");
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to download model:", error);
      showError("Failed to download offline AI");
    } finally {
      setIsDownloading(false);
      unsubscribe();
    }
  };

  if (!isSupported) {
    return null;
  }

  const modelSize = getModelSize();
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className={isCached
          ? "w-full bg-green-600 text-white hover:bg-green-500"
          : "w-full bg-fuchsia-600 text-white hover:bg-fuchsia-500"
        }
      >
        <Brain className="h-5 w-5 mr-2" />
        {isCached ? "✅ Offline AI Ready - Click to Manage" : "📥 Download Offline AI"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Brain className="h-5 w-5 text-fuchsia-400" />
              Offline AI Mode
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

            {/* Status */}
            {isCached ? (
              <div className="p-4 rounded-lg bg-green-900/20 border border-green-500/30">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-300 font-medium">Offline AI Ready</p>
                    <p className="text-xs text-green-400/80 mt-1">
                      The AI model is downloaded and cached. You can use voice commands offline!
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
                      Download the AI model ({modelSize}) to enable offline mode. This is a one-time download.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Download Progress */}
            {isDownloading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Downloading model...</span>
                  <span className="text-slate-400">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-slate-500">
                  This may take a few minutes depending on your connection.
                </p>
              </div>
            )}

            {/* Features */}
            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-medium">What works offline:</p>
              <ul className="space-y-1 text-xs text-slate-500">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  Voice commands and conversations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  Task and reminder management
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  Notes and calendar access
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  All cached data
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="border-slate-600 text-slate-300"
                disabled={isDownloading}
              >
                {isCached ? "Close" : "Cancel"}
              </Button>
              {!isCached && (
                <Button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download ({modelSize})
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