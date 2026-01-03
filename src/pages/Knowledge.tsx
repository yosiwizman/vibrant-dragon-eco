import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tags, Plus, Trash2 } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import type { KnowledgeItem } from "../state/knowledge";
import { addKnowledge, loadKnowledge, removeKnowledge, searchKnowledge } from "../state/knowledge";

export default function Knowledge() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [q, setQ] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    setItems(loadKnowledge());
  }, []);

  const results = useMemo(() => (q ? searchKnowledge(q) : items), [items, q]);

  const onAdd = () => {
    if (!title.trim() || !content.trim()) {
      showError("Please add a title and content.");
      return;
    }
    const item: KnowledgeItem = {
      id: crypto.randomUUID(),
      title: title.trim(),
      content: content.trim(),
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      createdAt: Date.now(),
    };
    const newItems = addKnowledge(item);
    setItems(newItems);
    setTitle("");
    setContent("");
    setTags("");
    showSuccess("Added to Knowledge.");
  };

  const onDelete = (id: string) => {
    const newItems = removeKnowledge(id);
    setItems(newItems);
  };

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      <Card className="border-white/10 bg-white/5 backdrop-blur">
        <CardHeader>
          <CardTitle className="bg-gradient-to-r from-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
            Knowledge
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-1">
              <Label>Title</Label>
              <Input
                placeholder="e.g., Project principles"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="md:col-span-1">
              <Label>Tags (comma-separated)</Label>
              <Input
                placeholder="personal, work"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
            <div className="md:col-span-1 flex items-end">
              <Button onClick={onAdd} className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Add
              </Button>
            </div>
            <div className="md:col-span-3">
              <Label>Content</Label>
              <textarea
                className="w-full rounded-md border bg-transparent p-2 text-sm outline-none"
                placeholder="Write a short fact, instruction, or note your assistant should remember..."
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          </div>
          <Separator className="my-2 bg-white/10" />
          <div className="grid gap-2 md:grid-cols-3">
            <div className="md:col-span-2">
              <Input
                placeholder="Search your knowledge..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="md:col-span-1 flex items-center text-xs text-white/60">
              <Tags className="mr-2 h-4 w-4" /> Tip: tag items to find them faster.
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {results.length === 0 ? (
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardContent className="p-6 text-sm text-white/70">
              Your Knowledge is empty. Add a few facts to personalize Echo.
            </CardContent>
          </Card>
        ) : (
          results.map((k) => (
            <Card key={k.id} className="border-white/10 bg-white/5 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white/90">{k.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-white/80 whitespace-pre-wrap">{k.content}</p>
                {k.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {k.tags.map((t) => (
                      <span key={t} className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/80">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>{new Date(k.createdAt).toLocaleString()}</span>
                  <Button variant="destructive" size="sm" onClick={() => onDelete(k.id)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}