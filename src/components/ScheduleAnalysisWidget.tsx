"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { getDailyScheduleAnalysis, learnUserPatterns, LearnedPattern } from "@/services/smart-scheduling";
import {
  Calendar,
  Clock,
  AlertTriangle,
  TrendingUp,
  Brain,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";

interface ScheduleAnalysis {
  totalEvents: number;
  busyHours: number;
  freeSlots: { start: Date; end: Date }[];
  patternAlerts: string[];
}

export default function ScheduleAnalysisWidget() {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<ScheduleAnalysis | null>(null);
  const [patterns, setPatterns] = useState<LearnedPattern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAnalysis();
    }
  }, [user]);

  const loadAnalysis = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [analysisData, patternsData] = await Promise.all([
        getDailyScheduleAnalysis(user.id),
        learnUserPatterns(user.id),
      ]);

      setAnalysis(analysisData);
      setPatterns(patternsData);
    } catch (error) {
      console.error("Failed to load schedule analysis:", error);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur animate-pulse">
        <CardContent className="p-4">
          <div className="h-32 bg-slate-700/50 rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  const workingHours = 9; // 9 hours workday
  const busyPercentage = Math.min((analysis.busyHours / workingHours) * 100, 100);
  const freePercentage = 100 - busyPercentage;

  const getBusyColor = () => {
    if (busyPercentage > 80) return "text-red-400";
    if (busyPercentage > 60) return "text-yellow-400";
    return "text-green-400";
  };

  const highConfidencePatterns = patterns.filter(p => p.confidence > 0.6).slice(0, 3);

  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-400" />
            Today's Schedule
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadAnalysis}
            className="h-6 w-6 text-slate-400 hover:text-white"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>

        {/* Schedule Overview */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-slate-400">Scheduled</span>
            </div>
            <p className={`text-xl font-bold ${getBusyColor()}`}>
              {analysis.busyHours}h
            </p>
            <p className="text-xs text-slate-500">{analysis.totalEvents} events</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-xs text-slate-400">Free</span>
            </div>
            <p className="text-xl font-bold text-green-400">
              {(workingHours - analysis.busyHours).toFixed(1)}h
            </p>
            <p className="text-xs text-slate-500">{analysis.freeSlots.length} slots</p>
          </div>
        </div>

        {/* Busy Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Day utilization</span>
            <span className="text-xs text-slate-400">{busyPercentage.toFixed(0)}%</span>
          </div>
          <Progress value={busyPercentage} className="h-2 bg-slate-700" />
        </div>

        {/* Next Free Slot */}
        {analysis.freeSlots.length > 0 && (
          <div className="mb-4 p-2 rounded-lg bg-green-500/10 border border-green-500/30">
            <p className="text-xs text-green-400 font-medium">Next free slot</p>
            <p className="text-sm text-white">
              {format(analysis.freeSlots[0].start, "h:mm a")} - {format(analysis.freeSlots[0].end, "h:mm a")}
            </p>
          </div>
        )}

        {/* Pattern Alerts */}
        {analysis.patternAlerts.length > 0 && (
          <div className="mb-4 space-y-2">
            {analysis.patternAlerts.slice(0, 2).map((alert, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
              >
                <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                <p className="text-xs text-yellow-300">{alert}</p>
              </div>
            ))}
          </div>
        )}

        {/* Learned Patterns */}
        {highConfidencePatterns.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-slate-400">Learned patterns</span>
            </div>
            <div className="space-y-1">
              {highConfidencePatterns.map((pattern, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-slate-300 truncate">{pattern.activity}</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-purple-500/50 text-purple-400"
                  >
                    {(pattern.confidence * 100).toFixed(0)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}