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
    <div className="mx-auto max-w-5xl p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[50vh] rounded border p-3">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Say hello to Echo. Your messages will not be saved in Private Mode.
              </p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="mb-4">
                  <div className="text-xs text-muted-foreground">
                    {m.role.toUpperCase()} • {new Date(m.createdAt).toLocaleTimeString()}
                  </div>
                  <div className="mt-1 whitespace-pre-wrap">{m.content}</div>
                  {m.citations && m.citations.length > 0 && (
                    <>
                      <Separator className="my-2" />
                      <div className="space-y-1">
                        <div className="text-xs font-semibold">Citations</div>
                        {m.citations.map((c) => (
                          <a
                            key={c.url}
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-blue-600 hover:underline"
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
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button onClick={onSend}>Send</Button>
            <Button variant="secondary" onClick={onSearch}>
              <Search className="mr-2 h-4 w-4" /> Use Web Search
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}