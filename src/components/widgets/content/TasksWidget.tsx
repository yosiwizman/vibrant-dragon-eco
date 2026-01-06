"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  Edit,
  Circle,
  CheckCircle2,
  AlertCircle,
  Clock
} from "lucide-react";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";

interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: string;
  status: string;
  created_at: string;
}

export default function TasksWidget() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  
  // Form fields
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState("medium");

  useEffect(() => {
    if (user) loadTasks();
  }, [user, showCompleted]);

  const loadTasks = async () => {
    if (!user) return;
    setLoading(true);
    
    const status = showCompleted ? "completed" : "pending";
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", status)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("priority", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Failed to load tasks:", error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const openNewTask = () => {
    setEditingTask(null);
    setNewTitle("");
    setNewDescription("");
    setNewDueDate("");
    setNewPriority("medium");
    setIsDialogOpen(true);
  };

  const startEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTitle(task.title);
    setNewDescription(task.description || "");
    setNewDueDate(task.due_date ? task.due_date.slice(0, 16) : "");
    setNewPriority(task.priority);
    setIsDialogOpen(true);
  };

  const createTask = async () => {
    if (!user || !newTitle.trim()) {
      showError("Please enter a task title");
      return;
    }

    const { error } = await supabase.from("tasks").insert({
      user_id: user.id,
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      due_date: newDueDate ? new Date(newDueDate).toISOString() : null,
      priority: newPriority,
      status: "pending",
    });

    if (error) {
      showError("Failed to create task");
    } else {
      await loadTasks();
      resetForm();
      showSuccess("Task created!");
    }
  };

  const updateTask = async () => {
    if (!editingTask || !newTitle.trim()) {
      showError("Please enter a task title");
      return;
    }

    const updates = {
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      due_date: newDueDate ? new Date(newDueDate).toISOString() : null,
      priority: newPriority,
    };

    const { error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", editingTask.id);

    if (error) {
      showError("Failed to update task");
    } else {
      await loadTasks();
      resetForm();
      showSuccess("Task updated!");
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === "pending" ? "completed" : "pending";
    const updates: any = { status: newStatus };
    
    if (newStatus === "completed") {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", task.id);

    if (error) {
      showError("Failed to update task");
    } else {
      await loadTasks();
      showSuccess(newStatus === "completed" ? "Task completed!" : "Task reopened");
    }
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);

    if (error) {
      showError("Failed to delete task");
    } else {
      await loadTasks();
      showSuccess("Task deleted");
    }
  };

  const resetForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewDueDate("");
    setNewPriority("medium");
    setEditingTask(null);
    setIsDialogOpen(false);
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = parseISO(dateString);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isPast(date)) return `Overdue - ${format(date, "MMM d")}`;
    return format(date, "MMM d");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-400 border-red-400/30 bg-red-500/10";
      case "high": return "text-orange-400 border-orange-400/30 bg-orange-500/10";
      case "medium": return "text-yellow-400 border-yellow-400/30 bg-yellow-500/10";
      case "low": return "text-green-400 border-green-400/30 bg-green-500/10";
      default: return "text-slate-400 border-slate-400/30 bg-slate-500/10";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent": return <AlertCircle className="h-3 w-3" />;
      case "high": return <AlertCircle className="h-3 w-3" />;
      default: return <Circle className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
        <CardHeader className="p-3 pb-2 shrink-0">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-green-400" />
            Tasks
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
              <CheckSquare className="h-4 w-4 text-green-400" />
              Tasks
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
                onClick={openNewTask}
                className="h-6 w-6 p-0 text-green-400 hover:text-green-300"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0 flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-2">
          {tasks.length === 0 ? (
            <p className="text-[10px] text-slate-500 text-center py-4">
              {showCompleted ? "No completed tasks" : "No pending tasks"}
            </p>
          ) : (
            tasks.map((task) => {
              const dueDate = formatDueDate(task.due_date);
              const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status === "pending";
              
              return (
                <div
                  key={task.id}
                  className={`p-2 rounded-lg border transition-all ${
                    task.status === "completed"
                      ? "bg-slate-900/30 border-slate-700/30 opacity-60"
                      : "bg-slate-900/50 border-slate-700/50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => toggleTaskStatus(task)}
                      className="mt-0.5 shrink-0 text-slate-400 hover:text-green-400 transition-colors"
                    >
                      {task.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs text-white font-medium line-clamp-2 ${
                        task.status === "completed" ? "line-through opacity-60" : ""
                      }`}>
                        {task.title}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {task.priority !== "medium" && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                            {getPriorityIcon(task.priority)}
                            {task.priority}
                          </span>
                        )}
                        
                        {dueDate && (
                          <span className={`text-[10px] flex items-center gap-1 ${
                            isOverdue ? "text-red-400" : "text-slate-500"
                          }`}>
                            <Clock className="h-3 w-3" />
                            {dueDate}
                          </span>
                        )}
                      </div>
                    </div>

                    {task.status === "pending" && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditTask(task)}
                          className="h-5 w-5 p-0 text-slate-400 hover:text-blue-400"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTask(task.id)}
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

      {/* Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingTask ? "Edit Task" : "New Task"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Title *</label>
              <Input
                placeholder="Task title"
                className="bg-slate-800 border-slate-700 text-white"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Description</label>
              <Textarea
                placeholder="Description (optional)"
                className="bg-slate-800 border-slate-700 text-white resize-none"
                rows={3}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Due Date</label>
                <Input
                  type="datetime-local"
                  className="bg-slate-800 border-slate-700 text-white"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Priority</label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="low" className="text-white">Low</SelectItem>
                    <SelectItem value="medium" className="text-white">Medium</SelectItem>
                    <SelectItem value="high" className="text-white">High</SelectItem>
                    <SelectItem value="urgent" className="text-white">Urgent</SelectItem>
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
                onClick={editingTask ? updateTask : createTask}
                className="bg-green-600 text-white hover:bg-green-500"
              >
                {editingTask ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}