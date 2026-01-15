import { supabase } from "@/integrations/supabase/client";
import { ActionResult } from '../types';
import { recordAction } from "@/services/action-history";

export async function executeCreateAppointment(
  userId: string,
  startTime: string,
  contactName?: string,
  contactPhone?: string,
  endTime?: string,
  notes?: string
): Promise<ActionResult> {
  try {
    const { data, error } = await supabase.from("appointments").insert({
      user_id: userId,
      contact_name: contactName,
      contact_phone: contactPhone,
      start_time: startTime,
      end_time: endTime,
      notes,
      status: "scheduled",
    }).select().single();

    if (error) throw error;

    await recordAction(userId, "create", "appointment", data.id, null, data);

    const startDate = new Date(startTime);
    const voiceText = `Appointment created${contactName ? ` with ${contactName}` : ""} on ${startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at ${startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}.`;

    return {
      tool: "create_appointment",
      success: true,
      data: { ...data, voiceText },
    };
  } catch (error: any) {
    return {
      tool: "create_appointment",
      success: false,
      error: error.message,
    };
  }
}

export async function executeGetAppointments(
  userId: string,
  days: number = 7
): Promise<ActionResult> {
  try {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", userId)
      .neq("status", "cancelled")
      .gte("start_time", now.toISOString())
      .lte("start_time", future.toISOString())
      .order("start_time", { ascending: true });

    if (error) throw error;

    const voiceText = data && data.length > 0
      ? `You have ${data.length} appointment${data.length > 1 ? 's' : ''} in the next ${days} days.`
      : `You have no appointments in the next ${days} days.`;

    return {
      tool: "get_appointments",
      success: true,
      data: { appointments: data, voiceText },
    };
  } catch (error: any) {
    return {
      tool: "get_appointments",
      success: false,
      error: error.message,
    };
  }
}

export async function executeCancelAppointment(
  userId: string,
  appointmentId?: string,
  contactName?: string
): Promise<ActionResult> {
  try {
    let query = supabase.from("appointments").select("*").eq("user_id", userId);

    if (appointmentId) {
      query = query.eq("id", appointmentId);
    } else if (contactName) {
      query = query.ilike("contact_name", `%${contactName}%`);
    } else {
      return { tool: "cancel_appointment", success: false, error: "Either appointment_id or contact_name is required" };
    }

    const { data: appointment, error: fetchError } = await query.single();
    if (fetchError || !appointment) {
      return { tool: "cancel_appointment", success: false, error: "Appointment not found" };
    }

    const { data, error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointment.id)
      .select()
      .single();

    if (error) throw error;

    await recordAction(userId, "update", "appointment", appointment.id, appointment, data);

    return {
      tool: "cancel_appointment",
      success: true,
      data: {
        appointment: data,
        voiceText: `Cancelled appointment${appointment.contact_name ? ` with ${appointment.contact_name}` : ""}.`,
      },
    };
  } catch (error: any) {
    return { tool: "cancel_appointment", success: false, error: error.message };
  }
}

export async function executeRescheduleAppointment(
  userId: string,
  newStartTime: string,
  appointmentId?: string,
  contactName?: string,
  newEndTime?: string
): Promise<ActionResult> {
  try {
    let query = supabase.from("appointments").select("*").eq("user_id", userId);

    if (appointmentId) {
      query = query.eq("id", appointmentId);
    } else if (contactName) {
      query = query.ilike("contact_name", `%${contactName}%`);
    } else {
      return { tool: "reschedule_appointment", success: false, error: "Either appointment_id or contact_name is required" };
    }

    const { data: appointment, error: fetchError } = await query.single();
    if (fetchError || !appointment) {
      return { tool: "reschedule_appointment", success: false, error: "Appointment not found" };
    }

    const updates: any = { start_time: newStartTime };
    if (newEndTime) updates.end_time = newEndTime;

    const { data, error } = await supabase
      .from("appointments")
      .update(updates)
      .eq("id", appointment.id)
      .select()
      .single();

    if (error) throw error;

    await recordAction(userId, "update", "appointment", appointment.id, appointment, data);

    const newDate = new Date(newStartTime);
    const voiceText = `Rescheduled appointment${appointment.contact_name ? ` with ${appointment.contact_name}` : ""} to ${newDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at ${newDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}.`;

    return {
      tool: "reschedule_appointment",
      success: true,
      data: {
        appointment: data,
        voiceText,
      },
    };
  } catch (error: any) {
    return { tool: "reschedule_appointment", success: false, error: error.message };
  }
}