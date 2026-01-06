"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Flame,
  Award,
  Calendar
} from "lucide-react";
import { subDays, startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";

interface ProductivityStats {
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  totalTasksThisWeek: number;
  completionRate: number;
  streak: number;
  trend: "up" | "down" | "stable";
}

export default function ProductivityInsights() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProductivityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

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

      const { count: todayCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("completed_at", todayStart.toISOString())
        .lte("completed_at", todayEnd.toISOString());

      const { count: weekCompletedCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("completed_at", weekStart.toISOString())
        .lte("completed_at", weekEnd.toISOString());

      const { count: weekTotalCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString());

      const { count: lastWeekCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("completed_at", lastWeekStart.toISOString())
        .lte("completed_at", lastWeekEnd.toISOString());

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

      const completedThisWeek = weekCompletedCount || 0;
      const totalThisWeek = weekTotalCount || 1;
      const completedLastWeek = lastWeekCount || 0;

      let trend: "up" | "down" | "stable" = "stable";
      if (completedThisWeek > completedLastWeek) trend = "up";
      else if (completedThisWeek < completedLastWeek) trend = "down";

      setStats({
        tasksCompletedToday: todayCount || 0,
        tasksCompletedThisWeek: completedThisWeek,
        totalTasksThisWeek: totalThisWeek,
        completionRate: Math.round((completedThisWeek / totalThisWeek) * 100),
        streak,
        trend,
      });
    } catch (error) {
      console.error("Failed to load productivity stats:", error);
    }

    setLoading(false);
  };

  if (loading || !stats) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full">
        <CardContent className="p-4 h-full flex items-center justify-center">
          <div className="h-24 w-full bg-slate-700/50 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full">
      <CardContent className="p-4 h-full flex flex-col">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-fuchsia-400" />
          Productivity
        </h3>

        <div className="space-y-4 flex-1">
          {/* Today's Progress */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-slate-300">Today</span>
            </div>
            <span className="text-lg font-bold text-white">
              {stats.tasksCompletedToday} tasks
            </span>
          </div>

          {/* Weekly Progress */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">This week</span>
              <span className="text-xs text-slate-400">
                {stats.tasksCompletedThisWeek}/{stats.totalTasksThisWeek}
              </span>
            </div>
            <Progress value={stats.completionRate} className="h-2" />
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50">
              <Flame className={`h-5 w-5 ${stats.streak > 0 ? "text-orange-400" : "text-slate-500"}`} />
              <div>
                <p className="text-lg font-bold text-white">{stats.streak}</p>
                <p className="text-[10px] text-slate-500">Day streak</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50">
              {stats.trend === "up" ? (
                <TrendingUp className="h-5 w-5 text-green-400" />
              ) : stats.trend === "down" ? (
                <TrendingDown className="h-5 w-5 text-red-400" />
              ) : (
                <Award className="h-5 w-5 text-yellow-400" />
              )}
              <div>
                <p className="text-lg font-bold text-white capitalize">{stats.trend}</p>
                <p className="text-[10px] text-slate-500">vs last week</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}