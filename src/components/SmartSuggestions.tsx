"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Lightbulb,
  CheckSquare,
  Bell,
  Calendar,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { format, isToday, isTomorrow, addHours, startOfDay, endOfDay } from "date-fns";
import { Link } from "react-router-dom";

interface Suggestion {
  id: string;
  type: "task" | "reminder" | "event" | "insight";
  title: string;
  description: string;
  action?: {
    label: string;
    path?: string;
    onClick?: () => void;
  };
  priority: "high" | "medium" | "low";
}

export default function SmartSuggestions() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      generateSuggestions();
    }
  }, [user]);

  const generateSuggestions = async () => {
    if (!user) return;
    setLoading(true);

    const newSuggestions: Suggestion[] = [];
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    try {
      // Check for overdue tasks
      const { data: overdueTasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .lt("due_date", now.toISOString())
        .limit(3);

      if (overdueTasks && overdueTasks.length > 0) {
        newSuggestions.push({
          id: "overdue-tasks",
          type: "task",
          title: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? "s" : ""}`,
          description: overdueTasks.map((t) => t.title).join(", "),
          action: { label: "Review", path: "/tasks" },
          priority: "high",
        });
      }

      // Check for upcoming reminders in next 2 hours
      const twoHoursLater = addHours(now, 2);
      const { data: upcomingReminders } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .gte("due_time", now.toISOString())
        .lte("due_time", twoHoursLater.toISOString())
        .limit(3);

      if (upcomingReminders && upcomingReminders.length > 0) {
        const nextReminder = upcomingReminders[0];
        const reminderTime = new Date(nextReminder.due_time);
        newSuggestions.push({
          id: "upcoming-reminder",
          type: "reminder",
          title: "Reminder coming up",
          description: `"${nextReminder.text}" at ${format(reminderTime, "h:mm a")}`,
          action: { label: "View", path: "/reminders" },
          priority: "medium",
        });
      }

      // Check for events today
      const { data: todayEvents } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user.id)
        .gte("start_time", todayStart.toISOString())
        .lte("start_time", todayEnd.toISOString())
        .order("start_time", { ascending: true })
        .limit(3);

      if (todayEvents && todayEvents.length > 0) {
        const nextEvent = todayEvents.find(
          (e) => new Date(e.start_time) > now
        );
        if (nextEvent) {
          newSuggestions.push({
            id: "next-event",
            type: "event",
            title: "Next event today",
            description: `${nextEvent.title} at ${format(new Date(nextEvent.start_time), "h:mm a")}`,
            action: { label: "Calendar", path: "/calendar" },
            priority: "medium",
          });
        }
      }

      // Check for high priority pending tasks
      const { data: highPriorityTasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .in("priority", ["high", "urgent"])
        .limit(3);

      if (highPriorityTasks && highPriorityTasks.length > 0) {
        newSuggestions.push({
          id: "high-priority",
          type: "insight",
          title: "High priority items",
          description: `You have ${highPriorityTasks.length} high priority task${highPriorityTasks.length > 1 ? "s" : ""} pending`,
          action: { label: "Focus", path: "/tasks" },
          priority: "high",
        });
      }

      // Check task completion rate
      const { count: completedToday } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("completed_at", todayStart.toISOString());

      const { count: pendingTasks } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending");

      if ((completedToday || 0) >= 3) {
        newSuggestions.push({
          id: "productivity-insight",
          type: "insight",
          title: "Great progress! 🎉",
          description: `You've completed ${completedToday} tasks today. Keep it up!`,
          priority: "low",
        });
      } else if ((pendingTasks || 0) > 10) {
        newSuggestions.push({
          id: "task-overload",
          type: "insight",
          title: "Task backlog growing",
          description: "Consider prioritizing or delegating some tasks",
          action: { label: "Review", path: "/tasks" },
          priority: "medium",
        });
      }

      // Time-based suggestions
      const hour = now.getHours();
      if (hour >= 9 && hour < 10 && newSuggestions.length < 4) {
        newSuggestions.push({
          id: "morning-planning",
          type: "insight",
          title: "Morning planning",
          description: "Start your day by reviewing today's priorities",
          action: { label: "Plan", path: "/tasks" },
          priority: "low",
        });
      } else if (hour >= 17 && hour < 18 && newSuggestions.length < 4) {
        newSuggestions.push({
          id: "end-of-day",
          type: "insight",
          title: "End of day review",
          description: "Take a moment to review what you accomplished",
          action: { label: "Review", path: "/history" },
          priority: "low",
        });
      }

      setSuggestions(newSuggestions.slice(0, 4));
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
    }

    setLoading(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "task":
        return <CheckSquare className="h-4 w-4" />;
      case "reminder":
        return <Bell className="h-4 w-4" />;
      case "event":
        return <Calendar className="h-4 w-4" />;
      case "insight":
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-400 bg-red-500/10 border-red-500/30";
      case "medium":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      case "low":
        return "text-green-400 bg-green-500/10 border-green-500/30";
      default:
        return "text-slate-400 bg-slate-500/10 border-slate-500/30";
    }
  };

  if (loading) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur animate-pulse">
        <CardContent className="p-4">
          <div className="h-32 bg-slate-700/50 rounded" />
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardContent className="p-4 text-center">
          <Sparkles className="h-8 w-8 text-fuchsia-400 mx-auto mb-2" />
          <p className="text-sm text-slate-400">All caught up! No suggestions right now.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-400" />
            Smart Suggestions
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={generateSuggestions}
            className="h-6 w-6 text-slate-400 hover:text-white"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>

        <div className="space-y-2">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`p-3 rounded-lg border ${getPriorityColor(suggestion.priority)} transition-colors`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getIcon(suggestion.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{suggestion.title}</p>
                  <p className="text-xs text-slate-400 truncate">{suggestion.description}</p>
                </div>
                {suggestion.action && (
                  <Link to={suggestion.action.path || "#"}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-slate-300 hover:text-white"
                    >
                      {suggestion.action.label}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}