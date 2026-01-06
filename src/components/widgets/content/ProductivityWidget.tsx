"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  Flame,
  Award,
  Calendar,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trophy,
  Zap,
  RefreshCw
} from "lucide-react";
import { subDays, startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";

interface ProductivityStats {
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  totalTasksThisWeek: number;
  completionRate: number;
  streak: number;
  trend: "up" | "down" | "stable";
  focusMinutesToday: number;
  weeklyGoal: number;
  weeklyProgress: number;
}

interface FocusSession {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  totalSeconds: number;
}

export default function ProductivityWidget() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProductivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"stats" | "focus" | "goals">("stats");
  const [focusSession, setFocusSession] = useState<FocusSession>({
    minutes: 25,
    seconds: 0,
    isRunning: false,
    totalSeconds: 25 * 60
  });
  const [weeklyGoal, setWeeklyGoal] = useState(20);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState("20");

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem("weeklyGoal");
    if (saved) {
      setWeeklyGoal(parseInt(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("weeklyGoal", weeklyGoal.toString());
  }, [weeklyGoal]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (focusSession.isRunning && focusSession.totalSeconds > 0) {
      interval = setInterval(() => {
        setFocusSession(prev => {
          const newTotal = prev.totalSeconds - 1;
          if (newTotal <= 0) {
            showSuccess("Focus session complete! 🎉");
            saveFocusSession(prev.totalSeconds / 60);
            return { minutes: 0, seconds: 0, isRunning: false, totalSeconds: 0 };
          }
          return {
            ...prev,
            totalSeconds: newTotal,
            minutes: Math.floor(newTotal / 60),
            seconds: newTotal % 60
          };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [focusSession.isRunning, focusSession.totalSeconds]);

  const loadStats = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const now = new Date();
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const lastWeekStart = subDays(weekStart, 7);
      const lastWeekEnd = subDays(weekEnd, 7);

      const [todayTasks, weekCompleted, weekTotal, lastWeekCompleted] = await Promise.all([
        supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("completed_at", todayStart.toISOString())
          .lte("completed_at", todayEnd.toISOString()),
        supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("completed_at", weekStart.toISOString())
          .lte("completed_at", weekEnd.toISOString()),
        supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", weekStart.toISOString())
          .lte("created_at", weekEnd.toISOString()),
        supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("completed_at", lastWeekStart.toISOString())
          .lte("completed_at", lastWeekEnd.toISOString()),
      ]);

      let streak = 0;
      for (let i = 0; i < 30; i++) {
        const dayStart = startOfDay(subDays(now, i));
        const dayEnd = endOfDay(subDays(now, i));
        
        const { count } = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("completed_at", dayStart.toISOString())
          .lte("completed_at", dayEnd.toISOString());

        if (count && count > 0) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }

      const completedThisWeek = weekCompleted.count || 0;
      const totalThisWeek = weekTotal.count || 1;
      const completedLastWeek = lastWeekCompleted.count || 0;

      let trend: "up" | "down" | "stable" = "stable";
      if (completedThisWeek > completedLastWeek) trend = "up";
      else if (completedThisWeek < completedLastWeek) trend = "down";

      const focusMinutes = parseInt(localStorage.getItem("focusMinutesToday") || "0");

      setStats({
        tasksCompletedToday: todayTasks.count || 0,
        tasksCompletedThisWeek: completedThisWeek,
        totalTasksThisWeek: totalThisWeek,
        completionRate: Math.round((completedThisWeek / totalThisWeek) * 100),
        streak,
        trend,
        focusMinutesToday: focusMinutes,
        weeklyGoal,
        weeklyProgress: Math.round((completedThisWeek / weeklyGoal) * 100),
      });
    } catch (error) {
      console.error("Failed to load productivity stats:", error);
    }

    setLoading(false);
  };

  const saveFocusSession = (minutes: number) => {
    const current = parseInt(localStorage.getItem("focusMinutesToday") || "0");
    const newTotal = current + Math.floor(minutes);
    localStorage.setItem("focusMinutesToday", newTotal.toString());
    loadStats();
  };

  const startFocusSession = (minutes: number) => {
    const totalSeconds = minutes * 60;
    setFocusSession({
      minutes,
      seconds: 0,
      isRunning: true,
      totalSeconds
    });
  };

  const toggleFocus = () => {
    setFocusSession(prev => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const resetFocus = () => {
    setFocusSession({ minutes: 25, seconds: 0, isRunning: false, totalSeconds: 25 * 60 });
  };

  const updateWeeklyGoal = () => {
    const goal = parseInt(newGoal);
    if (goal > 0 && goal <= 999) {
      setWeeklyGoal(goal);
      setIsGoalDialogOpen(false);
      showSuccess("Weekly goal updated!");
      loadStats();
    } else {
      showError("Please enter a valid goal (1-999)");
    }
  };

  if (loading || !stats) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
        <CardHeader className="p-3 pb-2 shrink-0">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Target className="h-4 w-4 text-fuchsia-400" />
            Productivity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 flex-1 min-h-0 flex items-center justify-center">
          <div className="animate-pulse text-slate-400 text-xs">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
        <CardHeader className="p-3 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <Target className="h-4 w-4 text-fuchsia-400" />
              Productivity
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewMode(viewMode === "stats" ? "focus" : viewMode === "focus" ? "goals" : "stats")}
                className="h-6 px-2 text-[10px] text-slate-400 hover:text-white"
              >
                {viewMode === "stats" ? "Focus" : viewMode === "focus" ? "Goals" : "Stats"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={loadStats}
                disabled={loading}
                className="h-6 w-6 p-0 text-slate-400 hover:text-white"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0 flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-3">
          {viewMode === "focus" ? (
            /* Focus Timer View */
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  {String(focusSession.minutes).padStart(2, '0')}:{String(focusSession.seconds).padStart(2, '0')}
                </div>
                {focusSession.totalSeconds === 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {[15, 25, 45].map(min => (
                      <Button
                        key={min}
                        onClick={() => startFocusSession(min)}
                        className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
                      >
                        {min}m
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      onClick={toggleFocus}
                      className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
                    >
                      {focusSession.isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={resetFocus}
                      className="border-slate-600 text-slate-300"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Focus time today</span>
                  <span className="text-sm text-white font-medium">{stats.focusMinutesToday}m</span>
                </div>
              </div>
            </div>
          ) : viewMode === "goals" ? (
            /* Goals View */
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Weekly Goal</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setNewGoal(weeklyGoal.toString());
                      setIsGoalDialogOpen(true);
                    }}
                    className="h-5 px-2 text-[10px] text-fuchsia-400 hover:text-fuchsia-300"
                  >
                    Edit
                  </Button>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-white">
                    {stats.tasksCompletedThisWeek}/{weeklyGoal}
                  </span>
                  <Trophy className={`h-6 w-6 ${stats.weeklyProgress >= 100 ? "text-yellow-400" : "text-slate-600"}`} />
                </div>
                <Progress value={stats.weeklyProgress} className="h-2 mb-1" />
                <p className="text-[10px] text-slate-500">
                  {stats.weeklyProgress >= 100 ? "Goal achieved! 🎉" : `${Math.max(0, weeklyGoal - stats.tasksCompletedThisWeek)} tasks to go`}
                </p>
              </div>

              {/* Achievements */}
              <div className="space-y-2">
                <p className="text-xs text-slate-400">Achievements</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded-lg border ${stats.streak >= 7 ? "bg-orange-500/10 border-orange-400/30" : "bg-slate-900/50 border-slate-700/50"}`}>
                    <Flame className={`h-4 w-4 mb-1 ${stats.streak >= 7 ? "text-orange-400" : "text-slate-600"}`} />
                    <p className="text-[10px] text-slate-400">7-Day Streak</p>
                  </div>
                  <div className={`p-2 rounded-lg border ${stats.tasksCompletedThisWeek >= 10 ? "bg-green-500/10 border-green-400/30" : "bg-slate-900/50 border-slate-700/50"}`}>
                    <Zap className={`h-4 w-4 mb-1 ${stats.tasksCompletedThisWeek >= 10 ? "text-green-400" : "text-slate-600"}`} />
                    <p className="text-[10px] text-slate-400">10 Tasks/Week</p>
                  </div>
                  <div className={`p-2 rounded-lg border ${stats.focusMinutesToday >= 60 ? "bg-purple-500/10 border-purple-400/30" : "bg-slate-900/50 border-slate-700/50"}`}>
                    <Clock className={`h-4 w-4 mb-1 ${stats.focusMinutesToday >= 60 ? "text-purple-400" : "text-slate-600"}`} />
                    <p className="text-[10px] text-slate-400">1hr Focus</p>
                  </div>
                  <div className={`p-2 rounded-lg border ${stats.completionRate >= 80 ? "bg-blue-500/10 border-blue-400/30" : "bg-slate-900/50 border-slate-700/50"}`}>
                    <Award className={`h-4 w-4 mb-1 ${stats.completionRate >= 80 ? "text-blue-400" : "text-slate-600"}`} />
                    <p className="text-[10px] text-slate-400">80% Complete</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Stats View */
            <>
              {/* Today's Progress */}
              <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-blue-400" />
                    <span className="text-xs text-slate-300">Today</span>
                  </div>
                  <span className="text-lg font-bold text-white">
                    {stats.tasksCompletedToday}
                  </span>
                </div>
              </div>

              {/* Weekly Progress */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">This week</span>
                  <span className="text-xs text-slate-400">
                    {stats.tasksCompletedThisWeek}/{stats.totalTasksThisWeek}
                  </span>
                </div>
                <Progress value={stats.completionRate} className="h-2" />
                <p className="text-[10px] text-slate-500">{stats.completionRate}% completion rate</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Flame className={`h-3 w-3 ${stats.streak > 0 ? "text-orange-400" : "text-slate-500"}`} />
                    <span className="text-[10px] text-slate-500">Streak</span>
                  </div>
                  <p className="text-xl font-bold text-white">{stats.streak}</p>
                  <p className="text-[9px] text-slate-600">days</p>
                </div>

                <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <div className="flex items-center gap-1.5 mb-1">
                    {stats.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 text-green-400" />
                    ) : stats.trend === "down" ? (
                      <TrendingDown className="h-3 w-3 text-red-400" />
                    ) : (
                      <Award className="h-3 w-3 text-yellow-400" />
                    )}
                    <span className="text-[10px] text-slate-500">Trend</span>
                  </div>
                  <p className="text-xl font-bold text-white capitalize">{stats.trend}</p>
                  <p className="text-[9px] text-slate-600">vs last week</p>
                </div>

                <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="h-3 w-3 text-purple-400" />
                    <span className="text-[10px] text-slate-500">Focus</span>
                  </div>
                  <p className="text-xl font-bold text-white">{stats.focusMinutesToday}</p>
                  <p className="text-[9px] text-slate-600">min today</p>
                </div>

                <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Trophy className="h-3 w-3 text-yellow-400" />
                    <span className="text-[10px] text-slate-500">Goal</span>
                  </div>
                  <p className="text-xl font-bold text-white">{stats.weeklyProgress}%</p>
                  <p className="text-[9px] text-slate-600">of {weeklyGoal}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Set Goal Dialog */}
      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Set Weekly Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Tasks per week</label>
              <Input
                type="number"
                min="1"
                max="999"
                placeholder="20"
                className="bg-slate-800 border-slate-700 text-white"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsGoalDialogOpen(false)}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={updateWeeklyGoal}
                className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
              >
                Save Goal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}