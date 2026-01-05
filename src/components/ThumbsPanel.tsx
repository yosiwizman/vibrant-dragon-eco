"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThumbsUp, ThumbsDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ThumbsPanel() {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleThumbsUp = () => {
    setFeedback('up');
    // You can add logic here to save feedback
    setTimeout(() => setOpen(false), 1000);
  };

  const handleThumbsDown = () => {
    setFeedback('down');
    // You can add logic here to save feedback
    setTimeout(() => setOpen(false), 1000);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Floating trigger button - small and minimal */}
      <div className="fixed right-4 top-20 z-50">
        <SheetTrigger asChild>
          <Button
            size="icon"
            className="h-10 w-10 rounded-lg shadow-md bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 hover:from-purple-500/30 hover:to-fuchsia-500/30 border border-purple-400/30"
            aria-label="Open feedback panel"
          >
            <ThumbsUp className="h-4 w-4 text-purple-300" />
          </Button>
        </SheetTrigger>
      </div>

      {/* Side panel content - compact design */}
      <SheetContent
        side="right"
        className="w-64 border-l border-purple-500/30 bg-slate-900/95 backdrop-blur-md p-4"
      >
        <SheetHeader>
          <SheetTitle className="text-white text-sm flex items-center justify-between">
            Quick Feedback
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-slate-400 hover:text-white"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <p className="text-xs text-slate-400 text-center">
            How was your experience?
          </p>

          {/* Thumbs buttons */}
          <div className="flex gap-3 justify-center">
            <Button
              size="lg"
              onClick={handleThumbsUp}
              className={cn(
                "flex-1 h-20 rounded-xl transition-all",
                feedback === 'up'
                  ? "bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/25"
                  : "bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 hover:from-purple-500/30 hover:to-fuchsia-500/30 border border-purple-400/30"
              )}
            >
              <ThumbsUp className={cn(
                "h-8 w-8",
                feedback === 'up' ? "text-white" : "text-purple-300"
              )} />
            </Button>

            <Button
              size="lg"
              onClick={handleThumbsDown}
              className={cn(
                "flex-1 h-20 rounded-xl transition-all",
                feedback === 'down'
                  ? "bg-gradient-to-br from-red-500 to-rose-500 shadow-lg shadow-red-500/25"
                  : "bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 hover:from-purple-500/30 hover:to-fuchsia-500/30 border border-purple-400/30"
              )}
            >
              <ThumbsDown className={cn(
                "h-8 w-8",
                feedback === 'down' ? "text-white" : "text-purple-300"
              )} />
            </Button>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div className="mt-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-xs text-center text-slate-300">
                {feedback === 'up' ? "Thanks for the positive feedback! 🎉" : "Thanks for letting us know. We'll improve! 💪"}
              </p>
            </div>
          )}

          {/* Additional info */}
          <div className="mt-6 pt-4 border-t border-slate-700">
            <p className="text-[10px] text-slate-500 text-center">
              Your feedback helps us improve Echo
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}