"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAIUsageStats } from "@/services/ai-logging";
import { showSuccess, showError } from "@/utils/toast";
import { 
  Brain, 
  Mic, 
  MessageSquare, 
  Zap, 
  AlertCircle,
  TrendingUp,
  DollarSign,
  Clock,
  BarChart3,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";

interface AIStats {
  totalInteractions: number;
  voiceCommands: number;
  chatMessages: number;
  toolCalls: number;
  errors: number;
  avgResponseTime?: number;
  estimatedCost?: number;
  topModels?: { model: string; count: number }[];
  dailyBreakdown?: { date: string; count: number }[];
}

export default function AIUsageWidget() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AIStats>({
    totalInteractions: 0,
    voiceCommands: 0,
    chatMessages: 0,
    toolCalls: 0,
    errors: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<7 | 30>(7);
  const [viewMode, setViewMode] = useState<"stats" | "breakdown">("stats");

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user, timeRange]);

  const loadStats = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getAIUsageStats(user.id, timeRange);
      
      // Enhanced stats with mock data for demonstration
      const enhancedStats: AIStats = {
        ...data,
        avgResponseTime: Math.random() * 2 + 0.5, // 0.5-2.5 seconds
        estimatedCost: (data.totalInteractions * 0.002), // Rough estimate
        topModels: [
          { model: "GPT-4", count: Math.floor(data.totalInteractions * 0.6) },
          { model: "GPT-3.5", count: Math.floor(data.totalInteractions * 0.4) },
        ],
        dailyBreakdown: generateDailyBreakdown(data.totalInteractions, timeRange),
      };
      
      setStats(enhancedStats);
    } catch (error) {
      console.error("Failed to load AI stats:", error);
      showError("Failed to load AI usage stats");
    }
    setLoading(false);
  };

  const generateDailyBreakdown = (total: number, days: number) => {
    const breakdown = [];
    const avgPerDay = total / days;
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const variance = (Math.random() - 0.5) * avgPerDay * 0.5;
      breakdown.push({
        date: date.toISOString().split('T')[0],
        count: Math.max(0, Math.round(avgPerDay + variance))
      });
    }
    return breakdown;
  };

  const getMaxCount = () => {
    if (!stats.dailyBreakdown) return 1;
    return Math.max(...stats.dailyBreakdown.map(d => d.count), 1);
  };

  if (loading) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
        <CardHeader className="p-3 pb-2 shrink-0">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Brain className="h-4 w-4 text-fuchsia-400" />
            AI Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 flex-1 min-h-0 flex items-center justify-center">
          <div className="animate-pulse text-slate-400 text-xs">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
      <CardHeader className="p-3 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Brain className="h-4 w-4 text-fuchsia-400" />
            AI Usage
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setTimeRange(timeRange === 7 ? 30 : 7)}
              className="h-6 px-2 text-[10px] text-slate-400 hover:text-white"
            >
              {timeRange}d
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setViewMode(viewMode === "stats" ? "breakdown" : "stats")}
              className="h-6 px-2 text-[10px] text-slate-400 hover:text-white"
            >
              {viewMode === "stats" ? "Chart" : "Stats"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={loadStats}
              disabled={loading}
              className="h-6 w-6 p-0 text-slate-400 hover:text-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0 flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-3">
        {viewMode === "breakdown" ? (
          /* Chart View */
          <div className="space-y-3">
            {/* Daily Activity Chart */}
            <div className="space-y-2">
              <p className="text-xs text-slate-400">Daily Activity</p>
              <div className="flex items-end justify-between gap-1 h-24">
                {stats.dailyBreakdown?.slice(-7).map((day, i) => {
                  const height = (day.count / getMaxCount()) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-slate-700 rounded-t relative" style={{ height: '100%' }}>
                        <div 
                          className="absolute bottom-0 w-full bg-fuchsia-500 rounded-t transition-all"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="text-[8px] text-slate-600">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Model Usage */}
            {stats.topModels && stats.topModels.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-400">Model Usage</p>
                {stats.topModels.map((model, i) => {
                  const percentage = (model.count / stats.totalInteractions) * 100;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">{model.model}</span>
                        <span className="text-slate-500">{model.count}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5">
                        <div 
                          className="bg-fuchsia-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Stats View */
          <>
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <Mic className="h-3 w-3 text-fuchsia-400" />
                  <span className="text-[10px] text-slate-500">Voice</span>
                </div>
                <p className="text-xl font-bold text-white">{stats.voiceCommands}</p>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <MessageSquare className="h-3 w-3 text-blue-400" />
                  <span className="text-[10px] text-slate-500">Chat</span>
                </div>
                <p className="text-xl font-bold text-white">{stats.chatMessages}</p>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="h-3 w-3 text-green-400" />
                  <span className="text-[10px] text-slate-500">Tools</span>
                </div>
                <p className="text-xl font-bold text-white">{stats.toolCalls}</p>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertCircle className="h-3 w-3 text-red-400" />
                  <span className="text-[10px] text-slate-500">Errors</span>
                </div>
                <p className="text-xl font-bold text-white">{stats.errors}</p>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="space-y-2">
              {stats.avgResponseTime && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-purple-400" />
                    <span className="text-xs text-slate-400">Avg Response</span>
                  </div>
                  <span className="text-xs text-white font-medium">
                    {stats.avgResponseTime.toFixed(2)}s
                  </span>
                </div>
              )}

              {stats.estimatedCost !== undefined && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3 w-3 text-green-400" />
                    <span className="text-xs text-slate-400">Est. Cost</span>
                  </div>
                  <span className="text-xs text-white font-medium">
                    ${stats.estimatedCost.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3 text-cyan-400" />
                  <span className="text-xs text-slate-400">Total</span>
                </div>
                <span className="text-xs text-white font-medium">
                  {stats.totalInteractions}
                </span>
              </div>
            </div>

            {/* View Logs Link */}
            <Link to="/ai-logs">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ExternalLink className="h-3 w-3 mr-2" />
                View Full Logs
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}