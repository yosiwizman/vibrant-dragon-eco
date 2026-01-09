"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { 
  Bell, 
  Plus, 
  Trash2, 
  Edit,
  Clock,
  CheckCircle2,
  Circle,
  Repeat
} from "lucide-react";
import { format, isToday, isTomorrow, isPast, parseISO, isFuture } from "date-fns";

interface Reminder {
  id: string;
  text: string;
  due_time: string;
  channel: string;
  status: string;
  recurrence_rule?: string;
  recurrence_end_date?: string;
  created_at: string;
}

export default function RemindersWidget() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  
  // Form fields
  const [newText, setNewText] = useState("");
  const [newDueTime, setNewDueTime] = useState("");
  const [newChannel, setNewChannel] = useState("sms");
  const [newRecurrence, setNewRecurrence] = useState("none");

  useEffect(() => {
    let isMounted = true;
    
    const load = async () => {
      if (!user || !isMounted) return;
      setLoading(true);
      
      const status = showCompleted ? "completed" : "pending";
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", status)
        .order("due_time", { ascending: true })
        .limit(10);

      if (!isMounted) return;

      if (error) {
        console.error("Failed to load reminders:", error);
      } else {
        setReminders(data || []);
      }
      setLoading(false);
    };
    
    load();
    
    return () => {
      isMounted = false;
    };
  }, [user?.id, showCompleted]);

  const loadReminders = async () => {
    if (!user) return;
    
    const status = showCompleted ? "completed" : "pending";
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", status)
      .order("due_time", { ascending: true })
      .limit(10);

    if (error) {
      console.error("Failed to load reminders:", error);
    } else {
      setReminders(data || []);
    }
    setLoading(false);
  };

  const openNewReminder = () => {
    setEditingReminder(null);
    setNewText("");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    setNewDueTime(tomorrow.toISOString().slice(0, 16));
    setNewChannel("sms");
    setNewRecurrence("none");
    setIsDialogOpen(true);
  };

  const startEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setNewText(reminder.text);
    setNewDueTime(reminder.due_time.slice(0, 16));
    setNewChannel(reminder.channel);
    setNewRecurrence(reminder.recurrence_rule || "none");
    setIsDialogOpen(true);
  };

  const createReminder = async () => {
    if (!user || !newText.trim() || !newDueTime) {
      showError("Please fill in all required fields");
      return;
    }

    const reminderData: any = {
      user_id: user.id,
      text: newText.trim(),
      due_time: new Date(newDueTime).toISOString(),
      channel: newChannel,
      status: "pending",
    };

    if (newRecurrence !== "none") {
      reminderData.recurrence_rule = newRecurrence;
    }

    const { error } = await supabase.from("reminders").insert(reminderData);

    if (error) {
      showError("Failed to create reminder");
    } else {
      await loadReminders();
      resetForm();
      showSuccess("Reminder created!");
    }
  };

  const updateReminder = async () => {
    if (!editingReminder || !newText.trim() || !newDueTime) {
      showError("Please fill in all required fields");
      return;
    }

    const updates: any = {
      text: newText.trim(),
      due_time: new Date(newDueTime).toISOString(),
      channel: newChannel,
    };

    if (newRecurrence !== "none") {
      updates.recurrence_rule = newRecurrence;
    } else {
      updates.recurrence_rule = null;
    }

    const { error } = await supabase
      .from("reminders")
      .update(updates)
      .eq("id", editingReminder.id);

    if (error) {
      showError("Failed to update reminder");
    } else {
      await loadReminders();
      resetForm();
      showSuccess("Reminder updated!");
    }
  };

  const toggleReminderStatus = async (reminder: Reminder) => {
    const newStatus = reminder.status === "pending" ? "completed" : "pending";

    const { error } = await supabase
      .from("reminders")
      .update({ status: newStatus })
      .eq("id", reminder.id);

    if (error) {
      showError("Failed to update reminder");
    } else {
      await loadReminders();
      showSuccess(newStatus === "completed" ? "Reminder completed!" : "Reminder reopened");
    }
  };

  const deleteReminder = async (id: string) => {
    const { error } = await supabase
      .from("reminders")
      .delete()
      .eq("id", id);

    if (error) {
      showError("Failed to delete reminder");
    } else {
      await loadReminders();
      showSuccess("Reminder deleted");
    }
  };

  const resetForm = () => {
    setNewText("");
    setNewDueTime("");
    setNewChannel("sms");
    setNewRecurrence("none");
    setEditingReminder(null);
    setIsDialogOpen(false);
  };

  const formatDueTime = (timeString: string) => {
    const date = parseISO(timeString);
    if (isToday(date)) return `Today ${format(date, "h:mm a")}`;
    if (isTomorrow(date)) return `Tomorrow ${format(date, "h:mm a")}`;
    if (isPast(date)) return `Overdue - ${format(date, "MMM d, h:mm a")}`;
    return format(date, "MMM d, h:mm a");
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case "sms": return "text-blue-400 bg-blue-500/10";
      case "email": return "text-purple-400 bg-purple-500/10";
      case "push": return "text-green-400 bg-green-500/10";
      default: return "text-slate-400 bg-slate-500/10";
    }
  };

  const getChannelIcon = (channel: string) => {
    return channel.toUpperCase();
  };

  if (loading) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
        <CardHeader className="p-3 pb-2 shrink-0">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Bell className="h-4 w-4 text-yellow-400" />
            Reminders
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
              <Bell className="h-4 w-4 text-yellow-400" />
              Reminders
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowCompleted(!showCompleted)}
                className="h-6 px-2 text-[10px] text-slate-400 hover:text-white"
              >
                {showCompleted ? "Pending" : "Done"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={openNewReminder}
                className="h-6 w-6 p-0 text-yellow-400 hover:text-yellow-300"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0 flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-2">
          {reminders.length === 0 ? (
            <p className="text-[10px] text-slate-500 text-center py-4">
              {showCompleted ? "No completed reminders" : "No pending reminders"}
            </p>
          ) : (
            reminders.map((reminder) => {
              const dueTime = formatDueTime(reminder.due_time);
              const isOverdue = isPast(parseISO(reminder.due_time)) && reminder.status === "pending";
              const isRecurring = !!reminder.recurrence_rule;
              
              return (
                <div
                  key={reminder.id}
                  className={`p-2 rounded-lg border transition-all ${
                    reminder.status === "completed"
                      ? "bg-slate-900/30 border-slate-700/30 opacity-60"
                      : "bg-slate-900/50 border-slate-700/50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => toggleReminderStatus(reminder)}
                      className="mt-0.5 shrink-0 text-slate-400 hover:text-yellow-400 transition-colors"
                    >
                      {reminder.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-yellow-400" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs text-white font-medium line-clamp-2 ${
                        reminder.status === "completed" ? "line-through opacity-60" : ""
                      }`}>
                        {reminder.text}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${getChannelColor(reminder.channel)}`}>
                          {getChannelIcon(reminder.channel)}
                        </span>
                        
                        <span className={`text-[10px] flex items-center gap-1 ${
                          isOverdue ? "text-red-400" : "text-slate-500"
                        }`}>
                          <Clock className="h-3 w-3" />
                          {dueTime}
                        </span>

                        {isRecurring && (
                          <span className="text-[10px] text-purple-400 flex items-center gap-1">
                            <Repeat className="h-3 w-3" />
                            {reminder.recurrence_rule}
                          </span>
                        )}
                      </div>
                    </div>

                    {reminder.status === "pending" && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditReminder(reminder)}
                          className="h-5 w-5 p-0 text-slate-400 hover:text-blue-400"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteReminder(reminder.id)}
                          className="h-5 w-5 p-0 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Reminder Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md" aria-describedby="reminder-dialog-description">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingReminder ? "Edit Reminder" : "New Reminder"}
            </DialogTitle>
            <p id="reminder-dialog-description" className="sr-only">
              {editingReminder ? "Edit reminder details including text, time, channel, and recurrence" : "Create a new reminder with text, time, channel, and recurrence options"}
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Reminder Text *</label>
              <Input
                placeholder="What do you want to be reminded about?"
                className="bg-slate-800 border-slate-700 text-white"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">When *</label>
              <Input
                type="datetime-local"
                className="bg-slate-800 border-slate-700 text-white"
                value={newDueTime}
                onChange={(e) => setNewDueTime(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Channel</label>
                <Select value={newChannel} onValueChange={setNewChannel}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="sms" className="text-white">SMS</SelectItem>
                    <SelectItem value="email" className="text-white">Email</SelectItem>
                    <SelectItem value="push" className="text-white">Push</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Repeat</label>
                <Select value={newRecurrence} onValueChange={setNewRecurrence}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="none" className="text-white">None</SelectItem>
                    <SelectItem value="daily" className="text-white">Daily</SelectItem>
                    <SelectItem value="weekly" className="text-white">Weekly</SelectItem>
                    <SelectItem value="monthly" className="text-white">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                onClick={editingReminder ? updateReminder : createReminder}
                className="bg-yellow-600 text-white hover:bg-yellow-500"
              >
                {editingReminder ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}