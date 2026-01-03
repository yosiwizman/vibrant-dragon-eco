import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckSquare,
  Bell,
  FileText,
  Calendar,
  MessageSquare,
  Search,
  Brain,
  Activity,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "task" | "reminder" | "note" | "event" | "message" | "search" | "knowledge";
  title: string;
  timestamp: string;
}

const TYPE_ICONS: Record<string, any> = {
  task: CheckSquare,
  reminder: Bell,
  note: FileText,
  event: Calendar,
  message: MessageSquare,
  search: Search,
  knowledge: Brain,
};

const TYPE_COLORS: Record<string, string> = {
  task: "text-green-400",
  reminder: "text-yellow-400",
  note: "text-orange-400",
  event: "text-blue-400",
  message: "text-emerald-400",
  search: "text-fuchsia-400",
  knowledge: "text-purple-400",
};

export default function RecentActivity() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadRecentActivity();
  }, [user]);

  const loadRecentActivity = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [tasks, reminders, notes, events] = await Promise.all([
        supabase
          .from("tasks")
          .select("id, title, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("reminders")
          .select("id, text, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("notes")
          .select("id, title, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("calendar_events")
          .select("id, title, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3),
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

      // Sort by timestamp and take top 5
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(items.slice(0, 5));
    } catch (error) {
      console.error("Failed to load recent activity:", error);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="border-fuchsia-500/20 bg-black/30 backdrop-blur">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-8 bg-slate-800 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return null;
  }

  return (
    <Card className="border-fuchsia-500/20 bg-black/30 backdrop-blur">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-fuchsia-400" />
          Recent Activity
        </h3>
        <div className="space-y-2">
          {activities.map((activity) => {
            const IconComp = TYPE_ICONS[activity.type] || Activity;
            const colorClass = TYPE_COLORS[activity.type] || "text-slate-400";
            
            return (
              <div
                key={`${activity.type}-${activity.id}`}
                className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50"
              >
                <IconComp className={`h-4 w-4 ${colorClass}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{activity.title}</p>
                  <p className="text-xs text-slate-500">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
                <Badge variant="outline" className="border-slate-700 text-slate-500 text-xs">
                  {activity.type}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}