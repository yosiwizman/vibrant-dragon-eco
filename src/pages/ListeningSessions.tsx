"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { getPastSessions, ListeningSession } from "@/services/quiet-mode";
import {
  EarOff,
  Clock,
  FileText,
  CheckSquare,
  Calendar,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

export default function ListeningSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ListeningSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getPastSessions(user.id, 20);
    setSessions(data);
    setLoading(false);
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("ai_logs")
        .delete()
        .eq("id", sessionId);

      if (error) throw error;

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      showSuccess("Session deleted");
    } catch (error) {
      showError("Failed to delete session");
    }
  };

  const getDuration = (session: ListeningSession) => {
    if (!session.endTime) return "In progress";
    const minutes = Math.round(
      (session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60
    );
    return `${minutes} min`;
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <div className="mx-auto max-w-4xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <EarOff className="h-8 w-8 text-purple-400" />
              Listening Sessions
            </h1>
            <p className="text-slate-400 mt-1">
              Review past quiet mode sessions and their summaries
            </p>
          </div>
          <Button
            variant="outline"
            onClick={loadSessions}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className="border-slate-700 bg-slate-800/50 animate-pulse"
              >
                <CardContent className="p-6">
                  <div className="h-24 bg-slate-700/50 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="p-12 text-center">
              <EarOff className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Listening Sessions Yet
              </h3>
              <p className="text-slate-400 max-w-md mx-auto">
                Use quiet mode during meetings or conversations. Say "Go quiet"
                or "Listening mode" to start, then "Echo summarize" when done.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-200px)]">
            <Accordion type="single" collapsible className="space-y-4">
              {sessions.map((session) => (
                <AccordionItem
                  key={session.id}
                  value={session.id}
                  className="border-slate-700 bg-slate-800/50 rounded-lg overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-800/80">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                          <EarOff className="h-5 w-5 text-purple-400" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-white">
                            {session.context || "Listening Session"}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(session.startTime, "MMM d, yyyy")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(session.startTime, "h:mm a")}
                            </span>
                            <Badge
                              variant="outline"
                              className="border-purple-500/50 text-purple-400"
                            >
                              {getDuration(session)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500">
                        {formatDistanceToNow(session.startTime, {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="space-y-4 pt-2">
                      {/* Summary */}
                      {session.summary && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-400" />
                            Summary
                          </h4>
                          <p className="text-sm text-white bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                            {session.summary}
                          </p>
                        </div>
                      )}

                      {/* Bullet Points */}
                      {session.bulletPoints &&
                        session.bulletPoints.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                              <CheckSquare className="h-4 w-4 text-green-400" />
                              Key Points
                            </h4>
                            <ul className="space-y-1">
                              {session.bulletPoints.map((point, idx) => (
                                <li
                                  key={idx}
                                  className="text-sm text-slate-300 flex items-start gap-2"
                                >
                                  <span className="text-purple-400 mt-1">•</span>
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {/* Action Items */}
                      {session.actionItems &&
                        session.actionItems.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                              <CheckSquare className="h-4 w-4 text-fuchsia-400" />
                              Action Items
                            </h4>
                            <ul className="space-y-1">
                              {session.actionItems.map((item, idx) => (
                                <li
                                  key={idx}
                                  className="text-sm text-white bg-fuchsia-500/10 p-2 rounded flex items-start gap-2 border border-fuchsia-500/30"
                                >
                                  <span className="text-fuchsia-400">→</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {/* Transcript Count */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                        <span className="text-xs text-slate-500">
                          {session.transcripts.length} transcript segments
                          recorded
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSession(session.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}