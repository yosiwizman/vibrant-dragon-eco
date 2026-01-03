"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Phone, Building, Plus, Trash2, Edit, Clock, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { showSuccess, showError } from "@/utils/toast";

interface BookingTask {
  id: string;
  user_id: string;
  business_name: string;
  business_phone: string | null;
  instructions: string;
  status: string;
  result_summary: string | null;
  created_at: string;
  updated_at: string;
}

export default function BookingTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<BookingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<BookingTask | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const [formData, setFormData] = useState({
    business_name: "",
    business_phone: "",
    instructions: "",
  });

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user, filter]);

  const loadTasks = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let query = supabase
        .from("booking_tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      showError(error.message || "Failed to load booking tasks");
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingTask) {
        const { error } = await supabase
          .from("booking_tasks")
          .update({
            business_name: formData.business_name,
            business_phone: formData.business_phone || null,
            instructions: formData.instructions,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingTask.id);

        if (error) throw error;
        showSuccess("Booking task updated");
      } else {
        const { error } = await supabase.from("booking_tasks").insert({
          user_id: user.id,
          business_name: formData.business_name,
          business_phone: formData.business_phone || null,
          instructions: formData.instructions,
          status: "pending",
        });

        if (error) throw error;
        showSuccess("Booking task created");
      }

      setIsDialogOpen(false);
      resetForm();
      loadTasks();
    } catch (error: any) {
      showError(error.message || "Failed to save booking task");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("booking_tasks").delete().eq("id", id);
      if (error) throw error;
      showSuccess("Booking task deleted");
      loadTasks();
    } catch (error: any) {
      showError(error.message || "Failed to delete booking task");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("booking_tasks")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      showSuccess("Status updated");
      loadTasks();
    } catch (error: any) {
      showError(error.message || "Failed to update status");
    }
  };

  const resetForm = () => {
    setFormData({
      business_name: "",
      business_phone: "",
      instructions: "",
    });
    setEditingTask(null);
  };

  const openEditDialog = (task: BookingTask) => {
    setEditingTask(task);
    setFormData({
      business_name: task.business_name,
      business_phone: task.business_phone || "",
      instructions: task.instructions,
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">Pending</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/50">Completed</Badge>;
      case "failed":
        return <Badge className="bg-red-500/20 text-red-300 border-red-500/50">Failed</Badge>;
      case "cancelled":
        return <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/50">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-400" />;
      case "in_progress":
        return <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Phone className="h-8 w-8 text-fuchsia-400" />
              Booking Tasks
            </h1>
            <p className="text-slate-400 mt-1">Manage AI-assisted booking calls</p>
          </div>

          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-white">All</SelectItem>
                <SelectItem value="pending" className="text-white">Pending</SelectItem>
                <SelectItem value="in_progress" className="text-white">In Progress</SelectItem>
                <SelectItem value="completed" className="text-white">Completed</SelectItem>
                <SelectItem value="failed" className="text-white">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={loadTasks}
              className="border-slate-600 text-slate-300"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-fuchsia-600 hover:bg-fuchsia-500">
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700 text-white">
                <DialogHeader>
                  <DialogTitle>
                    {editingTask ? "Edit Booking Task" : "New Booking Task"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Business Name *</Label>
                    <Input
                      className="bg-slate-800 border-slate-700"
                      placeholder="Restaurant, Salon, etc."
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Business Phone</Label>
                    <Input
                      className="bg-slate-800 border-slate-700"
                      placeholder="+1 555-123-4567"
                      value={formData.business_phone}
                      onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Instructions *</Label>
                    <Textarea
                      className="bg-slate-800 border-slate-700 min-h-[100px]"
                      placeholder="What should the AI do? e.g., 'Book a table for 2 on Friday at 7pm'"
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="border-slate-600"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-fuchsia-600 hover:bg-fuchsia-500">
                      {editingTask ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-slate-700 bg-black/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-white">{tasks.length}</p>
              <p className="text-xs text-slate-400">Total</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-black/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {tasks.filter((t) => t.status === "pending").length}
              </p>
              <p className="text-xs text-slate-400">Pending</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-black/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">
                {tasks.filter((t) => t.status === "in_progress").length}
              </p>
              <p className="text-xs text-slate-400">In Progress</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-black/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-400">
                {tasks.filter((t) => t.status === "completed").length}
              </p>
              <p className="text-xs text-slate-400">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-slate-700 bg-black/30 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-24 bg-slate-800 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <Card className="border-slate-700 bg-black/30">
            <CardContent className="p-12 text-center">
              <Phone className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No booking tasks</h3>
              <p className="text-slate-400 mb-4">
                Create a task to have AI make booking calls for you
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-fuchsia-600 hover:bg-fuchsia-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {tasks.map((task) => (
                <Card key={task.id} className="border-slate-700 bg-black/30">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-slate-800">
                        {getStatusIcon(task.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-white">{task.business_name}</span>
                          {getStatusBadge(task.status)}
                        </div>
                        {task.business_phone && (
                          <p className="text-sm text-slate-400 mb-2 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {task.business_phone}
                          </p>
                        )}
                        <p className="text-sm text-slate-300 mb-2">{task.instructions}</p>
                        {task.result_summary && (
                          <div className="p-2 rounded bg-slate-800/50 text-sm text-slate-300 mt-2">
                            <span className="font-medium">Result:</span> {task.result_summary}
                          </div>
                        )}
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(parseISO(task.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {task.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                            onClick={() => handleStatusChange(task.id, "in_progress")}
                          >
                            Start
                          </Button>
                        )}
                        {task.status === "in_progress" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                            onClick={() => handleStatusChange(task.id, "completed")}
                          >
                            Complete
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-600 text-slate-300"
                          onClick={() => openEditDialog(task)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                          onClick={() => handleDelete(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}