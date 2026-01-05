"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CurrentTimeDisplay from "./CurrentTimeDisplay";
import LocationDisplay from "./LocationDisplay";
import WeatherWidget from "./WeatherWidget";
import QuickActions from "./QuickActions";
import AIUsageWidget from "./AIUsageWidget";
import RecentActivity from "./RecentActivity";
import ProductivityInsights from "./ProductivityInsights";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import {
  CheckSquare,
  Bell,
  FileText,
  Calendar,
  Users,
  Send,
  TrendingUp,
  Clock as ClockIcon,
} from "lucide-react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

interface WidgetRendererProps {
  widgetId: string;
}

export default function WidgetRenderer({ widgetId }: WidgetRendererProps) {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && widgetId !== "time" && widgetId !== "weather" && widgetId !== "location" && widgetId !== "quick-actions" && widgetId !== "ai-usage" && widgetId !== "recent-activity" && widgetId !== "productivity") {
      loadWidgetData();
    } else {
      setLoading(false);
    }
  }, [user, widgetId]);

  const loadWidgetData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      switch (widgetId) {
        case "tasks":
          const tasksRes = await supabase
            .from("tasks")
            .select("*")
            .eq("user_id", user.id)
            .eq("status", "pending")
            .order("due_date", { ascending: true })
            .limit(5);
          setData(tasksRes.data || []);
          break;

        case "reminders":
          const remindersRes = await supabase
            .from("reminders")
            .select("*")
            .eq("user_id", user.id)
            .eq("status", "pending")
            .order("due_time", { ascending: true })
            .limit(5);
          setData(remindersRes.data || []);
          break;

        case "notes":
          const notesRes = await supabase
            .from("notes")
            .select("*")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(5);
          setData(notesRes.data || []);
          break;

        case "calendar":
          const now = new Date();
          const weekEnd = new Date(now);
          weekEnd.setDate(weekEnd.getDate() + 7);
          const eventsRes = await supabase
            .from("calendar_events")
            .select("*")
            .eq("user_id", user.id)
            .gte("start_time", now.toISOString())
            .lte("start_time", weekEnd.toISOString())
            .order("start_time", { ascending: true })
            .limit(5);
          setData(eventsRes.data || []);
          break;

        case "contacts":
          const contactsRes = await supabase
            .from("contacts")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5);
          setData(contactsRes.data || []);
          break;

        case "messages":
          const messagesRes = await supabase
            .from("messages")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5);
          setData(messagesRes.data || []);
          break;

        case "upcoming":
          const weekEndUpcoming = new Date();
          weekEndUpcoming.setDate(weekEndUpcoming.getDate() + 7);
          const [upcomingReminders, upcomingEvents, urgentTasks] = await Promise.all([
            supabase.from("reminders").select("id, text, due_time").eq("user_id", user.id).eq("status", "pending").gte("due_time", new Date().toISOString()).lte("due_time", weekEndUpcoming.toISOString()).order("due_time", { ascending: true }).limit(3),
            supabase.from("calendar_events").select("id, title, start_time").eq("user_id", user.id).gte("start_time", new Date().toISOString()).lte("start_time", weekEndUpcoming.toISOString()).order("start_time", { ascending: true }).limit(3),
            supabase.from("tasks").select("id, title, due_date, priority").eq("user_id", user.id).eq("status", "pending").in("priority", ["high", "urgent"]).order("due_date", { ascending: true }).limit(3),
          ]);

          const items: any[] = [];
          if (upcomingReminders.data) {
            items.push(...upcomingReminders.data.map(r => ({ id: r.id, type: "reminder", title: r.text, time: r.due_time })));
          }
          if (upcomingEvents.data) {
            items.push(...upcomingEvents.data.map(e => ({ id: e.id, type: "event", title: e.title, time: e.start_time })));
          }
          if (urgentTasks.data) {
            items.push(...urgentTasks.data.map(t => ({ id: t.id, type: "task", title: t.title, time: t.due_date, priority: t.priority })));
          }
          items.sort((a, b) => new Date(a.time || 0).getTime() - new Date(b.time || 0).getTime());
          setData(items.slice(0, 5));
          break;
      }
    } catch (error) {
      console.error("Failed to load widget data:", error);
    }

    setLoading(false);
  };

  // Special widgets that have their own components
  if (widgetId === "time") return <CurrentTimeDisplay />;
  if (widgetId === "weather") return <WeatherWidget />;
  if (widgetId === "location") return <LocationDisplay />;
  if (widgetId === "quick-actions") return <QuickActions />;
  if (widgetId === "ai-usage") return <AIUsageWidget />;
  if (widgetId === "recent-activity") return <RecentActivity />;
  if (widgetId === "productivity") return <ProductivityInsights />;

  const formatTime = (time: string) => {
    if (!time) return "No due date";
    const date = parseISO(time);
    if (isToday(date)) return `Today ${format(date, "h:mm a")}`;
    if (isTomorrow(date)) return `Tomorrow ${format(date, "h:mm a")}`;
    return format(date, "MMM d, h:mm a");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "reminder": return <Bell className="h-4 w-4 text-yellow-400" />;
      case "event": return <Calendar className="h-4 w-4 text-blue-400" />;
      case "task": return <CheckSquare className="h-4 w-4 text-green-400" />;
      default: return <ClockIcon className="h-4 w-4 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full">
        <CardContent className="p-4 flex items-center justify-center h-full">
          <div className="animate-pulse text-slate-400">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full overflow-hidden">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm text-white flex items-center gap-2">
          {widgetId === "tasks" && <><CheckSquare className="h-4 w-4 text-green-400" /> Tasks</>}
          {widgetId === "reminders" && <><Bell className="h-4 w-4 text-yellow-400" /> Reminders</>}
          {widgetId === "notes" && <><FileText className="h-4 w-4 text-orange-400" /> Notes</>}
          {widgetId === "calendar" && <><Calendar className="h-4 w-4 text-blue-400" /> Calendar</>}
          {widgetId === "contacts" && <><Users className="h-4 w-4 text-cyan-400" /> Contacts</>}
          {widgetId === "messages" && <><Send className="h-4 w-4 text-emerald-400" /> Messages</>}
          {widgetId === "upcoming" && <><TrendingUp className="h-4 w-4 text-fuchsia-400" /> Coming Up</>}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 overflow-y-auto" style={{ maxHeight: "calc(100% - 50px)" }}>
        {!data || data.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No items</p>
        ) : (
          <div className="space-y-2">
            {widgetId === "upcoming" ? (
              data.map((item: any) => (
                <div key={`${item.type}-${item.id}`} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  {getIcon(item.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{item.title}</p>
                    <p className="text-[10px] text-slate-500">{formatTime(item.time)}</p>
                  </div>
                </div>
              ))
            ) : widgetId === "tasks" ? (
              data.map((task: any) => (
                <div key={task.id} className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <p className="text-xs text-white truncate">{task.title}</p>
                  {task.due_date && <p className="text-[10px] text-slate-500">{formatTime(task.due_date)}</p>}
                </div>
              ))
            ) : widgetId === "reminders" ? (
              data.map((reminder: any) => (
                <div key={reminder.id} className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <p className="text-xs text-white truncate">{reminder.text}</p>
                  <p className="text-[10px] text-slate-500">{formatTime(reminder.due_time)}</p>
                </div>
              ))
            ) : widgetId === "notes" ? (
              data.map((note: any) => (
                <div key={note.id} className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <p className="text-xs text-white font-medium truncate">{note.title}</p>
                  <p className="text-[10px] text-slate-500 line-clamp-2">{note.content}</p>
                </div>
              ))
            ) : widgetId === "calendar" ? (
              data.map((event: any) => (
                <div key={event.id} className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <p className="text-xs text-white truncate">{event.title}</p>
                  <p className="text-[10px] text-slate-500">{formatTime(event.start_time)}</p>
                </div>
              ))
            ) : widgetId === "contacts" ? (
              data.map((contact: any) => (
                <div key={contact.id} className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <p className="text-xs text-white truncate">{contact.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{contact.phone}</p>
                </div>
              ))
            ) : widgetId === "messages" ? (
              data.map((message: any) => (
                <div key={message.id} className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <p className="text-xs text-white font-medium truncate">{message.from_name || "Unknown"}</p>
                  <p className="text-[10px] text-slate-500 line-clamp-2">{message.message_text}</p>
                </div>
              ))
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}