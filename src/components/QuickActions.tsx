import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Bell, 
  CheckSquare, 
  FileText, 
  Calendar,
  Clock,
  Zap
} from "lucide-react";

export default function QuickActions() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [actionType, setActionType] = useState<"task" | "reminder" | "note" | "event">("task");
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickAction = async () => {
    if (!user || !inputValue.trim()) return;
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
          // Default to 1 hour from now
          const dueTime = new Date();
          dueTime.setHours(dueTime.getHours() + 1);
          await supabase.from("reminders").insert({
            user_id: user.id,
            text: inputValue.trim(),
            due_time: dueTime.toISOString(),
            channel: "push",
            status: "pending",
          });
          showSuccess("Reminder set for 1 hour from now!");
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
          // Default to tomorrow at 10am
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
      }
      
      setInputValue("");
      setIsOpen(false);
    } catch (error) {
      showError("Failed to create item");
    }
    
    setIsSubmitting(false);
  };

  const actions = [
    { type: "task" as const, icon: <CheckSquare className="h-4 w-4" />, label: "Task", color: "text-green-400" },
    { type: "reminder" as const, icon: <Bell className="h-4 w-4" />, label: "Reminder", color: "text-yellow-400" },
    { type: "note" as const, icon: <FileText className="h-4 w-4" />, label: "Note", color: "text-purple-400" },
    { type: "event" as const, icon: <Calendar className="h-4 w-4" />, label: "Event", color: "text-blue-400" },
  ];

  const getPlaceholder = () => {
    switch (actionType) {
      case "task": return "What needs to be done?";
      case "reminder": return "What should I remind you about?";
      case "note": return "What do you want to remember?";
      case "event": return "What's the event?";
    }
  };

  return (
    <Card className="border-fuchsia-500/20 bg-black/30 backdrop-blur">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-fuchsia-400" />
          Quick Add
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {actions.map((action) => (
            <Dialog key={action.type} open={isOpen && actionType === action.type} onOpenChange={(open) => {
              setIsOpen(open);
              if (open) setActionType(action.type);
            }}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-1 h-auto py-3 border-slate-700 bg-slate-800/50 hover:bg-slate-700"
                  onClick={() => setActionType(action.type)}
                >
                  <span className={action.color}>{action.icon}</span>
                  <span className="text-xs text-slate-300">{action.label}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2">
                    <span className={action.color}>{action.icon}</span>
                    Quick {action.label}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder={getPlaceholder()}
                    className="bg-slate-800 border-slate-700 text-white"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleQuickAction()}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsOpen(false)}
                      className="border-slate-600 text-slate-300"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleQuickAction}
                      disabled={isSubmitting || !inputValue.trim()}
                      className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
                    >
                      {isSubmitting ? "..." : "Create"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}