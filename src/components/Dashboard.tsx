import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import QuickActions from "./QuickActions";
import AIUsageWidget from "./AIUsageWidget";
import CurrentTimeDisplay from "./CurrentTimeDisplay";
import LocationDisplay from "./LocationDisplay";
import WeatherWidget from "./WeatherWidget";
import RecentActivity from "./RecentActivity";
import ProductivityInsights from "./ProductivityInsights";
import {
  CheckSquare,
  Bell,
  Calendar,
  TrendingUp,
  Clock,
  AlertCircle
} from "lucide-react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

interface DashboardStats {
  pendingTasks: number;
  completedTasks: number;
  upcomingReminders: number;
  totalNotes: number;
  todayEvents: number;
  totalContacts: number;
  unreadNotifications: number;
}

interface UpcomingItem {
  id: string;
  type: "reminder" | "event" | "task";
  title: string;
  time: string;
  priority?: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingItems, setUpcomingItems] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);
      const weekEnd = new Date(todayStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const [
        pendingTasksRes,
        completedTasksRes,
        remindersRes,
        notesRes,
        eventsRes,
        contactsRes,
        notificationsRes,
        upcomingRemindersRes,
        upcomingEventsRes,
        urgentTasksRes,
      ] = await Promise.all([
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "pending"),
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "completed"),
        supabase.from("reminders").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "pending"),
        supabase.from("notes").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("calendar_events").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("start_time", todayStart.toISOString()).lt("start_time", todayEnd.toISOString()),
        supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false),
        supabase.from("reminders").select("id, text, due_time").eq("user_id", user.id).eq("status", "pending").gte("due_time", now.toISOString()).lte("due_time", weekEnd.toISOString()).order("due_time", { ascending: true }).limit(3),
        supabase.from("calendar_events").select("id, title, start_time").eq("user_id", user.id).gte("start_time", now.toISOString()).lte("start_time", weekEnd.toISOString()).order("start_time", { ascending: true }).limit(3),
        supabase.from("tasks").select("id, title, due_date, priority").eq("user_id", user.id).eq("status", "pending").in("priority", ["high", "urgent"]).order("due_date", { ascending: true }).limit(3),
      ]);

      setStats({
        pendingTasks: pendingTasksRes.count || 0,
        completedTasks: completedTasksRes.count || 0,
        upcomingReminders: remindersRes.count || 0,
        totalNotes: notesRes.count || 0,
        todayEvents: eventsRes.count || 0,
        totalContacts: contactsRes.count || 0,
        unreadNotifications: notificationsRes.count || 0,
      });

      const items: UpcomingItem[] = [];
      
      if (upcomingRemindersRes.data) {
        items.push(...upcomingRemindersRes.data.map(r => ({
          id: r.id,
          type: "reminder" as const,
          title: r.text,
          time: r.due_time,
        })));
      }
      
      if (upcomingEventsRes.data) {
        items.push(...upcomingEventsRes.data.map(e => ({
          id: e.id,
          type: "event" as const,
          title: e.title,
          time: e.start_time,
        })));
      }
      
      if (urgentTasksRes.data) {
        items.push(...urgentTasksRes.data.map(t => ({
          id: t.id,
          type: "task" as const,
          title: t.title,
          time: t.due_date || "",
          priority: t.priority,
        })));
      }

      items.sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return new Date(a.time).getTime() - new Date(b.time).getTime();
      });

      setUpcomingItems(items.slice(0, 5));
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }

    setLoading(false);
  };

  const formatItemTime = (time: string) => {
    if (!time) return "No due date";
    const date = parseISO(time);
    if (isToday(date)) return `Today at ${format(date, "h:mm a")}`;
    if (isTomorrow(date)) return `Tomorrow at ${format(date, "h:mm a")}`;
    return format(date, "MMM d, h:mm a");
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "reminder": return <Bell className="h-4 w-4 text-yellow-400" />;
      case "event": return <Calendar className="h-4 w-4 text-blue-400" />;
      case "task": return <CheckSquare className="h-4 w-4 text-green-400" />;
      default: return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  if (loading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-slate-700 bg-slate-800/50 backdrop-blur animate-pulse">
            <CardContent className="p-4">
              <div className="h-24 bg-slate-700/50 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    { label: "Pending Tasks", value: stats.pendingTasks, icon: CheckSquare, color: "text-green-400", bgColor: "bg-green-500/10" },
    { label: "Reminders", value: stats.upcomingReminders, icon: Bell, color: "text-yellow-400", bgColor: "bg-yellow-500/10" },
    { label: "Today's Events", value: stats.todayEvents, icon: Calendar, color: "text-blue-400", bgColor: "bg-blue-500/10" },
    { label: "Unread", value: stats.unreadNotifications, icon: AlertCircle, color: "text-fuchsia-400", bgColor: "bg-fuchsia-500/10" },
  ];

  return (
    <div className="space-y-4">
      {/* Time, Location, and Weather Context */}
      <div className="grid gap-4 md:grid-cols-3">
        <CurrentTimeDisplay />
        <LocationDisplay />
        <WeatherWidget />
      </div>

      {/* Quick Actions and Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="md:col-span-1">
          <QuickActions />
        </div>
        <div className="md:col-span-4 grid gap-4 grid-cols-2 md:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-slate-400">{stat.label}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* AI Usage Widget, Productivity, and Recent Activity */}
      <div className="grid gap-4 md:grid-cols-4">
        <AIUsageWidget />
        <ProductivityInsights />
        <div className="md:col-span-2">
          <RecentActivity />
        </div>
      </div>

      {/* Upcoming Items */}
      {upcomingItems.length > 0 && (
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-fuchsia-400" />
              Coming Up
            </h3>
            <div className="space-y-2">
              {upcomingItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50"
                >
                  {getItemIcon(item.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{item.title}</p>
                    <p className="text-xs text-slate-500">{formatItemTime(item.time)}</p>
                  </div>
                  {item.priority && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      item.priority === "urgent" ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"
                    }`}>
                      {item.priority}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}