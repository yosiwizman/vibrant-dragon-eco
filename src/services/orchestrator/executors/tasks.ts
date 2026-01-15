import { supabase } from "@/integrations/supabase/client";
import { ActionResult } from '../types';
import { recordAction } from "@/services/action-history";
import { processRecurringCompletion, createRecurringTask } from "@/services/recurrence";
import { recurrenceToString } from "@/services/smart-time-parser";

export async function executeCreateTask(
  userId: string,
  title: string,
  description?: string,
  priority: string = "medium",
  dueDate?: string,
  tags?: string[]
): Promise<ActionResult> {
  try {
    const { data, error } = await supabase.from("tasks").insert({
      user_id: userId,
      title,
      description,
      priority,
      due_date: dueDate,
      tags,
      status: "pending",
    }).select().single();

    if (error) throw error;

    await recordAction(userId, "create", "task", data.id, null, data);

    let voiceText = `Task created: "${title}"`;
    if (priority === "urgent" || priority === "high") {
      voiceText += ` with ${priority} priority`;
    }
    if (dueDate) {
      voiceText += `, due ${new Date(dueDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`;
    }
    voiceText += ".";

    return {
      tool: "create_task",
      success: true,
      data: { ...data, voiceText },
    };
  } catch (error: any) {
    return {
      tool: "create_task",
      success: false,
      error: error.message,
    };
  }
}

export async function executeGetTasks(
  userId: string,
  status: string = "all",
  priority?: string,
  limit?: number
): Promise<ActionResult> {
  try {
    let query = supabase.from("tasks").select("*").eq("user_id", userId);
    
    if (status !== "all") {
      query = query.eq("status", status);
    }
    
    if (priority) {
      query = query.eq("priority", priority);
    }
    
    query = query.order("created_at", { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;

    if (error) throw error;

    const voiceText = data && data.length > 0
      ? `You have ${data.length} ${status === "all" ? "" : status + " "}task${data.length > 1 ? 's' : ''}.`
      : `You have no ${status === "all" ? "" : status + " "}tasks.`;

    return {
      tool: "get_tasks",
      success: true,
      data: { tasks: data, voiceText },
    };
  } catch (error: any) {
    return {
      tool: "get_tasks",
      success: false,
      error: error.message,
    };
  }
}

export async function executeCompleteTask(
  userId: string,
  taskId?: string,
  taskTitle?: string
): Promise<ActionResult> {
  try {
    let query = supabase.from("tasks").select("*").eq("user_id", userId).eq("status", "pending");
    
    if (taskId) {
      query = query.eq("id", taskId);
    } else if (taskTitle) {
      query = query.ilike("title", `%${taskTitle}%`);
    } else {
      return { tool: "complete_task", success: false, error: "Either task_id or task_title is required" };
    }
    
    const { data: task, error: fetchError } = await query.single();
    if (fetchError || !task) {
      return { tool: "complete_task", success: false, error: "Task not found" };
    }

    const { data, error } = await supabase.from("tasks").update({
      status: "completed",
      completed_at: new Date().toISOString()
    }).eq("id", task.id).select().single();

    if (error) throw error;

    await recordAction(userId, "complete", "task", task.id, task, data);

    // Process recurring task if applicable
    if (task.recurrence_rule) {
      await processRecurringCompletion(userId, "task", task.id);
    }

    return {
      tool: "complete_task",
      success: true,
      data: { ...data, voiceText: `Completed task: "${data.title}". Great job!` },
    };
  } catch (error: any) {
    return {
      tool: "complete_task",
      success: false,
      error: error.message,
    };
  }
}

export async function executeUpdateTask(
  userId: string,
  taskId?: string,
  taskTitle?: string,
  newTitle?: string,
  newDescription?: string,
  newPriority?: string
): Promise<ActionResult> {
  try {
    let query = supabase.from("tasks").select("*").eq("user_id", userId);
    
    if (taskId) {
      query = query.eq("id", taskId);
    } else if (taskTitle) {
      query = query.ilike("title", `%${taskTitle}%`);
    } else {
      return { tool: "update_task", success: false, error: "Either task_id or task_title is required" };
    }
    
    const { data: task, error: fetchError } = await query.single();
    if (fetchError || !task) {
      return { tool: "update_task", success: false, error: "Task not found" };
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (newTitle) updates.title = newTitle;
    if (newDescription) updates.description = newDescription;
    if (newPriority) updates.priority = newPriority;

    if (Object.keys(updates).length === 1) {
      return { tool: "update_task", success: false, error: "No updates provided" };
    }

    const { data, error } = await supabase.from("tasks").update(updates).eq("id", task.id).select().single();

    if (error) throw error;

    await recordAction(userId, "update", "task", task.id, task, data);

    return {
      tool: "update_task",
      success: true,
      data: {
        task: data,
        voiceText: `Task "${data.title}" updated successfully.`,
      },
    };
  } catch (error: any) {
    return {
      tool: "update_task",
      success: false,
      error: error.message,
    };
  }
}

export async function executeRescheduleTask(
  userId: string,
  newDueDate: string,
  taskId?: string,
  taskTitle?: string
): Promise<ActionResult> {
  try {
    let query = supabase.from("tasks").select("*").eq("user_id", userId);
    
    if (taskId) {
      query = query.eq("id", taskId);
    } else if (taskTitle) {
      query = query.ilike("title", `%${taskTitle}%`);
    } else {
      return { tool: "reschedule_task", success: false, error: "Either task_id or task_title is required" };
    }
    
    const { data: task, error: fetchError } = await query.single();
    if (fetchError || !task) {
      return { tool: "reschedule_task", success: false, error: "Task not found" };
    }

    const { data, error } = await supabase.from("tasks").update({
      due_date: newDueDate,
      updated_at: new Date().toISOString(),
    }).eq("id", task.id).select().single();

    if (error) throw error;

    await recordAction(userId, "update", "task", task.id, task, data);

    const newDate = new Date(newDueDate).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    return {
      tool: "reschedule_task",
      success: true,
      data: {
        task: data,
        voiceText: `Task "${data.title}" rescheduled to ${newDate}.`,
      },
    };
  } catch (error: any) {
    return {
      tool: "reschedule_task",
      success: false,
      error: error.message,
    };
  }
}

export async function executeGetOverdueTasks(userId: string): Promise<ActionResult> {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .lt("due_date", now)
      .order("due_date", { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        tool: "get_overdue_tasks",
        success: true,
        data: {
          tasks: [],
          voiceText: "Great news! You have no overdue tasks.",
        },
      };
    }

    const voiceText = `You have ${data.length} overdue task${data.length > 1 ? 's' : ''}. ${data.slice(0, 3).map((t, i) => `${i + 1}. ${t.title}`).join(". ")}`;

    return {
      tool: "get_overdue_tasks",
      success: true,
      data: {
        tasks: data,
        voiceText,
      },
    };
  } catch (error: any) {
    return {
      tool: "get_overdue_tasks",
      success: false,
      error: error.message,
    };
  }
}

export async function executeDeleteTask(
  userId: string,
  taskId?: string,
  taskTitle?: string
): Promise<ActionResult> {
  try {
    let query = supabase.from("tasks").select("*").eq("user_id", userId);
    
    if (taskId) {
      query = query.eq("id", taskId);
    } else if (taskTitle) {
      query = query.ilike("title", `%${taskTitle}%`);
    } else {
      return { tool: "delete_task", success: false, error: "Either task_id or task_title is required" };
    }

    const { data: task, error: fetchError } = await query.single();
    if (fetchError || !task) {
      return { tool: "delete_task", success: false, error: "Task not found" };
    }

    await recordAction(userId, "delete", "task", task.id, task, null);

    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (error) throw error;

    return {
      tool: "delete_task",
      success: true,
      data: {
        task,
        voiceText: `Deleted task: "${task.title}".`,
      },
    };
  } catch (error: any) {
    return { tool: "delete_task", success: false, error: error.message };
  }
}

export async function executeGetTaskStats(userId: string, days: number = 7): Promise<ActionResult> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId);

    const pending = tasks?.filter(t => t.status === "pending") || [];
    const completed = tasks?.filter(t => t.status === "completed") || [];
    const overdue = pending.filter(t => t.due_date && new Date(t.due_date) < new Date());

    const priorityBreakdown = {
      urgent: pending.filter(t => t.priority === "urgent").length,
      high: pending.filter(t => t.priority === "high").length,
      medium: pending.filter(t => t.priority === "medium").length,
      low: pending.filter(t => t.priority === "low").length,
    };

    const stats = {
      total: tasks?.length || 0,
      pending: pending.length,
      completed: completed.length,
      overdue: overdue.length,
      priorityBreakdown,
      completionRate: tasks?.length ? ((completed.length / tasks.length) * 100).toFixed(1) : 0,
    };

    return {
      tool: "get_task_stats",
      success: true,
      data: {
        ...stats,
        voiceText: `You have ${pending.length} pending tasks, ${overdue.length} overdue. ${priorityBreakdown.urgent + priorityBreakdown.high} are high priority. Your completion rate is ${stats.completionRate}%.`,
      },
    };
  } catch (error: any) {
    return { tool: "get_task_stats", success: false, error: error.message };
  }
}

export async function executeCreateRecurringTask(
  userId: string,
  title: string,
  dueDate: string,
  recurrence: string,
  interval: number = 1,
  priority: string = "medium"
): Promise<ActionResult> {
  try {
    const recurrenceRule = {
      frequency: recurrence as any,
      interval,
    };
    
    const result = await createRecurringTask(
      userId,
      title,
      undefined,
      new Date(dueDate),
      recurrenceRule,
      priority
    );
    
    if (!result.success) {
      return { tool: "create_recurring_task", success: false, error: result.error };
    }
    
    const recurrenceText = recurrenceToString(recurrenceRule);
    return {
      tool: "create_recurring_task",
      success: true,
      data: {
        task: result.data,
        voiceText: `Created recurring task: "${title}", ${recurrenceText}`,
      },
    };
  } catch (error: any) {
    return { tool: "create_recurring_task", success: false, error: error.message };
  }
}