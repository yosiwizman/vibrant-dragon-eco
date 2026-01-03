import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, CheckSquare, Clock, AlertTriangle, Mic } from "lucide-react";
import VoiceHint from "@/components/VoiceHint";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  due_date?: string;
  tags?: string[];
  created_at: string;
  completed_at?: string;
}

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (user) loadTasks();
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      showError("Failed to load tasks");
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const addTask = async () => {
    if (!user || !newTask.trim()) return;

    const { data, error } = await supabase.from("tasks").insert({
      user_id: user.id,
      title: newTask.trim(),
      priority: newPriority,
      status: "pending",
    }).select().single();

    if (error) {
      showError("Failed to create task");
    } else {
      setTasks([data, ...tasks]);
      setNewTask("");
      showSuccess("Task created!");
    }
  };

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    const completedAt = newStatus === "completed" ? new Date().toISOString() : null;

    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus, completed_at: completedAt })
      .eq("id", task.id);

    if (error) {
      showError("Failed to update task");
    } else {
      setTasks(tasks.map(t => 
        t.id === task.id ? { ...t, status: newStatus, completed_at: completedAt } : t
      ));
    }
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
      showError("Failed to delete task");
    } else {
      setTasks(tasks.filter(t => t.id !== taskId));
      showSuccess("Task deleted");
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === "all") return true;
    if (filter === "pending") return task.status === "pending";
    if (filter === "completed") return task.status === "completed";
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500/20 text-red-300 border-red-500/50";
      case "high": return "bg-orange-500/20 text-orange-300 border-orange-500/50";
      case "medium": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
      case "low": return "bg-green-500/20 text-green-300 border-green-500/50";
      default: return "bg-slate-500/20 text-slate-300 border-slate-500/50";
    }
  };

  const pendingCount = tasks.filter(t => t.status === "pending").length;
  const completedCount = tasks.filter(t => t.status === "completed").length;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <CheckSquare className="h-8 w-8 text-green-400" />
              Tasks
            </h1>
            <p className="text-slate-400 mt-1">
              {pendingCount} pending • {completedCount} completed
            </p>
            <VoiceHint
              commands={["Add task buy groceries", "Mark first task done", "Read my tasks"]}
              className="mt-2"
            />
          </div>
        </div>

        {/* Add Task */}
        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Input
                placeholder="Add a new task..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 flex-1"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
              />
              <Select value={newPriority} onValueChange={setNewPriority}>
                <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="low" className="text-green-300">Low</SelectItem>
                  <SelectItem value="medium" className="text-yellow-300">Medium</SelectItem>
                  <SelectItem value="high" className="text-orange-300">High</SelectItem>
                  <SelectItem value="urgent" className="text-red-300">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addTask} className="bg-fuchsia-600 text-white hover:bg-fuchsia-500">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="bg-slate-800">
            <TabsTrigger value="all" className="data-[state=active]:bg-fuchsia-600">
              All ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-fuchsia-600">
              Pending ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-fuchsia-600">
              Completed ({completedCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Task List */}
        <div className="space-y-2">
          {loading ? (
            <Card className="border-slate-700 bg-slate-800/50">
              <CardContent className="p-8 text-center text-slate-400">
                Loading tasks...
              </CardContent>
            </Card>
          ) : filteredTasks.length === 0 ? (
            <Card className="border-slate-700 bg-slate-800/50">
              <CardContent className="p-8 text-center text-slate-400">
                No tasks found. Add one above!
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task) => (
              <Card
                key={task.id}
                className={`border-fuchsia-500/20 bg-black/30 backdrop-blur transition-all ${
                  task.status === "completed" ? "opacity-60" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={task.status === "completed"}
                      onCheckedChange={() => toggleTask(task)}
                      className="border-slate-500 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
                    <div className="flex-1">
                      <p className={`text-white ${task.status === "completed" ? "line-through text-slate-400" : ""}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-sm text-slate-400 mt-1">{task.description}</p>
                      )}
                    </div>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTask(task.id)}
                      className="text-slate-400 hover:text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}