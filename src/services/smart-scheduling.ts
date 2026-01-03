"use client";

import { supabase } from "@/integrations/supabase/client";
import { addMinutes, addHours, subMinutes, isWithinInterval, parseISO, format, differenceInMinutes, isSameDay, getDay, getHours, startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns";

export interface TimeSlot {
  start: Date;
  end: Date;
  type: "task" | "event" | "reminder" | "appointment" | "blocked";
  title: string;
  id: string;
}

export interface ScheduleConflict {
  type: "overlap" | "insufficient_time" | "back_to_back";
  existingItem: TimeSlot;
  newItem: {
    title: string;
    start: Date;
    end: Date;
    estimatedDuration?: number;
  };
  message: string;
  suggestions: string[];
}

export interface LearnedPattern {
  id: string;
  userId: string;
  patternType: "recurring_activity" | "preferred_time" | "travel_buffer" | "focus_time";
  dayOfWeek?: number; // 0-6, Sunday-Saturday
  timeOfDay?: string; // HH:mm format
  duration?: number; // minutes
  activity: string;
  confidence: number; // 0-1
  occurrences: number;
  lastSeen: Date;
  metadata?: Record<string, any>;
}

export interface SchedulingSuggestion {
  type: "optimal_time" | "reschedule" | "buffer_needed" | "pattern_reminder";
  message: string;
  suggestedTime?: Date;
  reason: string;
  confidence: number;
}

// Get all scheduled items for a user within a date range
export async function getScheduledItems(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<TimeSlot[]> {
  const slots: TimeSlot[] = [];

  try {
    // Get calendar events
    const { data: events } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", userId)
      .gte("start_time", startDate.toISOString())
      .lte("end_time", endDate.toISOString());

    if (events) {
      slots.push(...events.map(e => ({
        start: parseISO(e.start_time),
        end: parseISO(e.end_time),
        type: "event" as const,
        title: e.title,
        id: e.id,
      })));
    }

    // Get appointments
    const { data: appointments } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", userId)
      .neq("status", "cancelled")
      .gte("start_time", startDate.toISOString())
      .lte("start_time", endDate.toISOString());

    if (appointments) {
      slots.push(...appointments.map(a => ({
        start: parseISO(a.start_time),
        end: a.end_time ? parseISO(a.end_time) : addHours(parseISO(a.start_time), 1),
        type: "appointment" as const,
        title: a.contact_name || "Appointment",
        id: a.id,
      })));
    }

    // Get tasks with due dates (estimate 30 min per task)
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .not("due_date", "is", null)
      .gte("due_date", startDate.toISOString())
      .lte("due_date", endDate.toISOString());

    if (tasks) {
      slots.push(...tasks.map(t => ({
        start: subMinutes(parseISO(t.due_date!), 30),
        end: parseISO(t.due_date!),
        type: "task" as const,
        title: t.title,
        id: t.id,
      })));
    }

    // Get reminders
    const { data: reminders } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .gte("due_time", startDate.toISOString())
      .lte("due_time", endDate.toISOString());

    if (reminders) {
      slots.push(...reminders.map(r => ({
        start: parseISO(r.due_time),
        end: addMinutes(parseISO(r.due_time), 15),
        type: "reminder" as const,
        title: r.text,
        id: r.id,
      })));
    }

    return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
  } catch (error) {
    console.error("Failed to get scheduled items:", error);
    return [];
  }
}

// Check for scheduling conflicts
export async function checkScheduleConflicts(
  userId: string,
  newItemStart: Date,
  newItemEnd: Date,
  newItemTitle: string,
  estimatedDuration?: number
): Promise<ScheduleConflict[]> {
  const conflicts: ScheduleConflict[] = [];
  
  // Get items for the day
  const dayStart = startOfDay(newItemStart);
  const dayEnd = endOfDay(newItemStart);
  const existingItems = await getScheduledItems(userId, dayStart, dayEnd);

  for (const item of existingItems) {
    // Check for direct overlap
    const hasOverlap = (
      (newItemStart >= item.start && newItemStart < item.end) ||
      (newItemEnd > item.start && newItemEnd <= item.end) ||
      (newItemStart <= item.start && newItemEnd >= item.end)
    );

    if (hasOverlap) {
      conflicts.push({
        type: "overlap",
        existingItem: item,
        newItem: { title: newItemTitle, start: newItemStart, end: newItemEnd, estimatedDuration },
        message: `This conflicts with "${item.title}" scheduled from ${format(item.start, "h:mm a")} to ${format(item.end, "h:mm a")}`,
        suggestions: await generateAlternativeSlots(userId, newItemStart, estimatedDuration || 30),
      });
    }

    // Check for back-to-back (less than 15 min buffer)
    const gapBefore = differenceInMinutes(newItemStart, item.end);
    const gapAfter = differenceInMinutes(item.start, newItemEnd);

    if ((gapBefore > 0 && gapBefore < 15) || (gapAfter > 0 && gapAfter < 15)) {
      conflicts.push({
        type: "back_to_back",
        existingItem: item,
        newItem: { title: newItemTitle, start: newItemStart, end: newItemEnd },
        message: `This is very close to "${item.title}". You might want to add a buffer.`,
        suggestions: [`Consider starting ${gapBefore > 0 ? "15 minutes later" : "15 minutes earlier"}`],
      });
    }
  }

  // Check if there's enough time for the task
  if (estimatedDuration) {
    const availableTime = differenceInMinutes(newItemEnd, newItemStart);
    if (availableTime < estimatedDuration) {
      conflicts.push({
        type: "insufficient_time",
        existingItem: existingItems[0] || { start: newItemStart, end: newItemEnd, type: "task", title: "", id: "" },
        newItem: { title: newItemTitle, start: newItemStart, end: newItemEnd, estimatedDuration },
        message: `You've allocated ${availableTime} minutes but this task typically takes ${estimatedDuration} minutes`,
        suggestions: [`Extend the time slot to ${estimatedDuration} minutes`, "Break the task into smaller parts"],
      });
    }
  }

  return conflicts;
}

// Generate alternative time slots
async function generateAlternativeSlots(
  userId: string,
  preferredDate: Date,
  durationMinutes: number
): Promise<string[]> {
  const suggestions: string[] = [];
  const dayStart = startOfDay(preferredDate);
  const dayEnd = endOfDay(preferredDate);
  const existingItems = await getScheduledItems(userId, dayStart, dayEnd);

  // Find gaps in the schedule
  const workingHoursStart = 9; // 9 AM
  const workingHoursEnd = 18; // 6 PM

  let currentTime = new Date(dayStart);
  currentTime.setHours(workingHoursStart, 0, 0, 0);

  const endTime = new Date(dayStart);
  endTime.setHours(workingHoursEnd, 0, 0, 0);

  while (currentTime < endTime && suggestions.length < 3) {
    const slotEnd = addMinutes(currentTime, durationMinutes);
    
    const hasConflict = existingItems.some(item => 
      (currentTime >= item.start && currentTime < item.end) ||
      (slotEnd > item.start && slotEnd <= item.end)
    );

    if (!hasConflict && slotEnd <= endTime) {
      suggestions.push(`${format(currentTime, "h:mm a")} - ${format(slotEnd, "h:mm a")}`);
    }

    currentTime = addMinutes(currentTime, 30);
  }

  return suggestions;
}

// Learn patterns from user behavior
export async function learnUserPatterns(userId: string): Promise<LearnedPattern[]> {
  const patterns: LearnedPattern[] = [];
  
  try {
    // Analyze completed tasks for time patterns
    const { data: completedTasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "completed")
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(100);

    if (completedTasks && completedTasks.length > 0) {
      // Group by day of week and hour
      const timePatterns: Record<string, number> = {};
      
      for (const task of completedTasks) {
        const completedAt = parseISO(task.completed_at!);
        const dayHour = `${getDay(completedAt)}-${getHours(completedAt)}`;
        timePatterns[dayHour] = (timePatterns[dayHour] || 0) + 1;
      }

      // Find most productive times
      const sortedPatterns = Object.entries(timePatterns)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

      for (const [dayHour, count] of sortedPatterns) {
        const [day, hour] = dayHour.split("-").map(Number);
        patterns.push({
          id: `productive-${dayHour}`,
          userId,
          patternType: "preferred_time",
          dayOfWeek: day,
          timeOfDay: `${hour.toString().padStart(2, "0")}:00`,
          activity: "task_completion",
          confidence: Math.min(count / 10, 1),
          occurrences: count,
          lastSeen: new Date(),
        });
      }
    }

    // Analyze recurring reminders for routine patterns
    const { data: reminders } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", userId)
      .not("recurrence_rule", "is", null)
      .limit(50);

    if (reminders) {
      for (const reminder of reminders) {
        const dueTime = parseISO(reminder.due_time);
        patterns.push({
          id: `routine-${reminder.id}`,
          userId,
          patternType: "recurring_activity",
          dayOfWeek: getDay(dueTime),
          timeOfDay: format(dueTime, "HH:mm"),
          activity: reminder.text,
          confidence: 0.9,
          occurrences: 1,
          lastSeen: dueTime,
          metadata: { reminderId: reminder.id },
        });
      }
    }

    // Analyze calendar events for meeting patterns
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    
    const { data: events } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", userId)
      .gte("start_time", subMinutes(weekStart, 60 * 24 * 30).toISOString()) // Last 30 days
      .order("start_time", { ascending: false })
      .limit(100);

    if (events) {
      // Find recurring meeting times
      const meetingTimes: Record<string, { count: number; titles: string[] }> = {};
      
      for (const event of events) {
        const startTime = parseISO(event.start_time);
        const dayHour = `${getDay(startTime)}-${getHours(startTime)}`;
        
        if (!meetingTimes[dayHour]) {
          meetingTimes[dayHour] = { count: 0, titles: [] };
        }
        meetingTimes[dayHour].count++;
        if (!meetingTimes[dayHour].titles.includes(event.title)) {
          meetingTimes[dayHour].titles.push(event.title);
        }
      }

      for (const [dayHour, data] of Object.entries(meetingTimes)) {
        if (data.count >= 2) {
          const [day, hour] = dayHour.split("-").map(Number);
          patterns.push({
            id: `meeting-${dayHour}`,
            userId,
            patternType: "recurring_activity",
            dayOfWeek: day,
            timeOfDay: `${hour.toString().padStart(2, "0")}:00`,
            activity: data.titles.length === 1 ? data.titles[0] : "Regular meeting",
            confidence: Math.min(data.count / 5, 1),
            occurrences: data.count,
            lastSeen: new Date(),
          });
        }
      }
    }

  } catch (error) {
    console.error("Failed to learn user patterns:", error);
  }

  return patterns;
}

// Get smart scheduling suggestions
export async function getSchedulingSuggestions(
  userId: string,
  taskTitle: string,
  estimatedDuration: number = 30,
  preferredDate?: Date
): Promise<SchedulingSuggestion[]> {
  const suggestions: SchedulingSuggestion[] = [];
  const patterns = await learnUserPatterns(userId);
  const targetDate = preferredDate || new Date();

  // Find optimal time based on learned patterns
  const productivePatterns = patterns.filter(p => 
    p.patternType === "preferred_time" && 
    p.activity === "task_completion"
  );

  if (productivePatterns.length > 0) {
    const bestPattern = productivePatterns[0];
    const suggestedTime = new Date(targetDate);
    const [hours] = (bestPattern.timeOfDay || "09:00").split(":").map(Number);
    suggestedTime.setHours(hours, 0, 0, 0);

    // Check if this time is available
    const conflicts = await checkScheduleConflicts(
      userId,
      suggestedTime,
      addMinutes(suggestedTime, estimatedDuration),
      taskTitle,
      estimatedDuration
    );

    if (conflicts.length === 0) {
      suggestions.push({
        type: "optimal_time",
        message: `Based on your productivity patterns, ${format(suggestedTime, "h:mm a")} is a great time for this task`,
        suggestedTime,
        reason: `You typically complete tasks around this time`,
        confidence: bestPattern.confidence,
      });
    }
  }

  // Check for pattern-based reminders
  const dayOfWeek = getDay(targetDate);
  const relevantPatterns = patterns.filter(p => 
    p.patternType === "recurring_activity" && 
    p.dayOfWeek === dayOfWeek
  );

  for (const pattern of relevantPatterns) {
    if (pattern.confidence > 0.7) {
      suggestions.push({
        type: "pattern_reminder",
        message: `Remember: You usually have "${pattern.activity}" at ${pattern.timeOfDay} on this day`,
        reason: `This is a recurring activity in your schedule`,
        confidence: pattern.confidence,
      });
    }
  }

  // Find available slots
  const dayStart = startOfDay(targetDate);
  const dayEnd = endOfDay(targetDate);
  const existingItems = await getScheduledItems(userId, dayStart, dayEnd);

  // Suggest buffer times before important events
  for (const item of existingItems) {
    if (item.type === "appointment" || item.type === "event") {
      const bufferStart = subMinutes(item.start, 30);
      suggestions.push({
        type: "buffer_needed",
        message: `Consider leaving 30 minutes before "${item.title}" at ${format(item.start, "h:mm a")} for preparation`,
        suggestedTime: bufferStart,
        reason: "Buffer time helps you prepare and avoid rushing",
        confidence: 0.8,
      });
    }
  }

  return suggestions;
}

// Create automatic reminder based on learned patterns
export async function createPatternBasedReminder(
  userId: string,
  pattern: LearnedPattern,
  leadTimeMinutes: number = 30
): Promise<{ success: boolean; reminderId?: string; error?: string }> {
  try {
    const now = new Date();
    const targetDay = pattern.dayOfWeek ?? getDay(now);
    const [hours, minutes] = (pattern.timeOfDay || "09:00").split(":").map(Number);

    // Calculate next occurrence
    let nextOccurrence = new Date(now);
    const currentDay = getDay(now);
    let daysUntil = targetDay - currentDay;
    if (daysUntil < 0) daysUntil += 7;
    if (daysUntil === 0 && now.getHours() >= hours) daysUntil = 7;

    nextOccurrence.setDate(nextOccurrence.getDate() + daysUntil);
    nextOccurrence.setHours(hours, minutes, 0, 0);

    // Create reminder with lead time
    const reminderTime = subMinutes(nextOccurrence, leadTimeMinutes);

    const { data, error } = await supabase.from("reminders").insert({
      user_id: userId,
      text: `Upcoming: ${pattern.activity}`,
      due_time: reminderTime.toISOString(),
      channel: "push",
      status: "pending",
    }).select().single();

    if (error) throw error;

    return { success: true, reminderId: data.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Analyze schedule and provide daily briefing
export async function getDailyScheduleAnalysis(userId: string): Promise<{
  totalEvents: number;
  busyHours: number;
  freeSlots: { start: Date; end: Date }[];
  conflicts: ScheduleConflict[];
  suggestions: SchedulingSuggestion[];
  patternAlerts: string[];
}> {
  const today = new Date();
  const dayStart = startOfDay(today);
  const dayEnd = endOfDay(today);

  const items = await getScheduledItems(userId, dayStart, dayEnd);
  const patterns = await learnUserPatterns(userId);

  // Calculate busy hours
  let busyMinutes = 0;
  for (const item of items) {
    busyMinutes += differenceInMinutes(item.end, item.start);
  }

  // Find free slots
  const freeSlots: { start: Date; end: Date }[] = [];
  const workStart = new Date(dayStart);
  workStart.setHours(9, 0, 0, 0);
  const workEnd = new Date(dayStart);
  workEnd.setHours(18, 0, 0, 0);

  let currentTime = workStart;
  for (const item of items) {
    if (item.start > currentTime) {
      freeSlots.push({ start: new Date(currentTime), end: new Date(item.start) });
    }
    if (item.end > currentTime) {
      currentTime = new Date(item.end);
    }
  }
  if (currentTime < workEnd) {
    freeSlots.push({ start: new Date(currentTime), end: workEnd });
  }

  // Check for pattern alerts
  const patternAlerts: string[] = [];
  const dayOfWeek = getDay(today);
  
  for (const pattern of patterns) {
    if (pattern.dayOfWeek === dayOfWeek && pattern.confidence > 0.7) {
      patternAlerts.push(`Don't forget: ${pattern.activity} at ${pattern.timeOfDay}`);
    }
  }

  return {
    totalEvents: items.length,
    busyHours: Math.round(busyMinutes / 60 * 10) / 10,
    freeSlots,
    conflicts: [],
    suggestions: await getSchedulingSuggestions(userId, "general", 30, today),
    patternAlerts,
  };
}