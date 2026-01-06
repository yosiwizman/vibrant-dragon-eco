"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import {
  Activity,
  CheckSquare,
  Bell,
  FileText,
  Calendar,
  MessageSquare,
  Search,
  Brain,
  RefreshCw,
  Filter,
  Undo2,
  ExternalLink
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

interface ActivityItem {
  id: string;
  type: "task" | "reminder" | "note" | "event" | "message" | "search" | "knowledge" | "action";
  title: string;
  timestamp: string;
  action?: string;
  canUndo?: boolean;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  task: CheckSquare,
  reminder: Bell,
  note: FileText,
  event: Calendar,
  message: MessageSquare,
  search: Search,
  knowledge: Brain,
  action: Activity,
};

const TYPE_COLORS: Record<string, string> = {
  task: "text-green-400",
  reminder: "text-yellow-400",
  note: "text-orange-400",
  event: "text-blue-400",
  message: "text-emerald-400",
  search: "text-fuchsia-400",
  knowledge: "text-purple-400",
  action: "text-cyan-400",
};

const TYPE_BG_COLORS: Record<string, string> = {
  task: "bg-green-500/10",
  reminder: "bg-yellow-500/10",
  note: "bg-orange-500/10",
  event: "bg-blue-500/10",
  message: "bg-emerald-500/10",
  search: "bg-fuchsia-500/10",
  knowledge: "bg-purple-500/10",
  action: "bg-cyan-500/10",
};

export default function RecentActivityWidget() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"all" | "today">("all");

  useEffect(() => {
    if (user) loadRecentActivity();
  }, [user, viewMode]);

  const loadRecentActivity = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const timeFilter = viewMode === "today" 
        ? new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [tasks, reminders, notes, events, actionHistory] = await Promise.all([
        supabase
          .from("tasks")
          .select("id, title, created_at")
          .eq("user_id", user.id)
          .gte("created_at", timeFilter)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("reminders")
          .select("id, text, created_at")
          .eq("user_id", user.id)
          .gte("created_at", timeFilter)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("notes")
          .select("id, title, created_at")
          .eq("user_id", user.id)
          .gte("created_at", timeFilter)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("calendar_events")
          .select("id, title, created_at")
          .eq("user_id", user.id)
          .gte("created_at", timeFilter)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("action_history")
          .select("id, action_type, entity_type, can_undo, created_at")
          .eq("user_id", user.id)
          .gte("created_at", timeFilter)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const items: ActivityItem[] = [];

      if (tasks.data) {
        items.push(...tasks.data.map(t => ({
          id: t.id,
          type: "task" as const,
          title: t.title,
          timestamp: t.created_at,
        })));
      }

      if (reminders.data) {
        items.push(...reminders.data.map(r => ({
          id: r.id,
          type: "reminder" as const,
          title: r.text,
          timestamp: r.created_at,
        })));
      }

      if (notes.data) {
        items.push(...notes.data.map(n => ({
          id: n.id,
          type: "note" as const,
          title: n.title,
          timestamp: n.created_at,
        })));
      }

      if (events.data) {
        items.push(...events.data.map(e => ({
          id: e.id,
          type: "event" as const,
          title: e.title,
          timestamp: e.created_at,
        })));
      }

      if (actionHistory.data) {
        items.push(...actionHistory.data.map(a => ({
          id: a.id,
          type: "action" as const,
          title: `${a.action_type} ${a.entity_type}`,
          timestamp: a.created_at,
          action: a.action_type,
          canUndo: a.can_undo,
        })));
      }

      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(items.slice(0, 20));
    } catch (error) {
      console.error("Failed to load recent activity:", error);
    }

    setLoading(false);
  };

  const undoAction = async (actionId: string) => {
    try {
      const { data: action } = await supabase
        .from("action_history")
        .select("*")
        .eq("id", actionId)
        .single();

      if (!action || !action.can_undo || action.undone) {
        showError("Cannot undo this action");
        return;
      }

      // Mark as undone
      await supabase
        .from("action_history")
        .update({ undone: true })
        .eq("id", actionId);

      showSuccess("Action undone!");
      loadRecentActivity();
    } catch (error) {
      showError("Failed to undo action");
    }
  };

  const filteredActivities = filterType 
    ? activities.filter(a => a.type === filterType)
    : activities;

  const activityTypes = Array.from(new Set(activities.map(a => a.type)));

  if (loading) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
        <CardHeader className="p-3 pb-2 shrink-0">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-fuchsia-400" />
            Recent Activity
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
            <Activity className="h-4 w-4 text-fuchsia-400" />
            Recent Activity
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setViewMode(viewMode === "all" ? "today" : "all")}
              className="h-6 px-2 text-[10px] text-slate-400 hover:text-white"
            >
              {viewMode === "all" ? "7d" : "Today"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={loadRecentActivity}
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
        {activityTypes.length > 1 && (
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
            {activityTypes.map(type => (
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

        {/* Activity List */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-2">
          {filteredActivities.length === 0 ? (
            <p className="text-[10px] text-slate-500 text-center py-4">
              No {filterType || ""} activity
            </p>
          ) : (
            filteredActivities.map((activity) => {
              const IconComp = TYPE_ICONS[activity.type] || Activity;
              const colorClass = TYPE_COLORS[activity.type] || "text-slate-400";
              const bgColorClass = TYPE_BG_COLORS[activity.type] || "bg-slate-500/10";
              
              return (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50 border border-slate-700/50"
                >
                  <div className={`p-1 rounded ${bgColorClass} shrink-0`}>
                    <IconComp className={`h-3 w-3 ${colorClass}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{activity.title}</p>
                    <p className="text-[10px] text-slate-500">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant="outline" className="border-slate-700 text-slate-500 text-[9px] capitalize">
                      {activity.type}
                    </Badge>
                    {activity.canUndo && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => undoAction(activity.id)}
                        className="h-5 w-5 p-0 text-slate-400 hover:text-fuchsia-400"
                        title="Undo"
                      >
                        <Undo2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* View Full History Link */}
        <Link to="/history">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <ExternalLink className="h-3 w-3 mr-2" />
            View Full History
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}