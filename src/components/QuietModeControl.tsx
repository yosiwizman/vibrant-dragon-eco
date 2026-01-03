"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useVoice } from "@/contexts/VoiceContext";
import { usePreferences } from "@/state/preferences";
import { EarOff, Mic, Play, Square } from "lucide-react";

export default function QuietModeControl() {
  const { isQuietMode, enterQuietMode, exitQuietMode, speak } = useVoice();
  const { preferences } = usePreferences();
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<{
    summary: string;
    bulletPoints: string[];
    actionItems: string[];
  } | null>(null);

  const handleStartQuietMode = () => {
    enterQuietMode(context || undefined);
    setIsOpen(false);
    setContext("");
  };

  const handleEndQuietMode = async () => {
    setIsProcessing(true);
    const result = await exitQuietMode();
    setIsProcessing(false);

    if (result) {
      setSummary(result);
      // Speak the summary
      let summaryText = result.summary;
      if (result.bulletPoints.length > 0) {
        summaryText += ` Key points: ${result.bulletPoints.slice(0, 3).join(". ")}.`;
      }
      if (result.actionItems.length > 0) {
        summaryText += ` Action items: ${result.actionItems.join(". ")}.`;
      }
      await speak(summaryText);
    }
  };

  const handleCloseSummary = () => {
    setSummary(null);
  };

  if (summary) {
    return (
      <Dialog open={true} onOpenChange={handleCloseSummary}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <EarOff className="h-5 w-5 text-purple-400" />
              Listening Session Summary
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">Summary</h4>
              <p className="text-sm text-white bg-slate-800 p-3 rounded-lg">
                {summary.summary || "No summary available."}
              </p>
            </div>

            {summary.bulletPoints.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Key Points</h4>
                <ul className="space-y-1">
                  {summary.bulletPoints.map((point, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-slate-300 flex items-start gap-2"
                    >
                      <span className="text-purple-400">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.actionItems.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Action Items</h4>
                <ul className="space-y-1">
                  {summary.actionItems.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-white bg-fuchsia-500/20 p-2 rounded flex items-start gap-2"
                    >
                      <span className="text-fuchsia-400">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={handleCloseSummary}
              className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (isQuietMode) {
    return (
      <Button
        onClick={handleEndQuietMode}
        disabled={isProcessing}
        className="bg-purple-600 hover:bg-purple-500 text-white"
      >
        {isProcessing ? (
          <>Processing...</>
        ) : (
          <>
            <Square className="h-4 w-4 mr-2" />
            End & Summarize
          </>
        )}
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
        >
          <EarOff className="h-4 w-4 mr-2" />
          Quiet Mode
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <EarOff className="h-5 w-5 text-purple-400" />
            Enter Quiet Mode
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {preferences.assistantName || "Echo"} will listen silently without interrupting.
            Perfect for meetings or conversations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label className="text-slate-300">Context (optional)</Label>
            <Input
              className="bg-slate-800 border-slate-700 text-white"
              placeholder="e.g., Team meeting, Doctor appointment"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
            <p className="text-xs text-slate-500">
              Helps {preferences.assistantName || "Echo"} understand the conversation better
            </p>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
            <p className="text-sm text-slate-300 mb-2">To exit quiet mode, say:</p>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50">
              "{preferences.quietModeExitPhrase || "Echo summarize"}"
            </Badge>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="border-slate-600 text-slate-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleStartQuietMode}
            className="bg-purple-600 hover:bg-purple-500 text-white"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Listening
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}