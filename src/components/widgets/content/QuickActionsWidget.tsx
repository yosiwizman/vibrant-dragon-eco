"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Zap,
  CheckSquare, 
  Bell, 
  FileText, 
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  Plus,
  Clock,
  Loader2,
  Settings
} from "lucide-react";

type ActionType = "task" | "reminder" | "note" | "event" | "call" | "email" | "message";

interface QuickAction {
  type: ActionType;
  icon: any;
  label: string;
  color: string;
  bgColor: string;
  enabled: boolean;
}

interface ActionTemplate {
  id: string;
  type: ActionType;
  title: string;
  description?: string;
}

const DEFAULT_ACTIONS: QuickAction[] = [
  { type: "task", icon: CheckSquare, label: "Task", color: "text-green-400", bgColor: "bg-green-500/10 hover:bg-green-500/20", enabled: true },
  { type: "reminder", icon: Bell, label: "Reminder", color: "text-yellow-400", bgColor: "bg-yellow-500/10 hover:bg-yellow-500/20", enabled: true },
  { type: "note", icon: FileText, label: "Note", color: "text-purple-400", bgColor: "bg-purple-500/10 hover:bg-purple-500/20", enabled: true },
  { type: "event", icon: Calendar, label: "Event", color: "text-blue-400", bgColor: "bg-blue-500/10 hover:bg-blue-500/20", enabled: true },
  { type: "call", icon: Phone, label: "Call", color: "text-cyan-400", bgColor: "bg-cyan-500/10 hover:bg-cyan-500/20", enabled: false },
  { type: "email", icon: Mail, label: "Email", color: "text-orange-400", bgColor: "bg-orange-500/10 hover:bg-orange-500/20", enabled: false },
  { type: "message", icon: MessageSquare, label: "Message", color: "text-pink-400", bgColor: "bg-pink-500/10 hover:bg-pink-500/20", enabled: false },
];

const TASK_TEMPLATES = [
  "Buy groceries",
  "Call dentist",
  "Pay bills",
  "Exercise",
  "Review emails",
];

const REMINDER_TEMPLATES = [
  "Take medication",
  "Drink water",
  "Stand up and stretch",
  "Check calendar",
];

export default function QuickActionsWidget() {
  const { user } = useAuth();
  const [actions, setActions] = useState<QuickAction[]>(DEFAULT_ACTIONS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType>("task");
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [timeValue, setTimeValue] = useState("1");
  const [timeUnit, setTimeUnit] = useState<"minutes" | "hours" | "days">("hours");

  useEffect(() => {
    const saved = localStorage.getItem("quickActions");
    if (saved) {
      try {
        setActions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load quick actions");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("quickActions", JSON.stringify(actions));
  }, [actions]);

  const toggleAction = (type: ActionType) => {
    setActions(actions.map(a => 
      a.type === type ? { ...a, enabled: !a.enabled } : a
    ));
  };

  const handleQuickAction = async () => {
    if (!user || !inputValue.trim()) {
      showError("Please enter a value");
      return;
    }
    setIsSubmitting(true);

    try {
      switch (actionType) {
        case "task":
          await supabase.from("tasks").insert({
            user_id: user.id,
            title: inputValue.trim(),
            priority: "medium",
            status: "pending",
          });
          showSuccess("Task created!");
          break;
          
        case "reminder":
          const dueTime = new Date();
          const timeInMs = parseInt(timeValue) * (
            timeUnit === "minutes" ? 60000 :
            timeUnit === "hours" ? 3600000 :
            86400000
          );
          dueTime.setTime(dueTime.getTime() + timeInMs);
          
          await supabase.from("reminders").insert({
            user_id: user.id,
            text: inputValue.trim(),
            due_time: dueTime.toISOString(),
            channel: "push",
            status: "pending",
          });
          showSuccess(`Reminder set for ${timeValue} ${timeUnit}!`);
          break;
          
        case "note":
          await supabase.from("notes").insert({
            user_id: user.id,
            title: inputValue.trim().substring(0, 50),
            content: inputValue.trim(),
            pinned: false,
          });
          showSuccess("Note saved!");
          break;
          
        case "event":
          const startTime = new Date();
          startTime.setDate(startTime.getDate() + 1);
          startTime.setHours(10, 0, 0, 0);
          const endTime = new Date(startTime);
          endTime.setHours(11, 0, 0, 0);
          await supabase.from("calendar_events").insert({
            user_id: user.id,
            title: inputValue.trim(),
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
          });
          showSuccess("Event created for tomorrow at 10am!");
          break;

        case "call":
          window.location.href = `tel:${inputValue.trim()}`;
          showSuccess("Opening phone...");
          break;

        case "email":
          window.location.href = `mailto:${inputValue.trim()}`;
          showSuccess("Opening email...");
          break;

        case "message":
          window.location.href = `sms:${inputValue.trim()}`;
          showSuccess("Opening messages...");
          break;
      }
      
      setInputValue("");
      setIsDialogOpen(false);
    } catch (error) {
      showError("Failed to create item");
    }
    
    setIsSubmitting(false);
  };

  const useTemplate = (template: string) => {
    setInputValue(template);
    setShowTemplates(false);
  };

  const getPlaceholder = () => {
    switch (actionType) {
      case "task": return "What needs to be done?";
      case "reminder": return "What should I remind you about?";
      case "note": return "What do you want to remember?";
      case "event": return "What's the event?";
      case "call": return "Phone number";
      case "email": return "Email address";
      case "message": return "Phone number";
    }
  };

  const getTemplates = () => {
    switch (actionType) {
      case "task": return TASK_TEMPLATES;
      case "reminder": return REMINDER_TEMPLATES;
      default: return [];
    }
  };

  const enabledActions = actions.filter(a => a.enabled);
  const currentAction = actions.find(a => a.type === actionType);

  return (
    <>
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
        <CardHeader className="p-3 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-fuchsia-400" />
              Quick Actions
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsSettingsOpen(true)}
              className="h-6 w-6 p-0 text-slate-400 hover:text-white"
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0 flex-1 min-h-0 overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-2 gap-2">
            {enabledActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.type}
                  variant="ghost"
                  className={`flex flex-col items-center justify-center gap-1.5 h-20 border border-slate-700 ${action.bgColor}`}
                  onClick={() => {
                    setActionType(action.type);
                    setIsDialogOpen(true);
                  }}
                >
                  <Icon className={`h-5 w-5 ${action.color}`} />
                  <span className="text-xs text-slate-300">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              {currentAction && <currentAction.icon className={`h-5 w-5 ${currentAction.color}`} />}
              Quick {currentAction?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={getPlaceholder()}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuickAction()}
              autoFocus
            />

            {/* Time selector for reminders */}
            {actionType === "reminder" && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <Input
                  type="number"
                  min="1"
                  max="999"
                  className="bg-slate-800 border-slate-700 text-white w-20"
                  value={timeValue}
                  onChange={(e) => setTimeValue(e.target.value)}
                />
                <Select value={timeUnit} onValueChange={(v: any) => setTimeUnit(v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="minutes" className="text-white">Minutes</SelectItem>
                    <SelectItem value="hours" className="text-white">Hours</SelectItem>
                    <SelectItem value="days" className="text-white">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Templates */}
            {getTemplates().length > 0 && (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="text-xs text-slate-400 hover:text-white mb-2"
                >
                  {showTemplates ? "Hide" : "Show"} Templates
                </Button>
                {showTemplates && (
                  <div className="space-y-1">
                    {getTemplates().map((template, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        onClick={() => useTemplate(template)}
                        className="w-full justify-start text-xs border-slate-600 text-slate-300"
                      >
                        {template}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDialogOpen(false);
                  setInputValue("");
                }}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleQuickAction}
                disabled={isSubmitting || !inputValue.trim()}
                className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Customize Quick Actions</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-400">Select which actions to show:</p>
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.type}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${action.color}`} />
                    <span className="text-sm text-white">{action.label}</span>
                  </div>
                  <Button
                    size="sm"
                    variant={action.enabled ? "default" : "outline"}
                    onClick={() => toggleAction(action.type)}
                    className={action.enabled 
                      ? "bg-fuchsia-600 text-white hover:bg-fuchsia-500" 
                      : "border-slate-600 text-slate-300"
                    }
                  >
                    {action.enabled ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              );
            })}
            <div className="flex justify-end">
              <Button
                onClick={() => setIsSettingsOpen(false)}
                className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}