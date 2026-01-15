import { supabase } from "@/integrations/supabase/client";
import { ActionResult } from '../types';
import { recordAction } from "@/services/action-history";

export async function executeCreateCalendarEvent(
  userId: string,
  title: string,
  startTime: string,
  endTime: string,
  location?: string,
  description?: string,
  attendees?: string[]
): Promise<ActionResult> {
  try {
    const { data, error } = await supabase.from("calendar_events").insert({
      user_id: userId,
      title,
      start_time: startTime,
      end_time: endTime,
      location,
      description,
      attendees: attendees ? JSON.stringify(attendees) : null,
    }).select().single();

    if (error) throw error;

    await recordAction(userId, "create", "calendar_event", data.id, null, data);

    const startDate = new Date(startTime);
    const voiceText = `Event created: "${title}" on ${startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at ${startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}${location ? ` at ${location}` : ""}.`;

    return {
      tool: "create_calendar_event",
      success: true,
      data: { ...data, voiceText },
    };
  } catch (error: any) {
    return {
      tool: "create_calendar_event",
      success: false,
      error: error.message,
    };
  }
}

export async function executeGetCalendarEvents(
  userId: string,
  startDate: string,
  endDate: string
): Promise<ActionResult> {
  try {
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", userId)
      .gte("start_time", startDate)
      .lte("end_time", endDate)
      .order("start_time", { ascending: true });

    if (error) throw error;

    const voiceText = data && data.length > 0
      ? `You have ${data.length} event${data.length > 1 ? 's' : ''} in this period.`
      : "You have no events scheduled in this period.";

    return {
      tool: "get_calendar",
      success: true,
      data: { events: data, voiceText },
    };
  } catch (error: any) {
    return {
      tool: "get_calendar",
      success: false,
      error: error.message,
    };
  }
}

export async function executeUpdateCalendarEvent(
  userId: string,
  eventId?: string,
  eventTitle?: string,
  newTitle?: string,
  newStartTime?: string,
  newEndTime?: string,
  newLocation?: string
): Promise<ActionResult> {
  try {
    let query = supabase.from("calendar_events").select("*").eq("user_id", userId);
    
    if (eventId) {
      query = query.eq("id", eventId);
    } else if (eventTitle) {
      query = query.ilike("title", `%${eventTitle}%`);
    } else {
      return { tool: "update_calendar_event", success: false, error: "Either event_id or event_title is required" };
    }

    const { data: event, error: fetchError } = await query.single();
    if (fetchError || !event) {
      return { tool: "update_calendar_event", success: false, error: "Event not found" };
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (newTitle) updates.title = newTitle;
    if (newStartTime) updates.start_time = newStartTime;
    if (newEndTime) updates.end_time = newEndTime;
    if (newLocation) updates.location = newLocation;

    const { data, error } = await supabase
      .from("calendar_events")
      .update(updates)
      .eq("id", event.id)
      .select()
      .single();

    if (error) throw error;

    await recordAction(userId, "update", "calendar_event", event.id, event, data);

    return {
      tool: "update_calendar_event",
      success: true,
      data: {
        event: data,
        voiceText: `Updated event: "${data.title}".`,
      },
    };
  } catch (error: any) {
    return { tool: "update_calendar_event", success: false, error: error.message };
  }
}

export async function executeDeleteCalendarEvent(
  userId: string,
  eventId?: string,
  eventTitle?: string
): Promise<ActionResult> {
  try {
    let query = supabase.from("calendar_events").select("*").eq("user_id", userId);
    
    if (eventId) {
      query = query.eq("id", eventId);
    } else if (eventTitle) {
      query = query.ilike("title", `%${eventTitle}%`);
    } else {
      return { tool: "delete_calendar_event", success: false, error: "Either event_id or event_title is required" };
    }

    const { data: event, error: fetchError } = await query.single();
    if (fetchError || !event) {
      return { tool: "delete_calendar_event", success: false, error: "Event not found" };
    }

    await recordAction(userId, "delete", "calendar_event", event.id, event, null);

    const { error } = await supabase.from("calendar_events").delete().eq("id", event.id);
    if (error) throw error;

    return {
      tool: "delete_calendar_event",
      success: true,
      data: {
        event,
        voiceText: `Deleted event: "${event.title}".`,
      },
    };
  } catch (error: any) {
    return { tool: "delete_calendar_event", success: false, error: error.message };
  }
}