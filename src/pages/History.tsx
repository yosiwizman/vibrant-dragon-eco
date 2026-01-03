import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { showError } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  History as HistoryIcon, 
  Search, 
  Phone, 
  Mail, 
  MessageSquare, 
  Brain,
  FileText,
  Globe,
  Trash2
} from "lucide-react";
import { format } from "date-fns";

interface LogEntry {
  id: string;
  type: string;
  title?: string;
  content?: string;
  created_at: string;
  metadata?: any;
}

export default function History() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [webLogs, setWebLogs] = useState<any[]>([]);
  const [aiLogs, setAiLogs] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadAllLogs();
  }, [user]);

  const loadAllLogs = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Load web search logs
      const { data: webData } = await supabase
        .from("web_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setWebLogs(webData || []);

      // Load AI logs
      const { data: aiData } = await supabase
        .from("ai_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setAiLogs(aiData || []);

      // Load chat messages
      const { data: chatData } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      setChatMessages(chatData || []);
    } catch (error) {
      showError("Failed to load history");
    }

    setLoading(false);
  };

  const clearHistory = async (type: string) => {
    if (!user) return;

    try {
      if (type === "web" || type === "all") {
        await supabase.from("web_logs").delete().eq("user_id", user.id);
        setWebLogs([]);
      }
      if (type === "ai" || type === "all") {
        await supabase.from("ai_logs").delete().eq("user_id", user.id);
        setAiLogs([]);
      }
      if (type === "chat" || type === "all") {
        await supabase.from("chat_messages").delete().eq("user_id", user.id);
        setChatMessages([]);
      }
    } catch (error) {
      showError("Failed to clear history");
    }
  };

  const allLogs = [
    ...webLogs.map(l => ({ ...l, logType: "web" })),
    ...aiLogs.map(l => ({ ...l, logType: "ai" })),
    ...chatMessages.map(l => ({ ...l, logType: "chat" })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getLogIcon = (logType: string) => {
    switch (logType) {
      case "web": return <Globe className="h-4 w-4 text-blue-400" />;
      case "ai": return <Brain className="h-4 w-4 text-purple-400" />;
      case "chat": return <MessageSquare className="h-4 w-4 text-green-400" />;
      default: return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  const getLogBadgeColor = (logType: string) => {
    switch (logType) {
      case "web": return "bg-blue-500/20 text-blue-300 border-blue-500/50";
      case "ai": return "bg-purple-500/20 text-purple-300 border-purple-500/50";
      case "chat": return "bg-green-500/20 text-green-300 border-green-500/50";
      default: return "bg-slate-500/20 text-slate-300 border-slate-500/50";
    }
  };

  const renderLogContent = (log: any) => {
    switch (log.logType) {
      case "web":
        return (
          <div>
            <p className="text-white font-medium">Search: {log.query}</p>
            {log.results_summary && (
              <p className="text-sm text-slate-400 mt-1 line-clamp-2">{log.results_summary}</p>
            )}
          </div>
        );
      case "ai":
        return (
          <div>
            <p className="text-white font-medium">{log.title || log.type}</p>
            {log.content && (
              <p className="text-sm text-slate-400 mt-1 line-clamp-2">{log.content}</p>
            )}
          </div>
        );
      case "chat":
        return (
          <div>
            <Badge className={log.role === "user" ? "bg-fuchsia-500/20 text-fuchsia-300" : "bg-slate-500/20 text-slate-300"}>
              {log.role}
            </Badge>
            <p className="text-sm text-slate-300 mt-1 line-clamp-3">{log.content}</p>
          </div>
        );
      default:
        return <p className="text-slate-400">Unknown log type</p>;
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <HistoryIcon className="h-8 w-8 text-fuchsia-400" />
              History
            </h1>
            <p className="text-slate-400 mt-1">
              Your activity and conversation history
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => clearHistory("all")}
            className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Clear All
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800">
            <TabsTrigger value="all" className="data-[state=active]:bg-fuchsia-600">
              All ({allLogs.length})
            </TabsTrigger>
            <TabsTrigger value="web" className="data-[state=active]:bg-fuchsia-600">
              Web ({webLogs.length})
            </TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-fuchsia-600">
              AI ({aiLogs.length})
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-fuchsia-600">
              Chat ({chatMessages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <LogList logs={allLogs} loading={loading} getLogIcon={getLogIcon} getLogBadgeColor={getLogBadgeColor} renderLogContent={renderLogContent} />
          </TabsContent>

          <TabsContent value="web" className="mt-4">
            <LogList logs={webLogs.map(l => ({ ...l, logType: "web" }))} loading={loading} getLogIcon={getLogIcon} getLogBadgeColor={getLogBadgeColor} renderLogContent={renderLogContent} />
          </TabsContent>

          <TabsContent value="ai" className="mt-4">
            <LogList logs={aiLogs.map(l => ({ ...l, logType: "ai" }))} loading={loading} getLogIcon={getLogIcon} getLogBadgeColor={getLogBadgeColor} renderLogContent={renderLogContent} />
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            <LogList logs={chatMessages.map(l => ({ ...l, logType: "chat" }))} loading={loading} getLogIcon={getLogIcon} getLogBadgeColor={getLogBadgeColor} renderLogContent={renderLogContent} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function LogList({ 
  logs, 
  loading, 
  getLogIcon, 
  getLogBadgeColor, 
  renderLogContent 
}: { 
  logs: any[]; 
  loading: boolean;
  getLogIcon: (type: string) => React.ReactNode;
  getLogBadgeColor: (type: string) => string;
  renderLogContent: (log: any) => React.ReactNode;
}) {
  if (loading) {
    return (
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-8 text-center text-slate-400">
          Loading history...
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-8 text-center">
          <HistoryIcon className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No history yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[60vh]">
      <div className="space-y-2">
        {logs.map((log) => (
          <Card key={log.id} className="border-fuchsia-500/20 bg-black/30 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {getLogIcon(log.logType)}
                <div className="flex-1 min-w-0">
                  {renderLogContent(log)}
                  <p className="text-xs text-slate-500 mt-2">
                    {format(new Date(log.created_at), "PPp")}
                  </p>
                </div>
                <Badge className={getLogBadgeColor(log.logType)}>
                  {log.logType}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}