"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/utils/toast";
import { 
  CheckSquare, 
  Bell, 
  FileText, 
  Calendar,
  Plus,
  Loader2,
  X
} from "lucide-react";
import { format, addHours, addDays, setHours, setMinutes } from "date-fns";

const STORAGE_KEY = "echo:quick-add-open";

export function useQuickAdd() {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<"task" | "reminder" | "note" | "event">("task");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with Cmd/Ctrl + N
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        const target = e.target as HTMLElement;
        if (
          target.tagName !== "INPUT" &&
          target.tagName !== "TEXTAREA" &&
          !target.isContentEditable
        ) {
          e.preventDefault();
          setIsOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const open = (tab?: "task" | "reminder" | "note" | "event") => {
    if (tab) setDefaultTab(tab);
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

  return { isOpen, open, close, defaultTab };
}

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: "task" | "reminder" | "note" | "event";
}

export default function QuickAddModal({ open, onClose, defaultTab = "task" }: QuickAddModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Task state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDueDate, setTaskDueDate] = useState("");

  // Reminder state
  const [reminderText, setReminderText] = useState("");
  const [reminderTime, setReminderTime] = useState("");

  // Note state
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  // Event state
  const [eventTitle, setEventTitle] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [eventLocation, setEventLocation] = useState("");

  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
      // Set default times
      const now = new Date();
      const inOneHour = addHours(now, 1);
      const roundedHour = setMinutes(setHours(inOneHour, inOneHour.getHours()), 0);
      setReminderTime(format(roundedHour, "yyyy-MM-dd'T'HH:mm"));
      setEventStart(format(roundedHour, "yyyy-MM-dd'T'HH:mm"));
      setEventEnd(format(addHours(roundedHour, 1), "yyyy-MM-dd'T'HH:mm"));
      setTaskDueDate(format(addDays(now, 1), "yyyy-MM-dd"));
    }
  }, [open, defaultTab]);

  const resetForm = () => {
    setTaskTitle("");
    setTaskPriority("medium");
    setTaskDueDate("");
    setReminderText("");
    setReminderTime("");
    setNoteTitle("");
    setNoteContent("");
    setEventTitle("");
    setEventStart("");
    setEventEnd("");
    setEventLocation("");
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      switch (activeTab) {
        case "task":
          if (!taskTitle.trim()) {
            showError("Please enter a task title");
            return;
          }
          await supabase.from("tasks").insert({
            user_id: user.id,
            title: taskTitle.trim(),
            priority: taskPriority,
            status: "pending",
            due_date: taskDueDate || null,
          });
          showSuccess("Task created!");
          break;

        case "reminder":
          if (!reminderText.trim() || !reminderTime) {
            showError("Please enter reminder text and time");
            return;
          }
          await supabase.from("reminders").insert({
            user_id: user.id,
            text: reminderText.trim(),
            due_time: new Date(reminderTime).toISOString(),
            channel: "push",
            status: "pending",
          });
          showSuccess("Reminder set!");
          break;

        case "note":
          if (!noteTitle.trim()) {
            showError("Please enter a note title");
            return;
          }
          await supabase.from("notes").insert({
            user_id: user.id,
            title: noteTitle.trim(),
            content: noteContent,
          });
          showSuccess("Note saved!");
          break;

        case "event":
          if (!eventTitle.trim() || !eventStart || !eventEnd) {
            showError("Please fill in all required fields");
            return;
          }
          await supabase.from("calendar_events").insert({
            user_id: user.id,
            title: eventTitle.trim(),
            start_time: new Date(eventStart).toISOString(),
            end_time: new Date(eventEnd).toISOString(),
            location: eventLocation || null,
          });
          showSuccess("Event created!");
          break;
      }

      resetForm();
      onClose();
    } catch (error) {
      showError("Failed to create item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-md" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-fuchsia-400" />
            Quick Add
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid grid-cols-4 bg-slate-800">
            <TabsTrigger value="task" className="data-[state=active]:bg-fuchsia-600">
              <CheckSquare className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="reminder" className="data-[state=active]:bg-fuchsia-600">
              <Bell className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="note" className="data-[state=active]:bg-fuchsia-600">
              <FileText className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="event" className="data-[state=active]:bg-fuchsia-600">
              <Calendar className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          {/* Task Tab */}
          <TabsContent value="task" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Task Title</Label>
              <Input
                placeholder="What needs to be done?"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-300">Priority</Label>
                <Select value={taskPriority} onValueChange={setTaskPriority}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="low" className="text-green-300">Low</SelectItem>
                    <SelectItem value="medium" className="text-yellow-300">Medium</SelectItem>
                    <SelectItem value="high" className="text-orange-300">High</SelectItem>
                    <SelectItem value="urgent" className="text-red-300">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Due Date</Label>
                <Input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
          </TabsContent>

          {/* Reminder Tab */}
          <TabsContent value="reminder" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Reminder</Label>
              <Input
                placeholder="What should I remind you about?"
                value={reminderText}
                onChange={(e) => setReminderText(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">When</Label>
              <Input
                type="datetime-local"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className="cursor-pointer border-slate-600 hover:bg-slate-800"
                onClick={() => {
                  const inOneHour = addHours(new Date(), 1);
                  setReminderTime(format(inOneHour, "yyyy-MM-dd'T'HH:mm"));
                }}
              >
                In 1 hour
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer border-slate-600 hover:bg-slate-800"
                onClick={() => {
                  const tomorrow = addDays(new Date(), 1);
                  const at9am = setMinutes(setHours(tomorrow, 9), 0);
                  setReminderTime(format(at9am, "yyyy-MM-dd'T'HH:mm"));
                }}
              >
                Tomorrow 9am
              </Badge>
            </div>
          </TabsContent>

          {/* Note Tab */}
          <TabsContent value="note" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Title</Label>
              <Input
                placeholder="Note title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Content</Label>
              <Textarea
                placeholder="Write your note..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
              />
            </div>
          </TabsContent>

          {/* Event Tab */}
          <TabsContent value="event" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Event Title</Label>
              <Input
                placeholder="What's happening?"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-300">Start</Label>
                <Input
                  type="datetime-local"
                  value={eventStart}
                  onChange={(e) => setEventStart(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">End</Label>
                <Input
                  type="datetime-local"
                  value={eventEnd}
                  onChange={(e) => setEventEnd(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Location (optional)</Label>
              <Input
                placeholder="Where?"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center mt-4">
          <p className="text-xs text-slate-500">
            Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">⌘</kbd>+<kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">Enter</kbd> to save
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}