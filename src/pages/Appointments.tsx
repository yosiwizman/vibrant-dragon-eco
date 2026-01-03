"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, User, Phone, Plus, Trash2, Edit, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format, parseISO, isToday, isTomorrow, isPast, addHours } from "date-fns";
import { showSuccess, showError } from "@/utils/toast";

interface Appointment {
  id: string;
  user_id: string;
  contact_name: string | null;
  contact_phone: string | null;
  start_time: string;
  end_time: string | null;
  notes: string | null;
  source: string;
  status: string;
  follow_up_state: string | null;
  created_at: string;
}

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");

  const [formData, setFormData] = useState({
    contact_name: "",
    contact_phone: "",
    start_time: "",
    end_time: "",
    notes: "",
    status: "scheduled",
  });

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user, filter]);

  const loadAppointments = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let query = supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user.id)
        .order("start_time", { ascending: true });

      if (filter === "upcoming") {
        query = query.gte("start_time", new Date().toISOString());
      } else if (filter === "past") {
        query = query.lt("start_time", new Date().toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      showError(error.message || "Failed to load appointments");
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingAppointment) {
        const { error } = await supabase
          .from("appointments")
          .update({
            contact_name: formData.contact_name || null,
            contact_phone: formData.contact_phone || null,
            start_time: formData.start_time,
            end_time: formData.end_time || null,
            notes: formData.notes || null,
            status: formData.status,
          })
          .eq("id", editingAppointment.id);

        if (error) throw error;
        showSuccess("Appointment updated");
      } else {
        const { error } = await supabase.from("appointments").insert({
          user_id: user.id,
          contact_name: formData.contact_name || null,
          contact_phone: formData.contact_phone || null,
          start_time: formData.start_time,
          end_time: formData.end_time || null,
          notes: formData.notes || null,
          status: formData.status,
          source: "manual",
        });

        if (error) throw error;
        showSuccess("Appointment created");
      }

      setIsDialogOpen(false);
      resetForm();
      loadAppointments();
    } catch (error: any) {
      showError(error.message || "Failed to save appointment");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
      showSuccess("Appointment deleted");
      loadAppointments();
    } catch (error: any) {
      showError(error.message || "Failed to delete appointment");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      showSuccess("Status updated");
      loadAppointments();
    } catch (error: any) {
      showError(error.message || "Failed to update status");
    }
  };

  const resetForm = () => {
    setFormData({
      contact_name: "",
      contact_phone: "",
      start_time: "",
      end_time: "",
      notes: "",
      status: "scheduled",
    });
    setEditingAppointment(null);
  };

  const openEditDialog = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      contact_name: appointment.contact_name || "",
      contact_phone: appointment.contact_phone || "",
      start_time: appointment.start_time.slice(0, 16),
      end_time: appointment.end_time?.slice(0, 16) || "",
      notes: appointment.notes || "",
      status: appointment.status,
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">Scheduled</Badge>;
      case "confirmed":
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/50">Confirmed</Badge>;
      case "completed":
        return <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/50">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/20 text-red-300 border-red-500/50">Cancelled</Badge>;
      case "no_show":
        return <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/50">No Show</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatAppointmentTime = (startTime: string, endTime: string | null) => {
    const start = parseISO(startTime);
    let dateLabel = format(start, "MMM d, yyyy");
    
    if (isToday(start)) dateLabel = "Today";
    else if (isTomorrow(start)) dateLabel = "Tomorrow";

    const timeRange = endTime
      ? `${format(start, "h:mm a")} - ${format(parseISO(endTime), "h:mm a")}`
      : format(start, "h:mm a");

    return { dateLabel, timeRange };
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Calendar className="h-8 w-8 text-fuchsia-400" />
              Appointments
            </h1>
            <p className="text-slate-400 mt-1">Manage your scheduled appointments</p>
          </div>

          <div className="flex gap-2">
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="upcoming" className="text-white">Upcoming</SelectItem>
                <SelectItem value="past" className="text-white">Past</SelectItem>
                <SelectItem value="all" className="text-white">All</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-fuchsia-600 hover:bg-fuchsia-500">
                  <Plus className="h-4 w-4 mr-2" />
                  New Appointment
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700 text-white">
                <DialogHeader>
                  <DialogTitle>
                    {editingAppointment ? "Edit Appointment" : "New Appointment"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Contact Name</Label>
                    <Input
                      className="bg-slate-800 border-slate-700"
                      placeholder="John Doe"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Contact Phone</Label>
                    <Input
                      className="bg-slate-800 border-slate-700"
                      placeholder="+1 555-123-4567"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Start Time *</Label>
                      <Input
                        type="datetime-local"
                        className="bg-slate-800 border-slate-700"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>End Time</Label>
                      <Input
                        type="datetime-local"
                        className="bg-slate-800 border-slate-700"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => setFormData({ ...formData, status: v })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="scheduled" className="text-white">Scheduled</SelectItem>
                        <SelectItem value="confirmed" className="text-white">Confirmed</SelectItem>
                        <SelectItem value="completed" className="text-white">Completed</SelectItem>
                        <SelectItem value="cancelled" className="text-white">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Notes</Label>
                    <Textarea
                      className="bg-slate-800 border-slate-700"
                      placeholder="Additional notes..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                      {editingAppointment ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-slate-700 bg-black/30 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-slate-800 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <Card className="border-slate-700 bg-black/30">
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No appointments</h3>
              <p className="text-slate-400 mb-4">
                {filter === "upcoming"
                  ? "You don't have any upcoming appointments"
                  : filter === "past"
                  ? "No past appointments found"
                  : "Create your first appointment to get started"}
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-fuchsia-600 hover:bg-fuchsia-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule Appointment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => {
              const { dateLabel, timeRange } = formatAppointmentTime(
                appointment.start_time,
                appointment.end_time
              );
              const isPastAppointment = isPast(parseISO(appointment.start_time));

              return (
                <Card
                  key={appointment.id}
                  className={`border-slate-700 bg-black/30 backdrop-blur transition-colors ${
                    isPastAppointment ? "opacity-75" : ""
                  }`}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-fuchsia-500/20">
                            <Calendar className="h-5 w-5 text-fuchsia-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{dateLabel}</p>
                            <p className="text-sm text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {timeRange}
                            </p>
                          </div>
                          {getStatusBadge(appointment.status)}
                        </div>

                        {(appointment.contact_name || appointment.contact_phone) && (
                          <div className="flex items-center gap-4 text-sm text-slate-300 mt-3">
                            {appointment.contact_name && (
                              <span className="flex items-center gap-1">
                                <User className="h-4 w-4 text-slate-500" />
                                {appointment.contact_name}
                              </span>
                            )}
                            {appointment.contact_phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-4 w-4 text-slate-500" />
                                {appointment.contact_phone}
                              </span>
                            )}
                          </div>
                        )}

                        {appointment.notes && (
                          <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                            {appointment.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {appointment.status === "scheduled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                            onClick={() => handleStatusChange(appointment.id, "confirmed")}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {appointment.status !== "completed" && appointment.status !== "cancelled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            onClick={() => handleStatusChange(appointment.id, "completed")}
                          >
                            Complete
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          onClick={() => openEditDialog(appointment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                          onClick={() => handleDelete(appointment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}