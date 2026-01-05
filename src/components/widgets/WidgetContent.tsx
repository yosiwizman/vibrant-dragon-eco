"use client";

import React from "react";
import CurrentTimeDisplay from "../CurrentTimeDisplay";
import WeatherWidget from "../WeatherWidget";
import LocationDisplay from "../LocationDisplay";
import QuickActions from "../QuickActions";
import AIUsageWidget from "../AIUsageWidget";
import RecentActivity from "../RecentActivity";
import ProductivityInsights from "../ProductivityInsights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

interface WidgetContentProps {
  type: string;
}

export default function WidgetContent({ type }: WidgetContentProps) {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !['time', 'weather', 'location', 'quick-actions', 'ai-usage', 'recent-activity', 'productivity'].includes(type)) {
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  const loadData = async () => {
    if (!user) return;
    
    try {
      switch (type) {
        case 'tasks':
          const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'pending')
            .order('due_date', { ascending: true })
            .limit(5);
          setData(tasks || []);
          break;

        case 'reminders':
          const { data: reminders } = await supabase
            .from('reminders')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'pending')
            .order('due_time', { ascending: true })
            .limit(5);
          setData(reminders || []);
          break;

        case 'notes':
          const { data: notes } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(5);
          setData(notes || []);
          break;

        case 'calendar':
          const now = new Date();
          const weekEnd = new Date(now);
          weekEnd.setDate(weekEnd.getDate() + 7);
          const { data: events } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('user_id', user.id)
            .gte('start_time', now.toISOString())
            .lte('start_time', weekEnd.toISOString())
            .order('start_time', { ascending: true })
            .limit(5);
          setData(events || []);
          break;

        case 'contacts':
          const { data: contacts } = await supabase
            .from('contacts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);
          setData(contacts || []);
          break;

        case 'messages':
          const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);
          setData(messages || []);
          break;

        case 'upcoming':
          const weekEndUpcoming = new Date();
          weekEndUpcoming.setDate(weekEndUpcoming.getDate() + 7);
          const [upcomingReminders, upcomingEvents, urgentTasks] = await Promise.all([
            supabase.from('reminders').select('id, text, due_time').eq('user_id', user.id).eq('status', 'pending').gte('due_time', new Date().toISOString()).lte('due_time', weekEndUpcoming.toISOString()).order('due_time', { ascending: true }).limit(3),
            supabase.from('calendar_events').select('id, title, start_time').eq('user_id', user.id).gte('start_time', new Date().toISOString()).lte('start_time', weekEndUpcoming.toISOString()).order('start_time', { ascending: true }).limit(3),
            supabase.from('tasks').select('id, title, due_date, priority').eq('user_id', user.id).eq('status', 'pending').in('priority', ['high', 'urgent']).order('due_date', { ascending: true }).limit(3),
          ]);

          const items: any[] = [];
          if (upcomingReminders.data) items.push(...upcomingReminders.data.map(r => ({ id: r.id, type: 'reminder', title: r.text, time: r.due_time })));
          if (upcomingEvents.data) items.push(...upcomingEvents.data.map(e => ({ id: e.id, type: 'event', title: e.title, time: e.start_time })));
          if (urgentTasks.data) items.push(...urgentTasks.data.map(t => ({ id: t.id, type: 'task', title: t.title, time: t.due_date, priority: t.priority })));
          items.sort((a, b) => new Date(a.time || 0).getTime() - new Date(b.time || 0).getTime());
          setData(items.slice(0, 5));
          break;
      }
    } catch (error) {
      console.error('Failed to load widget data:', error);
    }
    
    setLoading(false);
  };

  // Special widgets with their own components
  if (type === 'time') return <CurrentTimeDisplay />;
  if (type === 'weather') return <WeatherWidget />;
  if (type === 'location') return <LocationDisplay />;
  if (type === 'quick-actions') return <QuickActions />;
  if (type === 'ai-usage') return <AIUsageWidget />;
  if (type === 'recent-activity') return <RecentActivity />;
  if (type === 'productivity') return <ProductivityInsights />;

  const formatTime = (time: string) => {
    if (!time) return "No due date";
    const date = parseISO(time);
    if (isToday(date)) return `Today ${format(date, "h:mm a")}`;
    if (isTomorrow(date)) return `Tomorrow ${format(date, "h:mm a")}`;
    return format(date, "MMM d, h:mm a");
  };

  const getIcon = (itemType: string) => {
    switch (itemType) {
      case 'reminder': return <Bell className="h-4 w-4 text-yellow-400" />;
      case 'event': return <Calendar className="h-4 w-4 text-blue-400" />;
      case 'task': return <CheckSquare className="h-4 w-4 text-green-400" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full">
        <CardContent className="p-4 flex items-center justify-center h-full">
          <div className="animate-pulse text-slate-400 text-xs">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full overflow-hidden">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm text-white flex items-center gap-2">
          {type === 'tasks' && <><CheckSquare className="h-4 w-4 text-green-400" />Tasks</>}
          {type === 'reminders' && <><Bell className="h-4 w-4 text-yellow-400" />Reminders</>}
          {type === 'notes' && <><FileText className="h-4 w-4 text-orange-400" />Notes</>}
          {type === 'calendar' && <><Calendar className="h-4 w-4 text-blue-400" />Calendar</>}
          {type === 'contacts' && <><Users className="h-4 w-4 text-cyan-400" />Contacts</>}
          {type === 'messages' && <><Send className="h-4 w-4 text-emerald-400" />Messages</>}
          {type === 'upcoming' && <><TrendingUp className="h-4 w-4 text-fuchsia-400" />Coming Up</>}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 overflow-y-auto" style={{ maxHeight: 'calc(100% - 50px)' }}>
        {!data || data.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No items</p>
        ) : (
          <div className="space-y-2">
            {type === 'upcoming' ? (
              data.map((item: any) => (
                <div key={`${item.type}-${item.id}`} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  {getIcon(item.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{item.title}</p>
                    <p className="text-[10px] text-slate-500">{formatTime(item.time)}</p>
                  </div>
                </div>
              ))
            ) : type === 'tasks' ? (
              data.map((task: any) => (
                <div key={task.id} className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <p className="text-xs text-white truncate">{task.title}</p>
                  {task.due_date && <p className="text-[10px] text-slate-500">{formatTime(task.due_date)}</p>}
                </div>
              ))
            ) : type === 'reminders' ? (
              data.map((reminder: any) => (
                <div key={reminder.id} className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <p className="text-xs text-white truncate">{reminder.text}</p>
                  <p className="text-[10px] text-slate-500">{formatTime(reminder.due_time)}</p>
                </div>
              ))
            ) : type === 'notes' ? (
              data.map((note: any) => (
                <div key={note.id} className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <p className="text-xs text-white font-medium truncate">{note.title}</p>
                  <p className="text-[10px] text-slate-500 line-clamp-2">{note.content}</p>
                </div>
              ))
            ) : type === 'calendar' ? (
              data.map((event: any) => (
                <div key={event.id} className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <p className="text-xs text-white truncate">{event.title}</p>
                  <p className="text-[10px] text-slate-500">{formatTime(event.start_time)}</p>
                </div>
              ))
            ) : type === 'contacts' ? (
              data.map((contact: any) => (
                <div key={contact.id} className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <p className="text-xs text-white truncate">{contact.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{contact.phone}</p>
                </div>
              ))
            ) : type === 'messages' ? (
              data.map((message: any) => (
                <div key={message.id} className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <p className="text-xs text-white font-medium truncate">{message.from_name || 'Unknown'}</p>
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