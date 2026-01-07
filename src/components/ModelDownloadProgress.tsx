"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, Download } from "lucide-react";
import { webLLM } from "@/services/web-llm";

export default function ModelDownloadProgress() {
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const unsubscribe = webLLM.onProgress((p) => {
      setProgress(p);
      setIsDownloading(p > 0 && p < 100);
    });

    return unsubscribe;
  }, []);

  if (!isDownloading) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 w-80">
      <Card className="border-fuchsia-500/30 bg-slate-900/95 backdrop-blur-lg shadow-2xl">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-fuchsia-500/20">
              <Brain className="h-5 w-5 text-fuchsia-400 animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-white font-medium">Downloading Offline AI</p>
              <p className="text-xs text-slate-400">One-time download</p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Progress</span>
              <span className="text-white font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <p className="text-xs text-slate-500">
            This may take a few minutes. You can continue using the app.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}