import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Check, Trash2, CheckCheck, AlertCircle, MessageSquare, Clock, Search, Filter, RefreshCw } from "lucide-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

type FilterType = "all" | "unread" | "read";
type SortType = "newest" | "oldest";

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortType, setSortType] = useState<SortType>("newest");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load notifications
  useEffect(() => {
    if (user) {
      loadNotifications();
      subscribeToNotifications();
    }
  }, [user]);

  // Subscribe to real-time updates
  const subscribeToNotifications = useCallback(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications-page")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          showSuccess("New notification received");
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setNotifications((prev) => prev.filter((n) => n.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadNotifications();
    setIsRefreshing(false);
    showSuccess("Notifications refreshed");
  };

  // Filter and sort notifications
  const filteredNotifications = notifications
    .filter((n) => {
      // Filter by read status
      if (filterType === "unread" && n.read) return false;
      if (filterType === "read" && !n.read) return false;
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          n.title.toLowerCase().includes(query) ||
          n.body.toLowerCase().includes(query) ||
          n.type.toLowerCase().includes(query)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortType === "newest" ? dateB - dateA : dateA - dateB;
    });

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Bell className="h-8 w-8 text-fuchsia-400" />
              Notifications
            </h1>
            <p className="text-slate-400 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread of ${notifications.length} total` : "All caught up!"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh
            </Button>
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

        {/* Search and Filters */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                  <SelectTrigger className="w-32 bg-slate-900 border-slate-600 text-white">
                    <Filter className="h-4 w-4 mr-2 text-slate-400" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortType} onValueChange={(v) => setSortType(v as SortType)}>
                  <SelectTrigger className="w-32 bg-slate-900 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="space-y-2">
          {loading ? (
            <Card className="border-slate-700 bg-slate-800/50">
              <CardContent className="p-8 text-center text-slate-400">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                Loading notifications...
              </CardContent>
            </Card>
          ) : filteredNotifications.length === 0 ? (
            <Card className="border-slate-700 bg-slate-800/50">
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">
                  {searchQuery || filterType !== "all"
                    ? "No notifications match your filters."
                    : "No notifications yet."}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {searchQuery || filterType !== "all"
                    ? "Try adjusting your search or filters."
                    : "You'll see reminders, task updates, and messages here."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
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
                      <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                        <span>{format(new Date(notification.created_at), "PPp")}</span>
                        <span className="text-slate-600">•</span>
                        <span>{formatDistanceToNow(parseISO(notification.created_at), { addSuffix: true })}</span>
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