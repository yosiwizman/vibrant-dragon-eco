"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Trophy, Target, Star, TrendingUp } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, differenceInDays } from "date-fns";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  todayCompleted: number;
  weeklyGoal: number;
  weeklyProgress: number;
  lastActiveDate: Date | null;
}

export default function StreakTracker() {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    todayCompleted: 0,
    weeklyGoal: 21, // 3 tasks per day * 7 days
    weeklyProgress: 0,
    lastActiveDate: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      calculateStreak();
    }
  }, [user]);

  const calculateStreak = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);

      // Get today's completed tasks
      const { count: todayCompleted } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("completed_at", todayStart.toISOString())
        .lte("completed_at", todayEnd.toISOString());

      // Get weekly progress (last 7 days)
      const weekStart = subDays(today, 7);
      const { count: weeklyCompleted } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("completed_at", weekStart.toISOString());

      // Calculate streak by checking consecutive days with completed tasks
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      let lastActiveDate: Date | null = null;

      // Check last 30 days for streak calculation
      for (let i = 0; i < 30; i++) {
        const checkDate = subDays(today, i);
        const dayStart = startOfDay(checkDate);
        const dayEnd = endOfDay(checkDate);

        const { count } = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("completed_at", dayStart.toISOString())
          .lte("completed_at", dayEnd.toISOString());

        if ((count || 0) > 0) {
          tempStreak++;
          if (i === 0 || (lastActiveDate && differenceInDays(lastActiveDate, checkDate) === 1)) {
            currentStreak = tempStreak;
          }
          if (!lastActiveDate) {
            lastActiveDate = checkDate;
          }
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          if (i === 0) {
            // Today has no completions, check if yesterday had
            continue;
          }
          tempStreak = 0;
        }
      }

      setStreakData({
        currentStreak,
        longestStreak,
        todayCompleted: todayCompleted || 0,
        weeklyGoal: 21,
        weeklyProgress: weeklyCompleted || 0,
        lastActiveDate,
      });
    } catch (error) {
      console.error("Failed to calculate streak:", error);
    }

    setLoading(false);
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return "🔥🔥🔥";
    if (streak >= 14) return "🔥🔥";
    if (streak >= 7) return "🔥";
    if (streak >= 3) return "✨";
    return "💪";
  };

  const getStreakMessage = (streak: number) => {
    if (streak >= 30) return "Legendary streak!";
    if (streak >= 14) return "On fire!";
    if (streak >= 7) return "Great momentum!";
    if (streak >= 3) return "Building habits!";
    if (streak >= 1) return "Keep going!";
    return "Start your streak!";
  };

  const weeklyPercentage = Math.min(
    (streakData.weeklyProgress / streakData.weeklyGoal) * 100,
    100
  );

  if (loading) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur animate-pulse">
        <CardContent className="p-4">
          <div className="h-24 bg-slate-700/50 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-400" />
            Streak Tracker
          </h3>
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">
            {getStreakEmoji(streakData.currentStreak)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Current Streak */}
          <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-xs text-orange-300">Current</span>
            </div>
            <p className="text-2xl font-bold text-white">{streakData.currentStreak}</p>
            <p className="text-xs text-slate-400">days</p>
          </div>

          {/* Longest Streak */}
          <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-4 w-4 text-yellow-400" />
              <span className="text-xs text-yellow-300">Best</span>
            </div>
            <p className="text-2xl font-bold text-white">{streakData.longestStreak}</p>
            <p className="text-xs text-slate-400">days</p>
          </div>
        </div>

        {/* Today's Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Target className="h-3 w-3" />
              Today
            </span>
            <span className="text-xs text-white font-medium">
              {streakData.todayCompleted} tasks
            </span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  i <= streakData.todayCompleted
                    ? "bg-green-500"
                    : "bg-slate-700"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Weekly Goal */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Weekly Goal
            </span>
            <span className="text-xs text-white font-medium">
              {streakData.weeklyProgress}/{streakData.weeklyGoal}
            </span>
          </div>
          <Progress value={weeklyPercentage} className="h-2 bg-slate-700" />
        </div>

        {/* Motivation Message */}
        <div className="mt-3 text-center">
          <p className="text-xs text-fuchsia-300 font-medium">
            {getStreakMessage(streakData.currentStreak)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}