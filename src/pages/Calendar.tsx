import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight, Mic, Edit } from "lucide-react";
import VoiceHint from "@/components/VoiceHint";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from "date-fns";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  created_at: string;
}

export default function Calendar() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    if (user) loadEvents();
  }, [user, currentMonth]);

  const loadEvents = async () => {
    if (!user) return;
    setLoading(true);
    
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", user.id)
      .gte("start_time", start.toISOString())
      .lte("start_time", end.toISOString())
      .order("start_time", { ascending: true });

    if (error) {
      showError("Failed to load events");
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  const createEvent = async () => {
    if (!user || !newTitle.trim() || !newStartTime || !newEndTime) return;

    const { error } = await supabase.from("calendar_events").insert({
      user_id: user.id,
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      start_time: new Date(newStartTime).toISOString(),
      end_time: new Date(newEndTime).toISOString(),
      location: newLocation.trim() || null,
    });

    if (error) {
      showError("Failed to create event");
    } else {
      loadEvents();
      resetForm();
      showSuccess("Event created!");
    }
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from("calendar_events").delete().eq("id", id);

    if (error) {
      showError("Failed to delete event");
    } else {
      setEvents(events.filter(e => e.id !== id));
      showSuccess("Event deleted");
    }
  };

  const startEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setNewTitle(event.title);
    setNewDescription(event.description || "");
    setNewStartTime(event.start_time.slice(0, 16));
    setNewEndTime(event.end_time ? event.end_time.slice(0, 16) : "");
    setNewLocation(event.location || "");
    setIsDialogOpen(true);
  };

  const updateEvent = async () => {
    if (!editingEvent) return;

    const updates = {
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      start_time: new Date(newStartTime).toISOString(),
      end_time: newEndTime ? new Date(newEndTime).toISOString() : null,
      location: newLocation.trim() || null,
    };

    const { error } = await supabase
      .from("calendar_events")
      .update(updates)
      .eq("id", editingEvent.id);

    if (error) {
      showError("Failed to update event");
    } else {
      await loadEvents();
      resetForm();
      showSuccess("Event updated!");
    }
  };

  const resetForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewStartTime("");
    setNewEndTime("");
    setNewLocation("");
    setEditingEvent(null);
    setIsDialogOpen(false);
  };

  const openNewEvent = (date: Date) => {
    setEditingEvent(null);
    setNewTitle("");
    setNewDescription("");
    setNewLocation("");
    const start = new Date(date);
    start.setHours(9, 0, 0, 0);
    const end = new Date(date);
    end.setHours(10, 0, 0, 0);
    // Use local datetime-local format (YYYY-MM-DDTHH:MM)
    setNewStartTime(start.toISOString().slice(0, 16));
    setNewEndTime(end.toISOString().slice(0, 16));
    setIsDialogOpen(true);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(new Date(event.start_time), day));
  };

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <CalendarIcon className="h-8 w-8 text-blue-400" />
              Calendar
            </h1>
            <VoiceHint
              commands={["Schedule meeting tomorrow at 2pm", "What's on my calendar?", "Read my events"]}
              className="mt-2"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-fuchsia-600 text-white hover:bg-fuchsia-500" onClick={() => openNewEvent(selectedDate || new Date())}>
                <Plus className="h-4 w-4 mr-2" /> New Event
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">{editingEvent ? "Edit Event" : "New Event"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Event title"
                  className="bg-slate-800 border-slate-700 text-white"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                <Input
                  placeholder="Description (optional)"
                  className="bg-slate-800 border-slate-700 text-white"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">Start</label>
                    <Input
                      type="datetime-local"
                      className="bg-slate-800 border-slate-700 text-white"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">End</label>
                    <Input
                      type="datetime-local"
                      className="bg-slate-800 border-slate-700 text-white"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                    />
                  </div>
                </div>
                <Input
                  placeholder="Location (optional)"
                  className="bg-slate-800 border-slate-700 text-white"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetForm} className="border-slate-600 text-slate-300">
                    Cancel
                  </Button>
                  <Button onClick={editingEvent ? updateEvent : createEvent} className="bg-fuchsia-600 text-white hover:bg-fuchsia-500">
                    {editingEvent ? "Update" : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar Grid */}
          <Card className="lg:col-span-2 border-fuchsia-500/20 bg-black/40 backdrop-blur-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="text-slate-400 hover:text-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <CardTitle className="text-white">
                  {format(currentMonth, "MMMM yyyy")}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="text-slate-400 hover:text-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-sm text-slate-400 py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`p-2 rounded-lg text-center transition-colors min-h-[60px] ${
                        isSelected
                          ? "bg-fuchsia-600 text-white"
                          : isToday(day)
                          ? "bg-fuchsia-500/20 text-fuchsia-300"
                          : "hover:bg-slate-800 text-slate-300"
                      }`}
                    >
                      <span className="text-sm">{format(day, "d")}</span>
                      {dayEvents.length > 0 && (
                        <div className="flex justify-center mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Day Events */}
          <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">
                  {selectedDate ? format(selectedDate, "EEEE, MMMM d") : "Select a day"}
                </CardTitle>
                {selectedDate && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                    onClick={() => openNewEvent(selectedDate)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                selectedDayEvents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-white">{event.title}</h4>
                          <div className="flex items-center gap-1 -mt-1 -mr-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditEvent(event)}
                              className="text-slate-400 hover:text-fuchsia-400"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteEvent(event.id)}
                              className="text-slate-400 hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(event.start_time), "h:mm a")} - {format(new Date(event.end_time), "h:mm a")}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">No events for this day.</p>
                )
              ) : (
                <p className="text-slate-400 text-sm">Click on a day to see events.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}