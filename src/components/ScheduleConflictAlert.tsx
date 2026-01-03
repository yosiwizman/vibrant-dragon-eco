"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Calendar, ArrowRight } from "lucide-react";

interface ScheduleConflict {
  type: "overlap" | "insufficient_time" | "back_to_back";
  message: string;
  suggestions: string[];
  existingItem?: {
    title: string;
    start: Date;
    end: Date;
  };
}

interface ScheduleConflictAlertProps {
  open: boolean;
  onClose: () => void;
  conflicts: ScheduleConflict[];
  newItemTitle: string;
  onProceedAnyway?: () => void;
  onSelectAlternative?: (suggestion: string) => void;
}

export default function ScheduleConflictAlert({
  open,
  onClose,
  conflicts,
  newItemTitle,
  onProceedAnyway,
  onSelectAlternative,
}: ScheduleConflictAlertProps) {
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  const getConflictIcon = (type: string) => {
    switch (type) {
      case "overlap":
        return <AlertTriangle className="h-5 w-5 text-red-400" />;
      case "insufficient_time":
        return <Clock className="h-5 w-5 text-yellow-400" />;
      case "back_to_back":
        return <Calendar className="h-5 w-5 text-orange-400" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-red-400" />;
    }
  };

  const getConflictColor = (type: string) => {
    switch (type) {
      case "overlap":
        return "border-red-500/50 bg-red-500/10";
      case "insufficient_time":
        return "border-yellow-500/50 bg-yellow-500/10";
      case "back_to_back":
        return "border-orange-500/50 bg-orange-500/10";
      default:
        return "border-red-500/50 bg-red-500/10";
    }
  };

  const allSuggestions = [...new Set(conflicts.flatMap(c => c.suggestions))];

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="bg-slate-900 border-slate-700 max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            Scheduling Conflict
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            There are some issues with scheduling "{newItemTitle}"
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 my-4">
          {conflicts.map((conflict, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border ${getConflictColor(conflict.type)}`}
            >
              <div className="flex items-start gap-2">
                {getConflictIcon(conflict.type)}
                <div className="flex-1">
                  <p className="text-sm text-white">{conflict.message}</p>
                  {conflict.existingItem && (
                    <p className="text-xs text-slate-400 mt-1">
                      Conflicts with: {conflict.existingItem.title}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {allSuggestions.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-slate-300 mb-2">Alternative times:</p>
            <div className="flex flex-wrap gap-2">
              {allSuggestions.slice(0, 4).map((suggestion, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className={`cursor-pointer transition-colors ${
                    selectedSuggestion === suggestion
                      ? "bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-300"
                      : "border-slate-600 text-slate-300 hover:bg-slate-800"
                  }`}
                  onClick={() => setSelectedSuggestion(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
            Cancel
          </AlertDialogCancel>
          
          {selectedSuggestion && onSelectAlternative && (
            <Button
              onClick={() => {
                onSelectAlternative(selectedSuggestion);
                onClose();
              }}
              className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white"
            >
              Use {selectedSuggestion}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          
          {onProceedAnyway && (
            <AlertDialogAction
              onClick={onProceedAnyway}
              className="bg-slate-700 hover:bg-slate-600 text-white"
            >
              Schedule Anyway
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}