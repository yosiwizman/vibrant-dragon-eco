"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit,
  Pin,
  PinOff,
  Tag,
  X
} from "lucide-react";
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

export default function NotesWidget() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form fields
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

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
      .order("updated_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Failed to load notes:", error);
    } else {
      setNotes(data || []);
    }
    setLoading(false);
  };

  const openNewNote = () => {
    setEditingNote(null);
    setNewTitle("");
    setNewContent("");
    setNewTags([]);
    setTagInput("");
    setIsDialogOpen(true);
  };

  const startEditNote = (note: Note) => {
    setEditingNote(note);
    setNewTitle(note.title);
    setNewContent(note.content);
    setNewTags(note.tags || []);
    setTagInput("");
    setIsDialogOpen(true);
  };

  const createNote = async () => {
    if (!user || !newTitle.trim()) {
      showError("Please enter a note title");
      return;
    }

    const { error } = await supabase.from("notes").insert({
      user_id: user.id,
      title: newTitle.trim(),
      content: newContent.trim(),
      tags: newTags.length > 0 ? newTags : null,
      pinned: false,
    });

    if (error) {
      showError("Failed to create note");
    } else {
      await loadNotes();
      resetForm();
      showSuccess("Note created!");
    }
  };

  const updateNote = async () => {
    if (!editingNote || !newTitle.trim()) {
      showError("Please enter a note title");
      return;
    }

    const updates = {
      title: newTitle.trim(),
      content: newContent.trim(),
      tags: newTags.length > 0 ? newTags : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("notes")
      .update(updates)
      .eq("id", editingNote.id);

    if (error) {
      showError("Failed to update note");
    } else {
      await loadNotes();
      resetForm();
      showSuccess("Note updated!");
    }
  };

  const togglePin = async (note: Note) => {
    const { error } = await supabase
      .from("notes")
      .update({ pinned: !note.pinned })
      .eq("id", note.id);

    if (error) {
      showError("Failed to update note");
    } else {
      await loadNotes();
      showSuccess(note.pinned ? "Note unpinned" : "Note pinned!");
    }
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", id);

    if (error) {
      showError("Failed to delete note");
    } else {
      await loadNotes();
      showSuccess("Note deleted");
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !newTags.includes(tag)) {
      setNewTags([...newTags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewTags(newTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const resetForm = () => {
    setNewTitle("");
    setNewContent("");
    setNewTags([]);
    setTagInput("");
    setEditingNote(null);
    setIsDialogOpen(false);
  };

  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      note.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  if (loading) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
        <CardHeader className="p-3 pb-2 shrink-0">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-orange-400" />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 flex-1 min-h-0 flex items-center justify-center">
          <div className="animate-pulse text-slate-400 text-xs">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
        <CardHeader className="p-3 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-orange-400" />
              Notes
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={openNewNote}
              className="h-6 w-6 p-0 text-orange-400 hover:text-orange-300"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0 flex-1 min-h-0 flex flex-col gap-2">
          {/* Search */}
          <Input
            placeholder="Search notes..."
            className="h-7 text-xs bg-slate-900/50 border-slate-700 text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Notes List */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-2">
            {filteredNotes.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center py-4">
                {searchQuery ? "No notes found" : "No notes yet"}
              </p>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50 space-y-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        {note.pinned && (
                          <Pin className="h-3 w-3 text-orange-400 shrink-0" />
                        )}
                        <p className="text-xs text-white font-medium line-clamp-1">
                          {note.title}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                        {note.content || "No content"}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePin(note)}
                        className="h-5 w-5 p-0 text-slate-400 hover:text-orange-400"
                      >
                        {note.pinned ? (
                          <PinOff className="h-3 w-3" />
                        ) : (
                          <Pin className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditNote(note)}
                        className="h-5 w-5 p-0 text-slate-400 hover:text-blue-400"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNote(note.id)}
                        className="h-5 w-5 p-0 text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {note.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-[9px] px-1.5 py-0 h-4 border-orange-400/30 text-orange-400"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className="text-[9px] text-slate-600">
                    {format(new Date(note.updated_at), "MMM d, h:mm a")}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Note Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingNote ? "Edit Note" : "New Note"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Title *</label>
              <Input
                placeholder="Note title"
                className="bg-slate-800 border-slate-700 text-white"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Content</label>
              <Textarea
                placeholder="Write your note here..."
                className="bg-slate-800 border-slate-700 text-white resize-none"
                rows={6}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Tags</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  className="bg-slate-800 border-slate-700 text-white"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                />
                <Button
                  type="button"
                  onClick={addTag}
                  className="bg-orange-600 text-white hover:bg-orange-500"
                >
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
              {newTags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  {newTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs border-orange-400/30 text-orange-400 flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-orange-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={resetForm}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={editingNote ? updateNote : createNote}
                className="bg-orange-600 text-white hover:bg-orange-500"
              >
                {editingNote ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}