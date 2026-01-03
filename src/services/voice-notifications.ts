import { synthesizeSpeech, playAudioBlob } from "./openai-voice";
import type { OpenAIVoice } from "@/types/models";

export interface VoiceNotification {
  id: string;
  type: "reminder" | "task" | "event" | "message" | "system";
  title: string;
  body: string;
  priority: "low" | "normal" | "high" | "urgent";
  timestamp: number;
  spoken: boolean;
}

const NOTIFICATION_QUEUE: VoiceNotification[] = [];
let isProcessing = false;
let apiKey: string | null = null;
let voice: OpenAIVoice = "nova";
let enabled = true;

export function configureVoiceNotifications(config: {
  apiKey?: string;
  voice?: OpenAIVoice;
  enabled?: boolean;
}) {
  if (config.apiKey) apiKey = config.apiKey;
  if (config.voice) voice = config.voice;
  if (config.enabled !== undefined) enabled = config.enabled;
}

export function queueVoiceNotification(notification: Omit<VoiceNotification, "id" | "timestamp" | "spoken">) {
  if (!enabled) return;

  const fullNotification: VoiceNotification = {
    ...notification,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    spoken: false,
  };

  // Insert based on priority
  if (notification.priority === "urgent" || notification.priority === "high") {
    NOTIFICATION_QUEUE.unshift(fullNotification);
  } else {
    NOTIFICATION_QUEUE.push(fullNotification);
  }

  processQueue();
}

async function processQueue() {
  if (isProcessing || NOTIFICATION_QUEUE.length === 0 || !apiKey) return;

  isProcessing = true;

  while (NOTIFICATION_QUEUE.length > 0) {
    const notification = NOTIFICATION_QUEUE.shift()!;
    
    try {
      const text = formatNotificationForSpeech(notification);
      const audioBlob = await synthesizeSpeech(text, apiKey, voice);
      await playAudioBlob(audioBlob);
      notification.spoken = true;
    } catch (error) {
      console.error("Failed to speak notification:", error);
    }

    // Small delay between notifications
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  isProcessing = false;
}

function formatNotificationForSpeech(notification: VoiceNotification): string {
  const prefixes: Record<string, string> = {
    reminder: "Reminder:",
    task: "Task alert:",
    event: "Calendar:",
    message: "New message:",
    system: "",
  };

  const prefix = prefixes[notification.type] || "";
  return `${prefix} ${notification.title}. ${notification.body}`.trim();
}

// Check for due reminders and announce them
export async function checkAndAnnounceReminders(
  userId: string,
  supabase: any
): Promise<void> {
  if (!enabled || !apiKey) return;

  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  try {
    const { data: reminders } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .gte("due_time", fiveMinutesAgo.toISOString())
      .lte("due_time", fiveMinutesFromNow.toISOString());

    if (reminders && reminders.length > 0) {
      for (const reminder of reminders) {
        const dueTime = new Date(reminder.due_time);
        const isOverdue = dueTime < now;
        
        queueVoiceNotification({
          type: "reminder",
          title: reminder.text,
          body: isOverdue ? "This reminder is now due." : "Coming up soon.",
          priority: isOverdue ? "high" : "normal",
        });
      }
    }
  } catch (error) {
    console.error("Failed to check reminders:", error);
  }
}

// Announce upcoming calendar events
export async function checkAndAnnounceEvents(
  userId: string,
  supabase: any
): Promise<void> {
  if (!enabled || !apiKey) return;

  const now = new Date();
  const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

  try {
    const { data: events } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", userId)
      .gte("start_time", now.toISOString())
      .lte("start_time", fifteenMinutesFromNow.toISOString());

    if (events && events.length > 0) {
      for (const event of events) {
        const startTime = new Date(event.start_time);
        const minutesUntil = Math.round((startTime.getTime() - now.getTime()) / 60000);
        
        queueVoiceNotification({
          type: "event",
          title: event.title,
          body: `Starting in ${minutesUntil} minutes${event.location ? ` at ${event.location}` : ""}.`,
          priority: minutesUntil <= 5 ? "high" : "normal",
        });
      }
    }
  } catch (error) {
    console.error("Failed to check events:", error);
  }
}

// Quick announcement without queueing
export async function announceNow(text: string): Promise<void> {
  if (!enabled || !apiKey) return;

  try {
    const audioBlob = await synthesizeSpeech(text, apiKey, voice);
    await playAudioBlob(audioBlob);
  } catch (error) {
    console.error("Failed to announce:", error);
  }
}

// Get greeting based on time of day
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Hello";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Hello";
}

// Generate a morning briefing
export async function generateMorningBriefing(
  userId: string,
  supabase: any
): Promise<string> {
  const greeting = getTimeBasedGreeting();
  const parts: string[] = [greeting + "!"];

  try {
    // Get today's tasks
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending");

    if (tasks && tasks.length > 0) {
      parts.push(`You have ${tasks.length} pending task${tasks.length > 1 ? "s" : ""}.`);
    }

    // Get today's reminders
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    const { data: reminders } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .lte("due_time", endOfDay.toISOString());

    if (reminders && reminders.length > 0) {
      parts.push(`${reminders.length} reminder${reminders.length > 1 ? "s" : ""} for today.`);
    }

    // Get today's events
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const { data: events } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", userId)
      .gte("start_time", startOfDay.toISOString())
      .lte("start_time", endOfDay.toISOString());

    if (events && events.length > 0) {
      parts.push(`${events.length} event${events.length > 1 ? "s" : ""} on your calendar.`);
    }

    if (parts.length === 1) {
      parts.push("Your schedule is clear for today.");
    }

    parts.push("How can I help you?");
  } catch (error) {
    console.error("Failed to generate briefing:", error);
    parts.push("How can I help you today?");
  }

  return parts.join(" ");
}