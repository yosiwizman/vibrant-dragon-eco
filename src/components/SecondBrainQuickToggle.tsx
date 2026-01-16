"use client";

import { useState } from "react";
import { Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSecondBrain } from "@/hooks/useSecondBrain";
import { toast } from "sonner";

interface SecondBrainQuickToggleProps {
  size?: "sm" | "default" | "lg" | "icon";
  showLabel?: boolean;
  className?: string;
}

export default function SecondBrainQuickToggle({
  size = "icon",
  showLabel = false,
  className = "",
}: SecondBrainQuickToggleProps) {
  const [state, actions] = useSecondBrain();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (state.isActive) {
        actions.stop();
        toast.success("Second Brain deactivated");
      } else {
        await actions.start();
        toast.success("Second Brain activated - I'm now listening continuously");
      }
    } catch (error) {
      toast.error("Failed to toggle Second Brain");
    } finally {
      setIsLoading(false);
    }
  };

  const button = (
    <Button
      variant={state.isActive ? "default" : "outline"}
      size={size}
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        ${state.isActive 
          ? "bg-purple-600 hover:bg-purple-700 text-white" 
          : "border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
        }
        ${className}
      `}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Brain className={`h-4 w-4 ${state.isActive ? "animate-pulse" : ""}`} />
      )}
      {showLabel && (
        <span className="ml-2">
          {state.isActive ? "Second Brain Active" : "Start Second Brain"}
        </span>
      )}
    </Button>
  );

  if (showLabel) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>
        <p>{state.isActive ? "Stop Second Brain" : "Start Second Brain"}</p>
        {state.isActive && (
          <p className="text-xs text-slate-400">
            {state.speakerCount} speakers • {state.segmentCount} segments
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}