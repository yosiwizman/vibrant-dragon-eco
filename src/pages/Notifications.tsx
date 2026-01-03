import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Check, Trash2, CheckCheck, AlertCircle, MessageSquare, Clock } from "lucide-react";
import { format } from "date-fns";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      showError("Failed to load notifications");
    } else {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (error) {
      showError("Failed to update notification");
    } else {
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) {
      showError("Failed to update notifications");
    } else {
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      showSuccess("All notifications marked as read");
    }
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);

    if (error) {
      showError("Failed to delete notification");
    } else {
      setNotifications(notifications.filter(n => n.id !== id));
    }
  };

  const clearAll = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      showError("Failed to clear notifications");
    } else {
      setNotifications([]);
      showSuccess("All notifications cleared");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "reminder": return <Clock className="h-5 w-5 text-yellow-400" />;
      case "task": return <Check className="h-5 w-5 text-green-400" />;
      case "message": return <MessageSquare className="h-5 w-5 text-blue-400" />;
      default: return <Bell className="h-5 w-5 text-fuchsia-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "reminder": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
      case "task": return "bg-green-500/20 text-green-300 border-green-500/50";
      case "message": return "bg-blue-500/20 text-blue-300 border-blue-500/50";
      default: return "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/50";
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Bell className="h-8 w-8 text-fuchsia-400" />
              Notifications
            </h1>
            <p className="text-slate-400 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                onClick={markAllAsRead}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <CheckCheck className="h-4 w-4 mr-2" /> Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button 
                variant="outline" 
                onClick={clearAll}
                className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-2">
          {loading ? (
            <Card className="border-slate-700 bg-slate-800/50">
              <CardContent className="p-8 text-center text-slate-400">
                Loading notifications...
              </CardContent>
            </Card>
          ) : notifications.length === 0 ? (
            <Card className="border-slate-700 bg-slate-800/50">
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No notifications yet.</p>
                <p className="text-sm text-slate-500 mt-1">
                  You'll see reminders, task updates, and messages here.
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`border-fuchsia-500/20 bg-black/30 backdrop-blur transition-all ${
                  !notification.read ? "border-l-4 border-l-fuchsia-500" : "opacity-70"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {getTypeIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white">{notification.title}</h4>
                        <Badge className={getTypeColor(notification.type)}>
                          {notification.type}
                        </Badge>
                        {!notification.read && (
                          <Badge className="bg-fuchsia-500/20 text-fuchsia-300">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-300 mt-1">{notification.body}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        {format(new Date(notification.created_at), "PPp")}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="text-slate-400 hover:text-green-400"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        className="text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}