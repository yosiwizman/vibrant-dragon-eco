"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/state/preferences";
import {
  checkScheduleConflicts,
  getSchedulingSuggestions,
  ScheduleConflict,
  SchedulingSuggestion,
} from "@/services/smart-scheduling";
import { addMinutes } from "date-fns";

interface UseSmartSchedulingReturn {
  checkConflicts: (
    startTime: Date,
    endTime: Date,
    title: string,
    estimatedDuration?: number
  ) => Promise<ScheduleConflict[]>;
  getSuggestions: (
    taskTitle: string,
    estimatedDuration?: number,
    preferredDate?: Date
  ) => Promise<SchedulingSuggestion[]>;
  conflicts: ScheduleConflict[];
  suggestions: SchedulingSuggestion[];
  isChecking: boolean;
  clearConflicts: () => void;
}

export function useSmartScheduling(): UseSmartSchedulingReturn {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [suggestions, setSuggestions] = useState<SchedulingSuggestion[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const checkConflicts = useCallback(
    async (
      startTime: Date,
      endTime: Date,
      title: string,
      estimatedDuration?: number
    ): Promise<ScheduleConflict[]> => {
      if (!user || !preferences.enableSmartScheduling) {
        return [];
      }

      setIsChecking(true);
      try {
        const result = await checkScheduleConflicts(
          user.id,
          startTime,
          endTime,
          title,
          estimatedDuration
        );
        setConflicts(result);
        return result;
      } catch (error) {
        console.error("Failed to check conflicts:", error);
        return [];
      } finally {
        setIsChecking(false);
      }
    },
    [user, preferences.enableSmartScheduling]
  );

  const getSuggestions = useCallback(
    async (
      taskTitle: string,
      estimatedDuration: number = 30,
      preferredDate?: Date
    ): Promise<SchedulingSuggestion[]> => {
      if (!user || !preferences.enableSmartScheduling) {
        return [];
      }

      setIsChecking(true);
      try {
        const result = await getSchedulingSuggestions(
          user.id,
          taskTitle,
          estimatedDuration,
          preferredDate
        );
        setSuggestions(result);
        return result;
      } catch (error) {
        console.error("Failed to get suggestions:", error);
        return [];
      } finally {
        setIsChecking(false);
      }
    },
    [user, preferences.enableSmartScheduling]
  );

  const clearConflicts = useCallback(() => {
    setConflicts([]);
    setSuggestions([]);
  }, []);

  return {
    checkConflicts,
    getSuggestions,
    conflicts,
    suggestions,
    isChecking,
    clearConflicts,
  };
}