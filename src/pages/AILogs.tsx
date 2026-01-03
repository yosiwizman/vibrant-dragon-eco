"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Brain, Search, Filter, Clock, MessageSquare, Zap, FileText, Trash2, RefreshCw } from "lucide-react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { showSuccess, showError } from "@/utils/toast";

interface AILog {
  id: string;
  user_id: string;
  type: string;
  title: string | null;
  content: string | null;
  ref_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export default function AILogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AILog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<AILog | null>(null);

  useEffect(() => {
    if (user) {
      loadLogs();
    }
  }, [user]);

  const loadLogs = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("ai_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      showError(error.message || "Failed to load AI logs");
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("ai_logs").delete().eq("id", id);
      if (error) throw error;
      showSuccess("Log deleted");
      setLogs(logs.filter((l) => l.id !== id));
      setSelectedLog(null);
    } catch (error: any) {
      showError(error.message || "Failed to delete log");
    }
  };

  const handleClearAll = async () => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete all AI logs? This cannot be undone.")) return;

    try {
      const { error } = await supabase.from("ai_logs").delete().eq("user_id", user.id);
      if (error) throw error;
      showSuccess("All logs cleared");
      setLogs([]);
    } catch (error: any) {
      showError(error.message || "Failed to clear logs");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "chat":
        return <MessageSquare className="h-4 w-4 text-blue-400" />;
      case "voice":
        return <Zap className="h-4 w-4 text-fuchsia-400" />;
      case "tool":
        return <Brain className="h-4 w-4 text-green-400" />;
      case "summary":
        return <FileText className="h-4 w-4 text-orange-400" />;
      default:
        return <Brain className="h-4 w-4 text-slate-400" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      chat: "bg-blue-500/20 text-blue-300 border-blue-500/50",
      voice: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/50",
      tool: "bg-green-500/20 text-green-300 border-green-500/50",
      summary: "bg-orange-500/20 text-orange-300 border-orange-500/50",
    };
    return (
      <Badge className={colors[type] || "bg-slate-500/20 text-slate-300 border-slate-500/50"}>
        {type}
      </Badge>
    );
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || log.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const uniqueTypes = [...new Set(logs.map((l) => l.type))];

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Brain className="h-8 w-8 text-fuchsia-400" />
              AI Logs
            </h1>
            <p className="text-slate-400 mt-1">View your AI interaction history</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadLogs}
              className="border-slate-600 text-slate-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-slate-700 bg-black/30 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  className="bg-slate-800 border-slate-700 pl-10"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">All Types</SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type} value={type} className="text-white">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-slate-700 bg-black/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-white">{logs.length}</p>
              <p className="text-xs text-slate-400">Total Logs</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-black/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">
                {logs.filter((l) => l.type === "chat").length}
              </p>
              <p className="text-xs text-slate-400">Chat</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-black/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-fuchsia-400">
                {logs.filter((l) => l.type === "voice").length}
              </p>
              <p className="text-xs text-slate-400">Voice</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-black/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-400">
                {logs.filter((l) => l.type === "tool").length}
              </p>
              <p className="text-xs text-slate-400">Tool Calls</p>
            </CardContent>
          </Card>
        </div>

        {/* Logs List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="border-slate-700 bg-black/30 animate-pulse">
                <CardContent className="p-4">
                  <div className="h-16 bg-slate-800 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <Card className="border-slate-700 bg-black/30">
            <CardContent className="p-12 text-center">
              <Brain className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No logs found</h3>
              <p className="text-slate-400">
                {searchQuery || typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "AI interaction logs will appear here"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <Card
                  key={log.id}
                  className="border-slate-700 bg-black/30 hover:bg-black/40 transition-colors cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-slate-800">
                        {getTypeIcon(log.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getTypeBadge(log.type)}
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(parseISO(log.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="font-medium text-white truncate">
                          {log.title || "Untitled"}
                        </p>
                        {log.content && (
                          <p className="text-sm text-slate-400 line-clamp-2 mt-1">
                            {log.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Log Detail Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedLog && getTypeIcon(selectedLog.type)}
                {selectedLog?.title || "Log Details"}
              </DialogTitle>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {getTypeBadge(selectedLog.type)}
                  <span className="text-sm text-slate-400">
                    {format(parseISO(selectedLog.created_at), "PPpp")}
                  </span>
                </div>

                {selectedLog.content && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Content</h4>
                    <div className="bg-slate-800 rounded-lg p-4 text-sm text-slate-300 whitespace-pre-wrap">
                      {selectedLog.content}
                    </div>
                  </div>
                )}

                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Metadata</h4>
                    <div className="bg-slate-800 rounded-lg p-4 text-sm text-slate-300">
                      <pre className="overflow-x-auto">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-700">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedLog(null)}
                    className="border-slate-600"
                  >
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDelete(selectedLog.id)}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}