"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { getAIUsageStats } from "@/services/ai-logging";
import { Brain, Mic, MessageSquare, Zap, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function AIUsageWidget() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalInteractions: 0,
    voiceCommands: 0,
    chatMessages: 0,
    toolCalls: 0,
    errors: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getAIUsageStats(user.id, 7);
    setStats(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur animate-pulse h-full w-full">
        <CardContent className="p-4 h-full flex items-center justify-center">
          <div className="h-16 w-full bg-slate-700/50 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Link to="/ai-logs" className="block h-full w-full">
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur hover:bg-slate-800/70 transition-colors cursor-pointer h-full w-full">
        <CardContent className="p-4 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-fuchsia-500/10">
              <Brain className="h-4 w-4 text-fuchsia-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">AI Usage (7 days)</h3>
          </div>
          
          <div className="grid grid-cols-4 gap-2 flex-1">
            <div className="text-center p-2 rounded-lg bg-slate-900/50 flex flex-col justify-center">
              <Mic className="h-4 w-4 text-fuchsia-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{stats.voiceCommands}</p>
              <p className="text-[10px] text-slate-500">Voice</p>
            </div>
            
            <div className="text-center p-2 rounded-lg bg-slate-900/50 flex flex-col justify-center">
              <MessageSquare className="h-4 w-4 text-blue-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{stats.chatMessages}</p>
              <p className="text-[10px] text-slate-500">Chat</p>
            </div>
            
            <div className="text-center p-2 rounded-lg bg-slate-900/50 flex flex-col justify-center">
              <Zap className="h-4 w-4 text-green-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{stats.toolCalls}</p>
              <p className="text-[10px] text-slate-500">Tools</p>
            </div>
            
            <div className="text-center p-2 rounded-lg bg-slate-900/50 flex flex-col justify-center">
              <AlertCircle className="h-4 w-4 text-red-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{stats.errors}</p>
              <p className="text-[10px] text-slate-500">Errors</p>
            </div>
          </div>
          
          <p className="text-xs text-slate-500 text-center mt-2">
            {stats.totalInteractions} total • Click for logs
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}