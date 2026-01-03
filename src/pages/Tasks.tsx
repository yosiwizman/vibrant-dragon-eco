import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, CheckSquare, Clock, AlertTriangle, Mic, CalendarIcon, Search, SortAsc, SortDesc, RefreshCw } from "lucide-react";
import VoiceHint from "@/components/VoiceHint";
import { format, isToday, isTomorrow, isPast, parseISO, isThisWeek, addDays } from "date-fns";

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

type SortOption = "created" | "due" | "priority" | "alpha";
type FilterOption = "all" | "pending" | "completed" | "overdue" | "today" | "week";

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDueDate, setNewDueDate] = useState<Date | undefined>(undefined);
  const [filter, setFilter] = useState<FilterOption>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("created");
  const [sortAsc, setSortAsc] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTasks();
    setIsRefreshing(false);
  };

  const addTask = async () => {
    if (!user || !newTask.trim()) return;

    const { data, error } = await supabase.from("tasks").insert({
      user_id: user.id,
      title: newTask.trim(),
      priority: newPriority,
      status: "pending",
      due_date: newDueDate ? newDueDate.toISOString() : null,
    }).select().single();

    if (error) {
      showError("Failed to create task");
    } else {
      setTasks([data, ...tasks]);
      setNewTask("");
      setNewDueDate(undefined);
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

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = tasks.filter(task => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!task.title.toLowerCase().includes(query) &&
            !task.description?.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Status filter
      switch (filter) {
        case "pending":
          return task.status === "pending";
        case "completed":
          return task.status === "completed";
        case "overdue":
          return task.status === "pending" && task.due_date && isPast(parseISO(task.due_date));
        case "today":
          return task.due_date && isToday(parseISO(task.due_date));
        case "week":
          return task.due_date && isThisWeek(parseISO(task.due_date));
        default:
          return true;
      }
    });

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "due":
          if (!a.due_date && !b.due_date) comparison = 0;
          else if (!a.due_date) comparison = 1;
          else if (!b.due_date) comparison = -1;
          else comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case "priority":
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          comparison = (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) -
                       (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
          break;
        case "alpha":
          comparison = a.title.localeCompare(b.title);
          break;
        default:
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return sortAsc ? comparison : -comparison;
    });

    return result;
  }, [tasks, filter, searchQuery, sortBy, sortAsc]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500/20 text-red-300 border-red-500/50";
      case "high": return "bg-orange-500/20 text-orange-300 border-orange-500/50";
      case "medium": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
      case "low": return "bg-green-500/20 text-green-300 border-green-500/50";
      default: return "bg-slate-500/20 text-slate-300 border-slate-500/50";
    }
  };

  const formatDueDate = (dueDate: string) => {
    const date = parseISO(dueDate);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isPast(date)) return `Overdue (${format(date, "MMM d")})`;
    return format(date, "MMM d");
  };

  const getDueDateColor = (dueDate: string) => {
    const date = parseISO(dueDate);
    if (isPast(date)) return "text-red-400";
    if (isToday(date)) return "text-yellow-400";
    if (isTomorrow(date)) return "text-orange-400";
    return "text-slate-400";
  };

  const pendingCount = tasks.filter(t => t.status === "pending").length;
  const completedCount = tasks.filter(t => t.status === "completed").length;
  const overdueCount = tasks.filter(t => t.status === "pending" && t.due_date && isPast(parseISO(t.due_date))).length;
  const todayCount = tasks.filter(t => t.due_date && isToday(parseISO(t.due_date))).length;

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
            <div className="flex flex-wrap gap-3">
              <Input
                placeholder="Add a new task..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 flex-1 min-w-[200px]"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
              />
              <Select value={newPriority} onValueChange={setNewPriority}>
                <SelectTrigger className="w-28 bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="low" className="text-green-300">Low</SelectItem>
                  <SelectItem value="medium" className="text-yellow-300">Medium</SelectItem>
                  <SelectItem value="high" className="text-orange-300">High</SelectItem>
                  <SelectItem value="urgent" className="text-red-300">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-32 justify-start text-left font-normal bg-slate-800 border-slate-700 ${
                      newDueDate ? "text-white" : "text-slate-500"
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newDueDate ? format(newDueDate, "MMM d") : "Due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-700" align="start">
                  <Calendar
                    mode="single"
                    selected={newDueDate}
                    onSelect={setNewDueDate}
                    initialFocus
                    className="bg-slate-900"
                  />
                  <div className="p-2 border-t border-slate-700 flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                      onClick={() => setNewDueDate(new Date())}
                    >
                      Today
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                      onClick={() => setNewDueDate(addDays(new Date(), 1))}
                    >
                      Tomorrow
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                      onClick={() => setNewDueDate(undefined)}
                    >
                      Clear
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Button onClick={addTask} className="bg-fuchsia-600 text-white hover:bg-fuchsia-500">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search and Sort */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-32 bg-slate-900 border-slate-600 text-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="due">Due Date</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="alpha">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortAsc(!sortAsc)}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                {sortAsc ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterOption)}>
          <TabsList className="bg-slate-800 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-fuchsia-600">
              All ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-fuchsia-600">
              Pending ({pendingCount})
            </TabsTrigger>
            {overdueCount > 0 && (
              <TabsTrigger value="overdue" className="data-[state=active]:bg-red-600 text-red-400 data-[state=active]:text-white">
                Overdue ({overdueCount})
              </TabsTrigger>
            )}
            {todayCount > 0 && (
              <TabsTrigger value="today" className="data-[state=active]:bg-yellow-600">
                Today ({todayCount})
              </TabsTrigger>
            )}
            <TabsTrigger value="week" className="data-[state=active]:bg-fuchsia-600">
              This Week
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
                    <div className="flex-1 min-w-0">
                      <p className={`text-white ${task.status === "completed" ? "line-through text-slate-400" : ""}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-sm text-slate-400 mt-1 truncate">{task.description}</p>
                      )}
                      {task.due_date && task.status !== "completed" && (
                        <p className={`text-xs mt-1 flex items-center gap-1 ${getDueDateColor(task.due_date)}`}>
                          <Clock className="h-3 w-3" />
                          {formatDueDate(task.due_date)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
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