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
      <Card className="border-fuchsia-500/20 bg-black/30 backdrop-blur animate-pulse">
        <CardContent className="p-4">
          <div className="h-24 bg-slate-800 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Link to="/ai-logs">
      <Card className="border-fuchsia-500/20 bg-black/30 backdrop-blur hover:bg-black/40 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-5 w-5 text-fuchsia-400" />
            <h3 className="text-sm font-semibold text-white">AI Usage (7 days)</h3>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Mic className="h-4 w-4 text-fuchsia-400" />
              </div>
              <p className="text-lg font-bold text-white">{stats.voiceCommands}</p>
              <p className="text-[10px] text-slate-400">Voice</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <MessageSquare className="h-4 w-4 text-blue-400" />
              </div>
              <p className="text-lg font-bold text-white">{stats.chatMessages}</p>
              <p className="text-[10px] text-slate-400">Chat</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Zap className="h-4 w-4 text-green-400" />
              </div>
              <p className="text-lg font-bold text-white">{stats.toolCalls}</p>
              <p className="text-[10px] text-slate-400">Tools</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <AlertCircle className="h-4 w-4 text-red-400" />
              </div>
              <p className="text-lg font-bold text-white">{stats.errors}</p>
              <p className="text-[10px] text-slate-400">Errors</p>
            </div>
          </div>
          
          <p className="text-xs text-slate-500 text-center mt-3">
            {stats.totalInteractions} total interactions
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}