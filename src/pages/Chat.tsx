import { useEffect, useMemo, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Search, Send, Loader2, Wrench, Trash2 } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { usePreferences } from "@/state/preferences";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Message, Conversation, Citation } from "@/types/models";
import { chat } from "@/services/brain";
import { searchWeb } from "@/services/search";
import { buildSystemPrompt, parseToolCalls, executeTool, ActionResult } from "@/services/orchestrator";
import { getLocationContext, LocationContext } from "@/services/context";
import ChatTips from "@/components/ChatTips";
import { logChatMessage } from "@/services/ai-logging";
import { logChatMessage } from "@/services/ai-logging";

const STORAGE_KEY = "echo:conversation:default";

function loadConversation(): Conversation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveConversation(conv: Conversation) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conv));
}

export default function Chat() {
  const { preferences } = usePreferences();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(
    loadConversation()
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messages = useMemo<Message[]>(
    () => conversation?.messages ?? [],
    [conversation]
  );
  const [userLocation, setUserLocation] = useState<LocationContext | null>(null);

  // Try to get user location on mount
  useEffect(() => {
    getLocationContext().then(loc => {
      if (loc) setUserLocation(loc);
    }).catch(() => {
      // Location not available, that's OK
    });
  }, []);

  useEffect(() => {
    if (!preferences.privateMode && conversation) {
      saveConversation(conversation);
    }
  }, [conversation, preferences.privateMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save message to database
  const saveMessageToDb = async (role: string, content: string) => {
    if (!user || preferences.privateMode) return;
    
    try {
      await supabase.from("chat_messages").insert({
        user_id: user.id,
        role,
        content,
      });
    } catch (error) {
      console.error("Failed to save message to database:", error);
    }
  };

  const appendMessage = async (msg: Message) => {
    setConversation((prev) => {
      const base: Conversation =
        prev ?? { id: "default", createdAt: Date.now(), title: "Echo", messages: [] };
      const next = { ...base, messages: [...base.messages, msg] };
      return next;
    });
    
    // Save to database
    await saveMessageToDb(msg.role, msg.content);
  };

  const clearConversation = async () => {
    setConversation(null);
    localStorage.removeItem(STORAGE_KEY);
    
    // Also clear from database
    if (user && !preferences.privateMode) {
      try {
        await supabase.from("chat_messages").delete().eq("user_id", user.id);
      } catch (error) {
        console.error("Failed to clear messages from database:", error);
      }
    }
    
    showSuccess("Conversation cleared");
  };

  const onSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      createdAt: Date.now(),
    };
    appendMessage(userMsg);
    setInput("");
    setIsLoading(true);

    try {
      // Build messages with system prompt (location-aware)
      const systemPrompt = buildSystemPrompt(userLocation ? {
        lat: userLocation.lat,
        lng: userLocation.lng,
        city: userLocation.city,
      } : undefined);
      const chatMessages = [
        { role: "system" as const, content: systemPrompt },
        ...messages.concat(userMsg).map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      ];

      const res = await chat(
        preferences.baseUrl,
        { messages: chatMessages },
        preferences.authToken,
        preferences.openaiApiKey
      );

      // Check for tool calls in the response
      const toolCalls = parseToolCalls(res.content);
      let toolResults: ActionResult[] = [];
      let finalContent = res.content;

      if (toolCalls.length > 0 && user) {
        // Execute each tool call
        for (const toolCall of toolCalls) {
          const result = await executeTool(user.id, toolCall);
          toolResults.push(result);
        }

        // If tools were executed, get a follow-up response
        if (toolResults.length > 0) {
          const toolResultsText = toolResults.map(r => 
            `Tool: ${r.tool}\nSuccess: ${r.success}\n${r.success ? `Result: ${JSON.stringify(r.data, null, 2)}` : `Error: ${r.error}`}`
          ).join("\n\n");

          const followUpMessages = [
            ...chatMessages,
            { role: "assistant" as const, content: res.content },
            { role: "user" as const, content: `Tool execution results:\n${toolResultsText}\n\nPlease provide a natural language summary of what was done.` },
          ];

          const followUp = await chat(
            preferences.baseUrl,
            { messages: followUpMessages },
            preferences.authToken,
            preferences.openaiApiKey
          );

          finalContent = followUp.content;
        }
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: finalContent,
        citations: res.citations as Citation[] | undefined,
        toolCall: toolResults.length > 0 ? {
          type: "orchestrator",
          input: toolCalls.map(t => t.tool).join(", "),
          outputMeta: { tools: toolResults.map(r => ({ tool: r.tool, success: r.success })) }
        } : undefined,
        createdAt: Date.now(),
      };
      appendMessage(assistantMsg);
      
      // Log the chat interaction
      if (user) {
        logChatMessage(user.id, userMsg.content, finalContent);
      }
    } catch (e: any) {
      // Log the chat interaction
      if (user) {
        logChatMessage(user.id, userMsg.content, finalContent);
      }
    } catch (e: any) {
      showError(e.message || "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const onSearch = async () => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);
    
    try {
      const results = await searchWeb(input.trim());
      const citations = results.map((r) => ({ title: r.title, url: r.url }));
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Here are some findings on "${input.trim()}":\n\n${results.map((r, i) => `${i + 1}. **${r.title}**\n${r.snippet || ''}`).join('\n\n')}`,
        citations,
        toolCall: { type: "search", input: input.trim(), outputMeta: { count: results.length } },
        createdAt: Date.now(),
      };
      appendMessage(assistantMsg);
      setInput("");
      showSuccess("Search completed");
    } catch (e: any) {
      showError(e.message || "Search failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-4xl">
        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-bold text-white">
              Chat with Echo
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearConversation}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Clear
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[58vh] rounded-lg border border-slate-700 bg-slate-900/50 p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col h-full">
                  <div className="flex flex-col items-center justify-center flex-1 text-center">
                    <div className="text-4xl mb-4">👋</div>
                    <p className="text-lg text-white mb-2">Hello! I'm Echo, your AI assistant.</p>
                    <p className="text-sm text-slate-400 max-w-md mb-4">
                      I can help you search the web, create reminders, manage tasks, take notes, and schedule calendar events. Just ask!
                    </p>
                  </div>
                  <ChatTips onPromptClick={(prompt) => setInput(prompt)} />
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`mb-4 max-w-[85%] rounded-2xl px-4 py-3 ${
                      m.role === "user"
                        ? "ml-auto bg-fuchsia-600/40 text-white"
                        : "bg-slate-800 text-slate-100 border border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{m.role.toUpperCase()}</span>
                      <span>•</span>
                      <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                      {m.toolCall && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-fuchsia-300">
                            <Wrench className="h-3 w-3" />
                            {m.toolCall.type}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="mt-1 whitespace-pre-wrap">{m.content}</div>
                    {m.citations && m.citations.length > 0 && (
                      <>
                        <Separator className="my-2 bg-slate-600" />
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-slate-300">Sources</div>
                          {m.citations.map((c, idx) => (
                            <a
                              key={idx}
                              href={c.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-xs text-fuchsia-300 hover:underline truncate"
                            >
                              {c.title}
                            </a>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex items-center gap-2 text-slate-400 mb-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Echo is thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </ScrollArea>
            <div className="mt-3 flex gap-2">
              <Input
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                placeholder="Ask Echo anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <Button 
                onClick={onSend} 
                className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
              <Button 
                variant="secondary" 
                onClick={onSearch} 
                className="border-slate-600 bg-slate-800 text-white hover:bg-slate-700"
                disabled={isLoading || !input.trim()}
              >
                <Search className="mr-2 h-4 w-4" /> Search
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Press Enter to send • Echo can create reminders, tasks, notes, and calendar events
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}