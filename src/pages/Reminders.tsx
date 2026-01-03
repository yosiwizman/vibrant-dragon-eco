import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Bell, Clock, Check, X, Mic } from "lucide-react";
import VoiceHint from "@/components/VoiceHint";
import { format } from "date-fns";

interface Reminder {
  id: string;
  text: string;
  due_time: string;
  channel: string;
  status: string;
  created_at: string;
}

export default function Reminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newChannel, setNewChannel] = useState("push");

  useEffect(() => {
    if (user) loadReminders();
  }, [user]);

  const loadReminders = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .order("due_time", { ascending: true });

    if (error) {
      showError("Failed to load reminders");
    } else {
      setReminders(data || []);
    }
    setLoading(false);
  };

  const addReminder = async () => {
    if (!user || !newText.trim() || !newTime) return;

    const { data, error } = await supabase.from("reminders").insert({
      user_id: user.id,
      text: newText.trim(),
      due_time: new Date(newTime).toISOString(),
      channel: newChannel,
      status: "pending",
    }).select().single();

    if (error) {
      showError("Failed to create reminder");
    } else {
      setReminders([...reminders, data].sort((a, b) => 
        new Date(a.due_time).getTime() - new Date(b.due_time).getTime()
      ));
      setNewText("");
      setNewTime("");
      showSuccess("Reminder created!");
    }
  };

  const dismissReminder = async (id: string) => {
    const { error } = await supabase
      .from("reminders")
      .update({ status: "dismissed" })
      .eq("id", id);

    if (error) {
      showError("Failed to dismiss reminder");
    } else {
      setReminders(reminders.map(r => r.id === id ? { ...r, status: "dismissed" } : r));
    }
  };

  const deleteReminder = async (id: string) => {
    const { error } = await supabase.from("reminders").delete().eq("id", id);

    if (error) {
      showError("Failed to delete reminder");
    } else {
      setReminders(reminders.filter(r => r.id !== id));
      showSuccess("Reminder deleted");
    }
  };

  const getStatusColor = (status: string, dueTime: string) => {
    if (status === "dismissed") return "bg-slate-500/20 text-slate-400";
    if (status === "sent") return "bg-green-500/20 text-green-300";
    if (new Date(dueTime) < new Date()) return "bg-red-500/20 text-red-300";
    return "bg-yellow-500/20 text-yellow-300";
  };

  const pendingReminders = reminders.filter(r => r.status === "pending");
  const pastReminders = reminders.filter(r => r.status !== "pending");

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Bell className="h-8 w-8 text-yellow-400" />
            Reminders
          </h1>
          <p className="text-slate-400 mt-1">
            {pendingReminders.length} pending reminders
          </p>
          <VoiceHint
            commands={["Remind me to call mom at 5pm", "Read my reminders", "Dismiss first reminder"]}
            className="mt-2"
          />
        </div>

        {/* Add Reminder */}
        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <Input
                placeholder="Remind me to..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 flex-1 min-w-[200px]"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
              />
              <Input
                type="datetime-local"
                className="bg-slate-800 border-slate-700 text-white w-48"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
              <Select value={newChannel} onValueChange={setNewChannel}>
                <SelectTrigger className="w-28 bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="push" className="text-white">Push</SelectItem>
                  <SelectItem value="email" className="text-white">Email</SelectItem>
                  <SelectItem value="sms" className="text-white">SMS</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addReminder} className="bg-fuchsia-600 text-white hover:bg-fuchsia-500">
                <Plus className="h-4 w-4 mr-2" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pending Reminders */}
        {pendingReminders.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">Upcoming</h2>
            <div className="space-y-2">
              {pendingReminders.map((reminder) => (
                <Card key={reminder.id} className="border-fuchsia-500/20 bg-black/30 backdrop-blur">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Bell className="h-5 w-5 text-yellow-400" />
                      <div className="flex-1">
                        <p className="text-white">{reminder.text}</p>
                        <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(reminder.due_time), "PPp")}
                        </p>
                      </div>
                      <Badge className={getStatusColor(reminder.status, reminder.due_time)}>
                        {new Date(reminder.due_time) < new Date() ? "Overdue" : "Pending"}
                      </Badge>
                      <Badge variant="outline" className="border-slate-600 text-slate-400">
                        {reminder.channel}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissReminder(reminder.id)}
                        className="text-slate-400 hover:text-green-400"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteReminder(reminder.id)}
                        className="text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Past Reminders */}
        {pastReminders.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-400 mb-3">Past</h2>
            <div className="space-y-2 opacity-60">
              {pastReminders.map((reminder) => (
                <Card key={reminder.id} className="border-slate-700 bg-slate-800/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Bell className="h-5 w-5 text-slate-500" />
                      <div className="flex-1">
                        <p className="text-slate-400">{reminder.text}</p>
                        <p className="text-sm text-slate-500">
                          {format(new Date(reminder.due_time), "PPp")}
                        </p>
                      </div>
                      <Badge className="bg-slate-600/20 text-slate-400">
                        {reminder.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteReminder(reminder.id)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {reminders.length === 0 && !loading && (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="p-8 text-center text-slate-400">
              No reminders yet. Add one above!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}