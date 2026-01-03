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

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
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

const TYPE_BG_COLORS: Record<string, string> = {
  task: "bg-green-500/10",
  reminder: "bg-yellow-500/10",
  note: "bg-orange-500/10",
  event: "bg-blue-500/10",
  message: "bg-emerald-500/10",
  search: "bg-fuchsia-500/10",
  knowledge: "bg-purple-500/10",
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

      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(items.slice(0, 5));
    } catch (error) {
      console.error("Failed to load recent activity:", error);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-slate-700/50 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-fuchsia-500/10">
              <Activity className="h-4 w-4 text-fuchsia-400" />
            </div>
            Recent Activity
          </h3>
          <p className="text-sm text-slate-500 text-center py-4">
            No recent activity yet. Start by creating a task, note, or reminder!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-fuchsia-500/10">
            <Activity className="h-4 w-4 text-fuchsia-400" />
          </div>
          Recent Activity
        </h3>
        <div className="space-y-2">
          {activities.map((activity) => {
            const IconComp = TYPE_ICONS[activity.type] || Activity;
            const colorClass = TYPE_COLORS[activity.type] || "text-slate-400";
            const bgColorClass = TYPE_BG_COLORS[activity.type] || "bg-slate-500/10";
            
            return (
              <div
                key={`${activity.type}-${activity.id}`}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50"
              >
                <div className={`p-1.5 rounded-lg ${bgColorClass}`}>
                  <IconComp className={`h-4 w-4 ${colorClass}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{activity.title}</p>
                  <p className="text-xs text-slate-500">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
                <Badge variant="outline" className="border-slate-700 text-slate-500 text-[10px] capitalize">
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