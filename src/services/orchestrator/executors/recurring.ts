import { ActionResult } from '../types';
import { getRecurringItems, cancelRecurringSeries } from "@/services/recurrence";

export async function executeGetRecurringItems(userId: string): Promise<ActionResult> {
  try {
    const items = await getRecurringItems(userId);
    
    if (items.length === 0) {
      return {
        tool: "get_recurring_items",
        success: true,
        data: {
          items: [],
          voiceText: "You don't have any recurring tasks or reminders.",
        },
      };
    }
    
    const tasks = items.filter(i => i.type === "task");
    const reminders = items.filter(i => i.type === "reminder");
    
    let voiceText = `You have ${items.length} recurring item${items.length > 1 ? 's' : ''}. `;
    if (tasks.length > 0) {
      voiceText += `${tasks.length} recurring task${tasks.length > 1 ? 's' : ''}: ${tasks.slice(0, 3).map(t => t.title).join(", ")}. `;
    }
    if (reminders.length > 0) {
      voiceText += `${reminders.length} recurring reminder${reminders.length > 1 ? 's' : ''}: ${reminders.slice(0, 3).map(r => r.title).join(", ")}.`;
    }
    
    return {
      tool: "get_recurring_items",
      success: true,
      data: { items, voiceText },
    };
  } catch (error: any) {
    return { tool: "get_recurring_items", success: false, error: error.message };
  }
}

export async function executeCancelRecurringSeries(
  userId: string,
  itemType: "task" | "reminder",
  itemId: string
): Promise<ActionResult> {
  const result = await cancelRecurringSeries(userId, itemType, itemId);
  return {
    tool: "cancel_recurring_series",
    success: result.success,
    data: result.success ? {
      voiceText: `Cancelled the recurring ${itemType} series.`,
    } : undefined,
    error: result.error,
  };
}