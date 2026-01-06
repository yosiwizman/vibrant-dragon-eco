"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { 
  TrendingUp,
  CheckSquare,
  Bell,
  Calendar,
  Clock,
  AlertCircle,
  RefreshCw,
  Filter,
  ChevronRight
} from "lucide-react";
import { format, isToday, isTomorrow, isPast, parseISO, differenceInHours } from "date-fns";
import { Link } from "react-router-dom";

interface UpcomingItem {
  id: string;
  type: "task" | "reminder" | "event";
  title: string;
  time: string;
  priority?: string;
  urgency: "overdue" | "urgent" | "soon" | "later";
}

export default function UpcomingWidget() {
  const { user } = useAuth();
  const [items, setItems] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">("week");

  useEffect(() => {
    if (user) loadUpcoming();
  }, [user, timeRange]);

  const loadUpcoming = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const now = new Date();
      let endDate = new Date();
      
      switch (timeRange) {
        case "today":
          endDate.setHours(23, 59, 59, 999);
          break;
        case "week":
          endDate.setDate(endDate.getDate() + 7);
          break;
        case "month":
          endDate.setDate(endDate.getDate() + 30);
          break;
      }

      const [upcomingReminders, upcomingEvents, urgentTasks] = await Promise.all([
        supabase
          .from("reminders")
          .select("id, text, due_time")
          .eq("user_id", user.id)
          .eq("status", "pending")
          .gte("due_time", now.toISOString())
          .lte("due_time", endDate.toISOString())
          .order("due_time", { ascending: true })
          .limit(10),
        supabase
          .from("calendar_events")
          .select("id, title, start_time")
          .eq("user_id", user.id)
          .gte("start_time", now.toISOString())
          .lte("start_time", endDate.toISOString())
          .order("start_time", { ascending: true })
          .limit(10),
        supabase
          .from("tasks")
          .select("id, title, due_date, priority")
          .eq("user_id", user.id)
          .eq("status", "pending")
          .not("due_date", "is", null)
          .gte("due_date", now.toISOString())
          .lte("due_date", endDate.toISOString())
          .order("due_date", { ascending: true })
          .limit(10),
      ]);

      const allItems: UpcomingItem[] = [];

      if (upcomingReminders.data) {
        allItems.push(...upcomingReminders.data.map((r) => ({
          id: r.id,
          type: "reminder" as const,
          title: r.text,
          time: r.due_time,
          urgency: getUrgency(r.due_time)
        })));
      }

      if (upcomingEvents.data) {
        allItems.push(...upcomingEvents.data.map((e) => ({
          id: e.id,
          type: "event" as const,
          title: e.title,
          time: e.start_time,
          urgency: getUrgency(e.start_time)
        })));
      }

      if (urgentTasks.data) {
        allItems.push(...urgentTasks.data.map((t) => ({
          id: t.id,
          type: "task" as const,
          title: t.title,
          time: t.due_date,
          priority: t.priority,
          urgency: getUrgency(t.due_date)
        })));
      }

      // Sort by urgency then by time
      allItems.sort((a, b) => {
        const urgencyOrder = { overdue: 0, urgent: 1, soon: 2, later: 3 };
        const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        if (urgencyDiff !== 0) return urgencyDiff;
        return new Date(a.time).getTime() - new Date(b.time).getTime();
      });

      setItems(allItems.slice(0, 20));
    } catch (error) {
      console.error("Failed to load upcoming items:", error);
    }

    setLoading(false);
  };

  const getUrgency = (timeString: string): "overdue" | "urgent" | "soon" | "later" => {
    const date = parseISO(timeString);
    const now = new Date();
    
    if (isPast(date)) return "overdue";
    
    const hoursUntil = differenceInHours(date, now);
    if (hoursUntil <= 2) return "urgent";
    if (hoursUntil <= 24) return "soon";
    return "later";
  };

  const formatTime = (timeString: string) => {
    const date = parseISO(timeString);
    if (isToday(date)) return `Today ${format(date, "h:mm a")}`;
    if (isTomorrow(date)) return `Tomorrow ${format(date, "h:mm a")}`;
    return format(date, "MMM d, h:mm a");
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "task": return <CheckSquare className="h-3 w-3 text-green-400" />;
      case "reminder": return <Bell className="h-3 w-3 text-yellow-400" />;
      case "event": return <Calendar className="h-3 w-3 text-blue-400" />;
      default: return <Clock className="h-3 w-3 text-slate-400" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "overdue": return "text-red-400 border-red-400/30 bg-red-500/10";
      case "urgent": return "text-orange-400 border-orange-400/30 bg-orange-500/10";
      case "soon": return "text-yellow-400 border-yellow-400/30 bg-yellow-500/10";
      default: return "text-slate-400 border-slate-400/30 bg-slate-500/10";
    }
  };

  const filteredItems = filterType 
    ? items.filter(item => item.type === filterType)
    : items;

  const itemTypes = Array.from(new Set(items.map(item => item.type)));
  const urgentCount = items.filter(item => item.urgency === "urgent" || item.urgency === "overdue").length;

  if (loading) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
        <CardHeader className="p-3 pb-2 shrink-0">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-fuchsia-400" />
            Coming Up
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 flex-1 min-h-0 flex items-center justify-center">
          <div className="animate-pulse text-slate-400 text-xs">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
      <CardHeader className="p-3 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-fuchsia-400" />
            Coming Up
            {urgentCount > 0 && (
              <Badge variant="outline" className="border-red-400/30 text-red-400 text-[9px] ml-1">
                {urgentCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setTimeRange(
                timeRange === "today" ? "week" : 
                timeRange === "week" ? "month" : "today"
              )}
              className="h-6 px-2 text-[10px] text-slate-400 hover:text-white"
            >
              {timeRange === "today" ? "Today" : timeRange === "week" ? "Week" : "Month"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={loadUpcoming}
              disabled={loading}
              className="h-6 w-6 p-0 text-slate-400 hover:text-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0 flex-1 min-h-0 flex flex-col gap-2">
        {/* Filter Chips */}
        {itemTypes.length > 1 && (
          <div className="flex items-center gap-1 flex-wrap">
            <Button
              size="sm"
              variant={filterType === null ? "default" : "outline"}
              onClick={() => setFilterType(null)}
              className={filterType === null 
                ? "h-5 px-2 text-[9px] bg-fuchsia-600 text-white" 
                : "h-5 px-2 text-[9px] border-slate-600 text-slate-400"
              }
            >
              All
            </Button>
            {itemTypes.map(type => (
              <Button
                key={type}
                size="sm"
                variant={filterType === type ? "default" : "outline"}
                onClick={() => setFilterType(type)}
                className={filterType === type 
                  ? "h-5 px-2 text-[9px] bg-fuchsia-600 text-white" 
                  : "h-5 px-2 text-[9px] border-slate-600 text-slate-400"
                }
              >
                {type}
              </Button>
            ))}
          </div>
        )}

        {/* Upcoming Items List */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-2">
          {filteredItems.length === 0 ? (
            <p className="text-[10px] text-slate-500 text-center py-4">
              No upcoming {filterType || "items"}
            </p>
          ) : (
            filteredItems.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className={`p-2 rounded-lg border transition-all ${
                  item.urgency === "overdue" || item.urgency === "urgent"
                    ? "bg-red-900/20 border-red-400/30"
                    : "bg-slate-900/50 border-slate-700/50"
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 shrink-0">
                    {getTypeIcon(item.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-medium line-clamp-2">
                      {item.title}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[10px] flex items-center gap-1 ${
                        item.urgency === "overdue" || item.urgency === "urgent" 
                          ? "text-red-400" 
                          : "text-slate-500"
                      }`}>
                        <Clock className="h-2.5 w-2.5" />
                        {formatTime(item.time)}
                      </span>

                      {item.urgency !== "later" && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${getUrgencyColor(item.urgency)}`}>
                          {item.urgency}
                        </span>
                      )}

                      {item.priority && item.priority !== "medium" && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                          item.priority === "urgent" ? "border-red-400/30 text-red-400" :
                          item.priority === "high" ? "border-orange-400/30 text-orange-400" :
                          "border-green-400/30 text-green-400"
                        }`}>
                          {item.priority}
                        </span>
                      )}
                    </div>
                  </div>

                  <Badge variant="outline" className="border-slate-700 text-slate-500 text-[9px] capitalize shrink-0">
                    {item.type}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Footer */}
        {items.length > 0 && (
          <div className="pt-2 border-t border-slate-700/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {items.length} upcoming {items.length === 1 ? "item" : "items"}
              </span>
              {urgentCount > 0 && (
                <span className="text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {urgentCount} urgent
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}