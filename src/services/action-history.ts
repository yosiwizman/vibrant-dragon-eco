import { supabase } from "@/integrations/supabase/client";

export interface ActionRecord {
  id: string;
  userId: string;
  actionType: "create" | "update" | "delete" | "complete";
  entityType: "task" | "reminder" | "note" | "calendar_event" | "contact";
  entityId: string;
  previousState: any;
  newState: any;
  canUndo: boolean;
  undone: boolean;
  createdAt: Date;
}

// In-memory cache for recent actions (for quick undo)
const recentActions: ActionRecord[] = [];
const MAX_CACHED_ACTIONS = 20;

/**
 * Record an action for potential undo
 */
export async function recordAction(
  userId: string,
  actionType: ActionRecord["actionType"],
  entityType: ActionRecord["entityType"],
  entityId: string,
  previousState: any,
  newState: any
): Promise<ActionRecord | null> {
  try {
    const { data, error } = await supabase
      .from("action_history")
      .insert({
        user_id: userId,
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        previous_state: previousState,
        new_state: newState,
        can_undo: true,
        undone: false,
      })
      .select()
      .single();

    if (error) throw error;

    const record: ActionRecord = {
      id: data.id,
      userId: data.user_id,
      actionType: data.action_type,
      entityType: data.entity_type,
      entityId: data.entity_id,
      previousState: data.previous_state,
      newState: data.new_state,
      canUndo: data.can_undo,
      undone: data.undone,
      createdAt: new Date(data.created_at),
    };

    // Add to cache
    recentActions.unshift(record);
    if (recentActions.length > MAX_CACHED_ACTIONS) {
      recentActions.pop();
    }

    return record;
  } catch (error) {
    console.error("Failed to record action:", error);
    return null;
  }
}

/**
 * Get the last undoable action
 */
export async function getLastUndoableAction(userId: string): Promise<ActionRecord | null> {
  // Check cache first
  const cachedAction = recentActions.find(
    a => a.userId === userId && a.canUndo && !a.undone
  );
  if (cachedAction) return cachedAction;

  try {
    const { data, error } = await supabase
      .from("action_history")
      .select("*")
      .eq("user_id", userId)
      .eq("can_undo", true)
      .eq("undone", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      actionType: data.action_type,
      entityType: data.entity_type,
      entityId: data.entity_id,
      previousState: data.previous_state,
      newState: data.new_state,
      canUndo: data.can_undo,
      undone: data.undone,
      createdAt: new Date(data.created_at),
    };
  } catch (error) {
    console.error("Failed to get last action:", error);
    return null;
  }
}

/**
 * Undo the last action
 */
export async function undoLastAction(userId: string): Promise<{
  success: boolean;
  message: string;
  action?: ActionRecord;
}> {
  const lastAction = await getLastUndoableAction(userId);

  if (!lastAction) {
    return { success: false, message: "Nothing to undo" };
  }

  // Check if action is too old (more than 5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (lastAction.createdAt < fiveMinutesAgo) {
    return { success: false, message: "This action is too old to undo" };
  }

  try {
    const tableName = getTableName(lastAction.entityType);

    switch (lastAction.actionType) {
      case "create":
        // Delete the created entity
        await supabase
          .from(tableName)
          .delete()
          .eq("id", lastAction.entityId)
          .eq("user_id", userId);
        break;

      case "update":
      case "complete":
        // Restore previous state
        await supabase
          .from(tableName)
          .update(lastAction.previousState)
          .eq("id", lastAction.entityId)
          .eq("user_id", userId);
        break;

      case "delete":
        // Re-create the deleted entity
        const { id, ...restOfState } = lastAction.previousState;
        await supabase
          .from(tableName)
          .insert({ ...restOfState, user_id: userId });
        break;
    }

    // Mark action as undone
    await supabase
      .from("action_history")
      .update({ undone: true })
      .eq("id", lastAction.id);

    // Update cache
    const cachedIndex = recentActions.findIndex(a => a.id === lastAction.id);
    if (cachedIndex !== -1) {
      recentActions[cachedIndex].undone = true;
    }

    const actionDescription = getActionDescription(lastAction);
    return {
      success: true,
      message: `Undone: ${actionDescription}`,
      action: lastAction,
    };
  } catch (error: any) {
    console.error("Failed to undo action:", error);
    return { success: false, message: `Failed to undo: ${error.message}` };
  }
}

/**
 * Get recent actions for a user
 */
export async function getRecentActions(
  userId: string,
  limit: number = 10
): Promise<ActionRecord[]> {
  try {
    const { data, error } = await supabase
      .from("action_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(d => ({
      id: d.id,
      userId: d.user_id,
      actionType: d.action_type,
      entityType: d.entity_type,
      entityId: d.entity_id,
      previousState: d.previous_state,
      newState: d.new_state,
      canUndo: d.can_undo,
      undone: d.undone,
      createdAt: new Date(d.created_at),
    }));
  } catch (error) {
    console.error("Failed to get recent actions:", error);
    return [];
  }
}

// Helper functions
function getTableName(entityType: ActionRecord["entityType"]): string {
  const tableMap: Record<string, string> = {
    task: "tasks",
    reminder: "reminders",
    note: "notes",
    calendar_event: "calendar_events",
    contact: "contacts",
  };
  return tableMap[entityType] || entityType;
}

function getActionDescription(action: ActionRecord): string {
  const entityName = action.newState?.title || action.newState?.text || action.newState?.name || action.entityType;
  
  switch (action.actionType) {
    case "create":
      return `Created ${action.entityType} "${entityName}"`;
    case "update":
      return `Updated ${action.entityType} "${entityName}"`;
    case "delete":
      return `Deleted ${action.entityType} "${entityName}"`;
    case "complete":
      return `Completed ${action.entityType} "${entityName}"`;
    default:
      return `${action.actionType} ${action.entityType}`;
  }
}

/**
 * Clear old action history (older than 24 hours)
 */
export async function cleanupOldActions(userId: string): Promise<void> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    await supabase
      .from("action_history")
      .delete()
      .eq("user_id", userId)
      .lt("created_at", oneDayAgo.toISOString());
  } catch (error) {
    console.error("Failed to cleanup old actions:", error);
  }
}