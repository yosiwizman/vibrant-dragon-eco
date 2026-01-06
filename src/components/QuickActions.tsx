import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bell, 
  CheckSquare, 
  FileText, 
  Calendar,
  Zap,
  Loader2
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
    { type: "task" as const, icon: CheckSquare, label: "Task", color: "text-green-400", bgColor: "bg-green-500/10 hover:bg-green-500/20" },
    { type: "reminder" as const, icon: Bell, label: "Reminder", color: "text-yellow-400", bgColor: "bg-yellow-500/10 hover:bg-yellow-500/20" },
    { type: "note" as const, icon: FileText, label: "Note", color: "text-purple-400", bgColor: "bg-purple-500/10 hover:bg-purple-500/20" },
    { type: "event" as const, icon: Calendar, label: "Event", color: "text-blue-400", bgColor: "bg-blue-500/10 hover:bg-blue-500/20" },
  ];

  const getPlaceholder = () => {
    switch (actionType) {
      case "task": return "What needs to be done?";
      case "reminder": return "What should I remind you about?";
      case "note": return "What do you want to remember?";
      case "event": return "What's the event?";
    }
  };

  const currentAction = actions.find(a => a.type === actionType);

  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full">
      <CardContent className="p-4 h-full flex flex-col">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-fuchsia-400" />
          Quick Add
        </h3>
        <div className="grid grid-cols-4 gap-2 flex-1">
          {actions.map((action) => (
            <Dialog key={action.type} open={isOpen && actionType === action.type} onOpenChange={(open) => {
              setIsOpen(open);
              if (open) setActionType(action.type);
            }}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className={`flex flex-col items-center justify-center gap-1.5 h-full py-3 px-2 border border-slate-700 ${action.bgColor}`}
                  onClick={() => setActionType(action.type)}
                >
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                  <span className="text-xs text-slate-300">{action.label}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2">
                    {currentAction && <currentAction.icon className={`h-5 w-5 ${currentAction.color}`} />}
                    Quick {action.label}
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
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsOpen(false)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-800"
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
}