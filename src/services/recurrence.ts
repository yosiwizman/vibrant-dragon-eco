import { supabase } from "@/integrations/supabase/client";
import { RecurrenceRule, getNextOccurrence, recurrenceToRRule } from "./smart-time-parser";

export interface RecurringItem {
  id: string;
  userId: string;
  type: "task" | "reminder";
  title: string;
  recurrenceRule: RecurrenceRule;
  nextOccurrence: Date;
  lastTriggered?: Date;
  isActive: boolean;
}

/**
 * Create a recurring reminder
 */
export async function createRecurringReminder(
  userId: string,
  text: string,
  firstDueTime: Date,
  recurrenceRule: RecurrenceRule,
  channel: string = "push"
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const rrule = recurrenceToRRule(recurrenceRule);

    const { data, error } = await supabase
      .from("reminders")
      .insert({
        user_id: userId,
        text,
        due_time: firstDueTime.toISOString(),
        channel,
        status: "pending",
        recurrence_rule: rrule,
        recurrence_end_date: recurrenceRule.endDate?.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create a recurring task
 */
export async function createRecurringTask(
  userId: string,
  title: string,
  description: string | undefined,
  firstDueDate: Date,
  recurrenceRule: RecurrenceRule,
  priority: string = "medium"
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const rrule = recurrenceToRRule(recurrenceRule);

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        title,
        description,
        due_date: firstDueDate.toISOString(),
        priority,
        status: "pending",
        recurrence_rule: rrule,
        recurrence_end_date: recurrenceRule.endDate?.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Process completed recurring item - create next occurrence
 */
export async function processRecurringCompletion(
  userId: string,
  itemType: "task" | "reminder",
  itemId: string
): Promise<{ success: boolean; nextItem?: any; error?: string }> {
  try {
    const tableName = itemType === "task" ? "tasks" : "reminders";
    const dateField = itemType === "task" ? "due_date" : "due_time";

    // Get the completed item
    const { data: item, error: fetchError } = await supabase
      .from(tableName)
      .select("*")
      .eq("id", itemId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !item) {
      return { success: false, error: "Item not found" };
    }

    // Check if it has a recurrence rule
    if (!item.recurrence_rule) {
      return { success: true }; // Not recurring, nothing to do
    }

    // Parse the recurrence rule
    const rule = parseRRule(item.recurrence_rule);
    if (!rule) {
      return { success: false, error: "Invalid recurrence rule" };
    }

    // Check if we've reached the end date
    if (item.recurrence_end_date && new Date(item.recurrence_end_date) < new Date()) {
      return { success: true }; // Recurrence has ended
    }

    // Calculate next occurrence
    const currentDate = new Date(item[dateField]);
    const nextDate = getNextOccurrence(rule, currentDate);

    // Create the next occurrence
    const newItemData: any = {
      user_id: userId,
      [itemType === "task" ? "title" : "text"]: item[itemType === "task" ? "title" : "text"],
      [dateField]: nextDate.toISOString(),
      status: "pending",
      recurrence_rule: item.recurrence_rule,
      recurrence_end_date: item.recurrence_end_date,
      parent_reminder_id: itemType === "reminder" ? (item.parent_reminder_id || itemId) : undefined,
      parent_task_id: itemType === "task" ? (item.parent_task_id || itemId) : undefined,
    };

    if (itemType === "task") {
      newItemData.description = item.description;
      newItemData.priority = item.priority;
      newItemData.tags = item.tags;
    } else {
      newItemData.channel = item.channel;
    }

    const { data: nextItem, error: createError } = await supabase
      .from(tableName)
      .insert(newItemData)
      .select()
      .single();

    if (createError) throw createError;

    // Update the original item's last_triggered_at
    if (itemType === "reminder") {
      await supabase
        .from("reminders")
        .update({ last_triggered_at: new Date().toISOString() })
        .eq("id", itemId);
    }

    return { success: true, nextItem };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get all recurring items for a user
 */
export async function getRecurringItems(userId: string): Promise<RecurringItem[]> {
  const items: RecurringItem[] = [];

  try {
    // Get recurring tasks
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .not("recurrence_rule", "is", null)
      .eq("status", "pending");

    if (tasks) {
      for (const task of tasks) {
        const rule = parseRRule(task.recurrence_rule);
        if (rule) {
          items.push({
            id: task.id,
            userId: task.user_id,
            type: "task",
            title: task.title,
            recurrenceRule: rule,
            nextOccurrence: new Date(task.due_date),
            isActive: true,
          });
        }
      }
    }

    // Get recurring reminders
    const { data: reminders } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", userId)
      .not("recurrence_rule", "is", null)
      .eq("status", "pending");

    if (reminders) {
      for (const reminder of reminders) {
        const rule = parseRRule(reminder.recurrence_rule);
        if (rule) {
          items.push({
            id: reminder.id,
            userId: reminder.user_id,
            type: "reminder",
            title: reminder.text,
            recurrenceRule: rule,
            nextOccurrence: new Date(reminder.due_time),
            lastTriggered: reminder.last_triggered_at ? new Date(reminder.last_triggered_at) : undefined,
            isActive: true,
          });
        }
      }
    }
  } catch (error) {
    console.error("Failed to get recurring items:", error);
  }

  return items;
}

/**
 * Cancel a recurring series
 */
export async function cancelRecurringSeries(
  userId: string,
  itemType: "task" | "reminder",
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const tableName = itemType === "task" ? "tasks" : "reminders";
    const parentField = itemType === "task" ? "parent_task_id" : "parent_reminder_id";

    // Get the item to find the parent
    const { data: item } = await supabase
      .from(tableName)
      .select("*")
      .eq("id", itemId)
      .eq("user_id", userId)
      .single();

    if (!item) {
      return { success: false, error: "Item not found" };
    }

    const parentId = item[parentField] || itemId;

    // Delete all future occurrences
    await supabase
      .from(tableName)
      .delete()
      .eq("user_id", userId)
      .or(`id.eq.${parentId},${parentField}.eq.${parentId}`)
      .eq("status", "pending");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Helper: Parse RRULE string to RecurrenceRule
function parseRRule(rrule: string): RecurrenceRule | null {
  if (!rrule) return null;

  try {
    const parts = rrule.split(";");
    const rule: RecurrenceRule = {
      frequency: "daily",
      interval: 1,
    };

    for (const part of parts) {
      const [key, value] = part.split("=");
      switch (key) {
        case "FREQ":
          const freqMap: Record<string, RecurrenceRule["frequency"]> = {
            DAILY: "daily",
            WEEKLY: "weekly",
            MONTHLY: "monthly",
            YEARLY: "yearly",
          };
          rule.frequency = freqMap[value] || "daily";
          break;
        case "INTERVAL":
          rule.interval = parseInt(value) || 1;
          if (rule.frequency === "weekly" && rule.interval === 2) {
            rule.frequency = "biweekly";
            rule.interval = 1;
          }
          break;
        case "BYDAY":
          const dayMap: Record<string, number> = {
            SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
          };
          rule.daysOfWeek = value.split(",").map(d => dayMap[d]).filter(d => d !== undefined);
          break;
        case "BYMONTHDAY":
          rule.dayOfMonth = parseInt(value);
          break;
        case "UNTIL":
          rule.endDate = new Date(value);
          break;
        case "COUNT":
          rule.count = parseInt(value);
          break;
      }
    }

    return rule;
  } catch {
    return null;
  }
}