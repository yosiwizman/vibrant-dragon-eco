"use client";

import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

interface ExportData {
  version: string;
  exportDate: string;
  userId: string;
  profile: any;
  tasks: any[];
  reminders: any[];
  notes: any[];
  calendarEvents: any[];
  contacts: any[];
  messages: any[];
  knowledge: any[];
  preferences: any;
}

/**
 * Export all user data as JSON
 */
export async function exportUserData(userId: string): Promise<ExportData | null> {
  try {
    const [
      profile,
      tasks,
      reminders,
      notes,
      calendarEvents,
      contacts,
      emailLogs,
      smsLogs,
      knowledge,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("tasks").select("*").eq("user_id", userId),
      supabase.from("reminders").select("*").eq("user_id", userId),
      supabase.from("notes").select("*").eq("user_id", userId),
      supabase.from("calendar_events").select("*").eq("user_id", userId),
      supabase.from("contacts").select("*").eq("user_id", userId),
      supabase.from("email_logs").select("*").eq("user_id", userId),
      supabase.from("sms_logs").select("*").eq("user_id", userId),
      supabase.from("knowledge").select("*").eq("user_id", userId),
    ]);

    const messages = [
      ...(emailLogs.data || []).map(e => ({ ...e, type: "email" })),
      ...(smsLogs.data || []).map(s => ({ ...s, type: "sms" })),
    ];

    const preferences = localStorage.getItem("echo:prefs");

    const exportData: ExportData = {
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      userId,
      profile: profile.data,
      tasks: tasks.data || [],
      reminders: reminders.data || [],
      notes: notes.data || [],
      calendarEvents: calendarEvents.data || [],
      contacts: contacts.data || [],
      messages,
      knowledge: knowledge.data || [],
      preferences: preferences ? JSON.parse(preferences) : null,
    };

    return exportData;
  } catch (error) {
    console.error("Failed to export data:", error);
    return null;
  }
}

/**
 * Download exported data as JSON file
 */
export async function downloadUserData(userId: string) {
  try {
    const data = await exportUserData(userId);
    
    if (!data) {
      showError("Failed to export data");
      return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `echo-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccess("Data exported successfully!");
  } catch (error) {
    console.error("Failed to download data:", error);
    showError("Failed to download data");
  }
}

/**
 * Import user data from JSON file
 */
export async function importUserData(
  userId: string,
  file: File
): Promise<boolean> {
  try {
    const text = await file.text();
    const data: ExportData = JSON.parse(text);

    // Validate data structure
    if (!data.version || !data.userId || !data.exportDate) {
      showError("Invalid backup file format");
      return false;
    }

    // Confirm with user
    const confirmed = window.confirm(
      `This will import data from ${new Date(data.exportDate).toLocaleDateString()}. Continue?`
    );

    if (!confirmed) return false;

    // Import data (this will merge with existing data)
    const promises = [];

    if (data.tasks?.length > 0) {
      promises.push(
        ...data.tasks.map(task =>
          supabase.from("tasks").upsert({ ...task, user_id: userId })
        )
      );
    }

    if (data.reminders?.length > 0) {
      promises.push(
        ...data.reminders.map(reminder =>
          supabase.from("reminders").upsert({ ...reminder, user_id: userId })
        )
      );
    }

    if (data.notes?.length > 0) {
      promises.push(
        ...data.notes.map(note =>
          supabase.from("notes").upsert({ ...note, user_id: userId })
        )
      );
    }

    if (data.calendarEvents?.length > 0) {
      promises.push(
        ...data.calendarEvents.map(event =>
          supabase.from("calendar_events").upsert({ ...event, user_id: userId })
        )
      );
    }

    if (data.contacts?.length > 0) {
      promises.push(
        ...data.contacts.map(contact =>
          supabase.from("contacts").upsert({ ...contact, user_id: userId })
        )
      );
    }

    await Promise.all(promises);

    // Import preferences
    if (data.preferences) {
      localStorage.setItem("echo:prefs", JSON.stringify(data.preferences));
    }

    showSuccess("Data imported successfully!");
    return true;
  } catch (error) {
    console.error("Failed to import data:", error);
    showError("Failed to import data");
    return false;
  }
}

/**
 * Get export statistics
 */
export async function getExportStats(userId: string): Promise<{
  totalItems: number;
  breakdown: Record<string, number>;
  estimatedSize: string;
} | null> {
  try {
    const data = await exportUserData(userId);
    
    if (!data) return null;

    const breakdown = {
      tasks: data.tasks.length,
      reminders: data.reminders.length,
      notes: data.notes.length,
      events: data.calendarEvents.length,
      contacts: data.contacts.length,
      messages: data.messages.length,
      knowledge: data.knowledge.length,
    };

    const totalItems = Object.values(breakdown).reduce((sum, count) => sum + count, 0);
    const jsonSize = new Blob([JSON.stringify(data)]).size;
    const estimatedSize = jsonSize < 1024 
      ? `${jsonSize} bytes`
      : jsonSize < 1024 * 1024
      ? `${(jsonSize / 1024).toFixed(2)} KB`
      : `${(jsonSize / (1024 * 1024)).toFixed(2)} MB`;

    return {
      totalItems,
      breakdown,
      estimatedSize,
    };
  } catch (error) {
    console.error("Failed to get export stats:", error);
    return null;
  }
}