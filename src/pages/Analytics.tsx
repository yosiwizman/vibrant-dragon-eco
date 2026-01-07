"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { analytics } from "@/services/analytics";
import { 
  BarChart3, 
  TrendingUp, 
  Activity,
  Zap,
  MessageSquare,
  Mic,
  AlertTriangle,
  RefreshCw,
  Download
} from "lucide-react";

export default function Analytics() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [user]);

  const loadAnalytics = () => {
    setLoading(true);
    const data = analytics.getSummary(user?.id);
    setSummary(data);
    setLoading(false);
  };

  const exportAnalytics = () => {
    const data = analytics.getSummary(user?.id);
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading || !summary) {
    return (
      <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center text-slate-400">
              <Activity className="h-12 w-12 mx-auto mb-4 animate-pulse" />
              <p>Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const topEvents = Object.entries(summary.eventsByType)
    .map(([event, count]) => [event, count as number] as [string, number])
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10);

  const maxCount = Math.max(...Object.values(summary.eventsByType) as number[], 1);

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-fuchsia-400" />
              Analytics
            </h1>
            <p className="text-slate-400 mt-1">
              Usage insights and statistics
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={loadAnalytics}
              variant="outline"
              className="border-slate-600 text-slate-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={exportAnalytics}
              className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-fuchsia-500/20">
                  <Activity className="h-5 w-5 text-fuchsia-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Events</p>
                  <p className="text-2xl font-bold text-white">{summary.totalEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Page Views</p>
                  <p className="text-2xl font-bold text-white">
                    {summary.eventsByType.page_view || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Mic className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Voice Commands</p>
                  <p className="text-2xl font-bold text-white">
                    {summary.eventsByType.voice_command || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Errors</p>
                  <p className="text-2xl font-bold text-white">
                    {summary.eventsByType.error || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Breakdown */}
        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-white">Event Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topEvents.map(([event, count]) => {
                const percentage = ((count as number) / maxCount) * 100;
                return (
                  <div key={event} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{event.replace(/_/g, " ")}</span>
                      <span className="text-slate-400">{String(count)}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-fuchsia-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-white">Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.recentEvents.map((event: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                >
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">{event.event}</p>
                    {event.properties && (
                      <p className="text-xs text-slate-400 mt-1">
                        {JSON.stringify(event.properties).substring(0, 100)}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}