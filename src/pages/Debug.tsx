import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePreferences } from "../state/preferences";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { 
  Bug, 
  Mic, 
  MapPin, 
  Database, 
  Wifi, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Smartphone,
  Globe,
  Key,
  Server
} from "lucide-react";

interface SystemCheck {
  name: string;
  status: "checking" | "ok" | "error" | "warning";
  message: string;
  icon: React.ReactNode;
}

export default function Debug() {
  const { preferences } = usePreferences();
  const { user } = useAuth();
  const [systemChecks, setSystemChecks] = useState<SystemCheck[]>([]);
  const [isRunningChecks, setIsRunningChecks] = useState(false);
  const [dbStats, setDbStats] = useState<any>(null);

  useEffect(() => {
    runAllChecks();
    if (user) loadDbStats();
  }, [user]);

  const loadDbStats = async () => {
    if (!user) return;

    try {
      const [tasks, notes, reminders, contacts, notifications] = await Promise.all([
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("notes").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("reminders").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      setDbStats({
        tasks: tasks.count || 0,
        notes: notes.count || 0,
        reminders: reminders.count || 0,
        contacts: contacts.count || 0,
        notifications: notifications.count || 0,
      });
    } catch (error) {
      console.error("Failed to load DB stats:", error);
    }
  };

  const runAllChecks = async () => {
    setIsRunningChecks(true);
    const checks: SystemCheck[] = [];

    // Check microphone
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      checks.push({
        name: "Microphone",
        status: "ok",
        message: "Microphone access granted",
        icon: <Mic className="h-4 w-4" />,
      });
    } catch {
      checks.push({
        name: "Microphone",
        status: "error",
        message: "Microphone access denied or unavailable",
        icon: <Mic className="h-4 w-4" />,
      });
    }

    // Check location
    if ("geolocation" in navigator) {
      try {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        checks.push({
          name: "Location",
          status: "ok",
          message: "Location access granted",
          icon: <MapPin className="h-4 w-4" />,
        });
      } catch {
        checks.push({
          name: "Location",
          status: "warning",
          message: "Location access denied (optional)",
          icon: <MapPin className="h-4 w-4" />,
        });
      }
    } else {
      checks.push({
        name: "Location",
        status: "warning",
        message: "Geolocation not supported",
        icon: <MapPin className="h-4 w-4" />,
      });
    }

    // Check Supabase connection
    try {
      const { error } = await supabase.from("profiles").select("id").limit(1);
      if (error) throw error;
      checks.push({
        name: "Database",
        status: "ok",
        message: "Supabase connection successful",
        icon: <Database className="h-4 w-4" />,
      });
    } catch {
      checks.push({
        name: "Database",
        status: "error",
        message: "Supabase connection failed",
        icon: <Database className="h-4 w-4" />,
      });
    }

    // Check OpenAI API key
    if (preferences.openaiApiKey) {
      checks.push({
        name: "OpenAI API Key",
        status: "ok",
        message: "API key configured",
        icon: <Key className="h-4 w-4" />,
      });
    } else {
      checks.push({
        name: "OpenAI API Key",
        status: "error",
        message: "API key not set - voice features disabled",
        icon: <Key className="h-4 w-4" />,
      });
    }

    // Check network
    if (navigator.onLine) {
      checks.push({
        name: "Network",
        status: "ok",
        message: "Online",
        icon: <Wifi className="h-4 w-4" />,
      });
    } else {
      checks.push({
        name: "Network",
        status: "error",
        message: "Offline",
        icon: <Wifi className="h-4 w-4" />,
      });
    }

    // Check browser features
    const hasMediaRecorder = "MediaRecorder" in window;
    const hasSpeechSynthesis = "speechSynthesis" in window;
    checks.push({
      name: "Browser Features",
      status: hasMediaRecorder && hasSpeechSynthesis ? "ok" : "warning",
      message: `MediaRecorder: ${hasMediaRecorder ? "✓" : "✗"}, SpeechSynthesis: ${hasSpeechSynthesis ? "✓" : "✗"}`,
      icon: <Globe className="h-4 w-4" />,
    });

    // Check Brain API (if configured)
    if (preferences.baseUrl) {
      try {
        const res = await fetch(`${preferences.baseUrl}/health`, { method: "GET" });
        checks.push({
          name: "Brain API",
          status: res.ok ? "ok" : "warning",
          message: res.ok ? "Brain API reachable" : `Status: ${res.status}`,
          icon: <Server className="h-4 w-4" />,
        });
      } catch {
        checks.push({
          name: "Brain API",
          status: "warning",
          message: "Brain API not reachable (optional)",
          icon: <Server className="h-4 w-4" />,
        });
      }
    }

    setSystemChecks(checks);
    setIsRunningChecks(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok": return "bg-green-500/20 text-green-300 border-green-500/50";
      case "error": return "bg-red-500/20 text-red-300 border-red-500/50";
      case "warning": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
      default: return "bg-slate-500/20 text-slate-300 border-slate-500/50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok": return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "error": return <XCircle className="h-4 w-4 text-red-400" />;
      case "warning": return <XCircle className="h-4 w-4 text-yellow-400" />;
      default: return <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />;
    }
  };

  const clearAllData = async () => {
    if (!confirm("Are you sure you want to clear all local data? This cannot be undone.")) return;
    
    localStorage.clear();
    showSuccess("Local data cleared. Please refresh the page.");
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Bug className="h-8 w-8 text-fuchsia-400" />
              Debug Console
            </h1>
            <p className="text-slate-400 mt-1">System diagnostics and debugging tools</p>
          </div>
          <Button
            onClick={runAllChecks}
            disabled={isRunningChecks}
            className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunningChecks ? "animate-spin" : ""}`} />
            Run Checks
          </Button>
        </div>

        {/* System Checks */}
        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {systemChecks.map((check) => (
                <div
                  key={check.name}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 bg-slate-800/50"
                >
                  <div className="text-slate-400">{check.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{check.name}</span>
                      {getStatusIcon(check.status)}
                    </div>
                    <p className="text-xs text-slate-400">{check.message}</p>
                  </div>
                  <Badge className={getStatusColor(check.status)}>
                    {check.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Database Stats */}
        {dbStats && (
          <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-fuchsia-400" />
                Database Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(dbStats).map(([key, value]) => (
                  <div key={key} className="text-center p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="text-2xl font-bold text-fuchsia-400">{value as number}</div>
                    <div className="text-xs text-slate-400 capitalize">{key}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Info */}
        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">User Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">User ID:</span>
                <span className="text-white font-mono">{user?.id || "Not logged in"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-white">{user?.email || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Auth Provider:</span>
                <span className="text-white">{user?.app_metadata?.provider || "N/A"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <pre className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-xs text-slate-300 overflow-auto">
                {JSON.stringify({
                  ...preferences,
                  openaiApiKey: preferences.openaiApiKey ? "***" + preferences.openaiApiKey.slice(-4) : null,
                  authToken: preferences.authToken ? "***" : null,
                  pinCode: preferences.pinCode ? "****" : null,
                }, null, 2)}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Device Info */}
        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-fuchsia-400" />
              Device Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">User Agent:</span>
                <span className="text-white text-xs truncate max-w-md">{navigator.userAgent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Platform:</span>
                <span className="text-white">{navigator.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Language:</span>
                <span className="text-white">{navigator.language}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Screen:</span>
                <span className="text-white">{window.screen.width} x {window.screen.height}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Viewport:</span>
                <span className="text-white">{window.innerWidth} x {window.innerHeight}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-500/30 bg-red-950/20 backdrop-blur-lg shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-red-400">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Clear Local Data</p>
                <p className="text-sm text-slate-400">Remove all locally stored preferences and cache</p>
              </div>
              <Button
                variant="destructive"
                onClick={clearAllData}
              >
                Clear Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}