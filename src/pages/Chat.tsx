import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { usePreferences } from "@/state/preferences";
import type { Message, Conversation, Citation } from "@/types/models";
import { chat } from "@/services/brain";
import { searchWeb } from "@/services/search";

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
  const [conversation, setConversation] = useState<Conversation | null>(
    loadConversation()
  );
  const [input, setInput] = useState("");
  const messages = useMemo<Message[]>(
    () => conversation?.messages ?? [],
    [conversation]
  );

  useEffect(() => {
    if (!preferences.privateMode && conversation) {
      saveConversation(conversation);
    }
  }, [conversation, preferences.privateMode]);

  const appendMessage = (msg: Message) => {
    setConversation((prev) => {
      const base: Conversation =
        prev ?? { id: "default", createdAt: Date.now(), title: "Echo", messages: [] };
      const next = { ...base, messages: [...base.messages, msg] };
      return next;
    });
  };

  const onSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      createdAt: Date.now(),
    };
    appendMessage(userMsg);
    setInput("");

    try {
      const res = await chat(preferences.baseUrl, {
        messages: messages.concat(userMsg).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }, preferences.authToken);
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: res.content,
        citations: res.citations as Citation[] | undefined,
        createdAt: Date.now(),
      };
      appendMessage(assistantMsg);
    } catch (e: any) {
      showError(e.message || "Failed to send message");
    }
  };

  const onSearch = async () => {
    if (!input.trim()) return;
    try {
      const results = await searchWeb(input.trim());
      const citations = results.map((r) => ({ title: r.title, url: r.url }));
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Here are some findings on "${input.trim()}":`,
        citations,
        toolCall: { type: "search", input: input.trim(), outputMeta: { count: results.length } },
        createdAt: Date.now(),
      };
      appendMessage(assistantMsg);
      showSuccess("Search completed");
    } catch (e: any) {
      showError(e.message || "Search failed");
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4">
      <Card className="border-white/10 bg-white/5 backdrop-blur">
        <CardHeader>
          <CardTitle className="bg-gradient-to-r from-fuchsia-300 to-blue-300 bg-clip-text text-transparent">
            Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[58vh] rounded border border-white/10 p-3">
            {messages.length === 0 ? (
              <p className="text-sm text-white/70">
                Say hello to Echo. Your messages will not be saved in Private Mode.
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`mb-4 max-w-[85%] rounded-2xl px-4 py-3 backdrop-blur ${
                    m.role === "user"
                      ? "ml-auto bg-white/15 text-white"
                      : "bg-black/30 text-white border border-white/10"
                  }`}
                >
                  <div className="text-[10px] opacity-60">
                    {m.role.toUpperCase()} • {new Date(m.createdAt).toLocaleTimeString()}
                  </div>
                  <div className="mt-1 whitespace-pre-wrap">{m.content}</div>
                  {m.citations && m.citations.length > 0 && (
                    <>
                      <Separator className="my-2 bg-white/10" />
                      <div className="space-y-1">
                        <div className="text-xs font-semibold opacity-80">Citations</div>
                        {m.citations.map((c) => (
                          <a
                            key={c.url}
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-blue-300 hover:underline"
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
          </ScrollArea>
          <div className="mt-3 flex gap-2">
            <Input
              className="bg-black/30 text-white placeholder:text-white/40"
              placeholder="Type to chat…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button onClick={onSend} className="bg-white text-black hover:bg-white/90">Send</Button>
            <Button variant="secondary" onClick={onSearch} className="border-white/20 bg-white/10 text-white hover:bg-white/20">
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}