import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, FileText, Pin, Search, Edit } from "lucide-react";
import { format } from "date-fns";

interface Note {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export default function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");

  useEffect(() => {
    if (user) loadNotes();
  }, [user]);

  const loadNotes = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) {
      showError("Failed to load notes");
    } else {
      setNotes(data || []);
    }
    setLoading(false);
  };

  const saveNote = async () => {
    if (!user || !newTitle.trim() || !newContent.trim()) return;

    const tags = newTags.split(",").map(t => t.trim()).filter(Boolean);

    if (editingNote) {
      const { error } = await supabase
        .from("notes")
        .update({
          title: newTitle.trim(),
          content: newContent.trim(),
          tags,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingNote.id);

      if (error) {
        showError("Failed to update note");
      } else {
        loadNotes();
        showSuccess("Note updated!");
      }
    } else {
      const { error } = await supabase.from("notes").insert({
        user_id: user.id,
        title: newTitle.trim(),
        content: newContent.trim(),
        tags,
        pinned: false,
      });

      if (error) {
        showError("Failed to create note");
      } else {
        loadNotes();
        showSuccess("Note created!");
      }
    }

    resetForm();
  };

  const resetForm = () => {
    setNewTitle("");
    setNewContent("");
    setNewTags("");
    setEditingNote(null);
    setIsDialogOpen(false);
  };

  const editNote = (note: Note) => {
    setEditingNote(note);
    setNewTitle(note.title);
    setNewContent(note.content);
    setNewTags(note.tags?.join(", ") || "");
    setIsDialogOpen(true);
  };

  const togglePin = async (note: Note) => {
    const { error } = await supabase
      .from("notes")
      .update({ pinned: !note.pinned })
      .eq("id", note.id);

    if (error) {
      showError("Failed to update note");
    } else {
      setNotes(notes.map(n => n.id === note.id ? { ...n, pinned: !n.pinned } : n));
    }
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from("notes").delete().eq("id", id);

    if (error) {
      showError("Failed to delete note");
    } else {
      setNotes(notes.filter(n => n.id !== id));
      showSuccess("Note deleted");
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FileText className="h-8 w-8 text-purple-400" />
              Notes
            </h1>
            <p className="text-slate-400 mt-1">{notes.length} notes</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-fuchsia-600 text-white hover:bg-fuchsia-500" onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" /> New Note
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingNote ? "Edit Note" : "New Note"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Title"
                  className="bg-slate-800 border-slate-700 text-white"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Write your note..."
                  className="bg-slate-800 border-slate-700 text-white min-h-[200px]"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                />
                <Input
                  placeholder="Tags (comma-separated)"
                  className="bg-slate-800 border-slate-700 text-white"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetForm} className="border-slate-600 text-slate-300">
                    Cancel
                  </Button>
                  <Button onClick={saveNote} className="bg-fuchsia-600 text-white hover:bg-fuchsia-500">
                    {editingNote ? "Update" : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search notes..."
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Notes Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className={`border-fuchsia-500/20 bg-black/30 backdrop-blur hover:border-fuchsia-500/40 transition-colors ${
                note.pinned ? "ring-1 ring-yellow-500/50" : ""
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-white text-lg">{note.title}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePin(note)}
                      className={note.pinned ? "text-yellow-400" : "text-slate-400 hover:text-yellow-400"}
                    >
                      <Pin className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editNote(note)}
                      className="text-slate-400 hover:text-fuchsia-400"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNote(note.id)}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm line-clamp-4 whitespace-pre-wrap">
                  {note.content}
                </p>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {note.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="border-fuchsia-500/50 text-fuchsia-300 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-3">
                  {format(new Date(note.updated_at), "MMM d, yyyy")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredNotes.length === 0 && !loading && (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="p-8 text-center text-slate-400">
              {searchQuery ? "No notes match your search." : "No notes yet. Create one!"}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}