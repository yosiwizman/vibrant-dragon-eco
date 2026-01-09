"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  MapPin, 
  Trash2, 
  Edit,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths, 
  isToday,
  startOfWeek,
  endOfWeek
} from "date-fns";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
}

export default function CalendarWidget() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  
  // Form fields
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [newLocation, setNewLocation] = useState("");

  useEffect(() => {
    let isMounted = true;
    
    const load = async () => {
      if (!user || !isMounted) return;
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

      if (!isMounted) return;

      if (error) {
        console.error("Failed to load events:", error);
      } else {
        setEvents(data || []);
      }
      setLoading(false);
    };
    
    load();
    
    return () => {
      isMounted = false;
    };
  }, [user?.id, currentMonth]);

  const loadEvents = async () => {
    if (!user) return;
    
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
      console.error("Failed to load events:", error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
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
    setNewStartTime(start.toISOString().slice(0, 16));
    setNewEndTime(end.toISOString().slice(0, 16));
    setIsDialogOpen(true);
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

  const createEvent = async () => {
    if (!user || !newTitle.trim() || !newStartTime || !newEndTime) {
      showError("Please fill in all required fields");
      return;
    }

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
      await loadEvents();
      resetForm();
      showSuccess("Event created!");
    }
  };

  const updateEvent = async () => {
    if (!editingEvent || !newTitle.trim() || !newStartTime || !newEndTime) {
      showError("Please fill in all required fields");
      return;
    }

    const updates = {
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      start_time: new Date(newStartTime).toISOString(),
      end_time: new Date(newEndTime).toISOString(),
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

  const deleteEvent = async (id: string) => {
    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", id);

    if (error) {
      showError("Failed to delete event");
    } else {
      await loadEvents();
      showSuccess("Event deleted");
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

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(new Date(event.start_time), day));
  };

  const selectedDayEvents = getEventsForDay(selectedDate);

  if (loading) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
        <CardHeader className="p-3 pb-2 shrink-0">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-blue-400" />
            Calendar
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
              <CalendarIcon className="h-4 w-4 text-blue-400" />
              Calendar
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openNewEvent(selectedDate)}
              className="h-6 w-6 p-0 text-blue-400 hover:text-blue-300"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0 flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-3">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="h-6 w-6 p-0 text-slate-400 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-white font-medium">
              {format(currentMonth, "MMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="h-6 w-6 p-0 text-slate-400 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                <div key={i} className="text-center text-[10px] text-slate-500 py-1">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`aspect-square text-[10px] rounded transition-colors ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : isToday(day)
                        ? "bg-blue-500/20 text-blue-300"
                        : isCurrentMonth
                        ? "hover:bg-slate-700 text-slate-300"
                        : "text-slate-600"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <span>{format(day, "d")}</span>
                      {dayEvents.length > 0 && (
                        <div className="w-1 h-1 rounded-full bg-blue-400 mt-0.5" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Events */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs text-slate-400 font-medium">
                {format(selectedDate, "EEE, MMM d")}
              </h4>
              {selectedDayEvents.length > 0 && (
                <span className="text-[10px] text-slate-500">
                  {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            {selectedDayEvents.length > 0 ? (
              <div className="space-y-2">
                {selectedDayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50 space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-white font-medium line-clamp-1">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditEvent(event)}
                          className="h-5 w-5 p-0 text-slate-400 hover:text-blue-400"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEvent(event.id)}
                          className="h-5 w-5 p-0 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="h-3 w-3" />
                      {format(new Date(event.start_time), "h:mm a")} - {format(new Date(event.end_time), "h:mm a")}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 text-center py-2">
                No events for this day
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingEvent ? "Edit Event" : "New Event"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Title *</label>
              <Input
                placeholder="Event title"
                className="bg-slate-800 border-slate-700 text-white"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Description</label>
              <Input
                placeholder="Description (optional)"
                className="bg-slate-800 border-slate-700 text-white"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Start *</label>
                <Input
                  type="datetime-local"
                  className="bg-slate-800 border-slate-700 text-white"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">End *</label>
                <Input
                  type="datetime-local"
                  className="bg-slate-800 border-slate-700 text-white"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Location</label>
              <Input
                placeholder="Location (optional)"
                className="bg-slate-800 border-slate-700 text-white"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
              />
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
                onClick={editingEvent ? updateEvent : createEvent}
                className="bg-blue-600 text-white hover:bg-blue-500"
              >
                {editingEvent ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}