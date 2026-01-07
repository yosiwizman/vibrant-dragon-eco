"use client";

import { offlineManager } from "./offline-manager";
import { supabase } from "@/integrations/supabase/client";

interface ToolCall {
  tool: string;
  params: Record<string, any>;
}

interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  queued?: boolean;
}

// Tools that work completely offline
const OFFLINE_TOOLS = new Set([
  'create_task',
  'create_reminder',
  'create_note',
  'create_event',
  'create_contact',
  'update_task',
  'update_reminder',
  'update_note',
  'delete_task',
  'delete_reminder',
  'delete_note',
  'search_tasks',
  'search_notes',
  'search_contacts',
  'get_calendar',
  'get_tasks',
  'get_reminders',
  'navigate_to',
]);

// Tools that require online but can be queued
const QUEUEABLE_TOOLS = new Set([
  'web_search',
  'send_email',
  'send_sms',
  'get_weather',
  'get_directions',
]);

/**
 * Execute tool offline or queue for later
 */
export async function executeToolOffline(
  userId: string,
  toolCall: ToolCall
): Promise<ToolResult> {
  const isOnline = navigator.onLine;
  const { tool, params } = toolCall;

  // Execute offline tools immediately
  if (OFFLINE_TOOLS.has(tool)) {
    return await executeLocalTool(userId, tool, params);
  }

  // Queue online-only tools if offline
  if (!isOnline && QUEUEABLE_TOOLS.has(tool)) {
    await offlineManager.queueOperation('tools', 'insert', {
      user_id: userId,
      tool,
      params,
      timestamp: Date.now(),
    });

    return {
      success: true,
      queued: true,
      data: {
        message: `${tool} queued for when you're back online`,
      },
    };
  }

  // Execute online tools if online
  if (isOnline) {
    return await executeOnlineTool(userId, tool, params);
  }

  // Tool not supported offline
  return {
    success: false,
    error: `${tool} requires internet connection`,
  };
}

/**
 * Execute local tools (work offline)
 */
async function executeLocalTool(
  userId: string,
  tool: string,
  params: any
): Promise<ToolResult> {
  try {
    switch (tool) {
      case 'create_task':
        return await createTaskOffline(userId, params);
      
      case 'create_reminder':
        return await createReminderOffline(userId, params);
      
      case 'create_note':
        return await createNoteOffline(userId, params);
      
      case 'create_event':
        return await createEventOffline(userId, params);
      
      case 'search_tasks':
        return await searchTasksOffline(userId, params);
      
      case 'search_notes':
        return await searchNotesOffline(userId, params);
      
      case 'get_calendar':
        return await getCalendarOffline(userId, params);
      
      case 'navigate_to':
        return { success: true, data: { path: params.path } };
      
      default:
        return { success: false, error: `Unknown tool: ${tool}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Execute online tools
 */
async function executeOnlineTool(
  userId: string,
  tool: string,
  params: any
): Promise<ToolResult> {
  // Implement online tool execution
  // This would call Supabase or external APIs
  return { success: true, data: {} };
}

// Local tool implementations
async function createTaskOffline(userId: string, params: any): Promise<ToolResult> {
  const task = {
    id: `temp-${Date.now()}`,
    user_id: userId,
    title: params.title,
    description: params.description,
    priority: params.priority || 'medium',
    status: 'pending',
    due_date: params.due_date,
    created_at: new Date().toISOString(),
  };

  // Queue for sync
  await offlineManager.queueOperation('tasks', 'insert', task);

  return {
    success: true,
    data: {
      task,
      voiceText: `I've added "${params.title}" to your tasks.`,
    },
  };
}

async function createReminderOffline(userId: string, params: any): Promise<ToolResult> {
  const reminder = {
    id: `temp-${Date.now()}`,
    user_id: userId,
    text: params.text,
    due_time: params.due_time,
    channel: params.channel || 'push',
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  await offlineManager.queueOperation('reminders', 'insert', reminder);

  return {
    success: true,
    data: {
      reminder,
      voiceText: `I've set a reminder: ${params.text}`,
    },
  };
}

async function createNoteOffline(userId: string, params: any): Promise<ToolResult> {
  const note = {
    id: `temp-${Date.now()}`,
    user_id: userId,
    title: params.title,
    content: params.content,
    tags: params.tags || [],
    pinned: false,
    created_at: new Date().toISOString(),
  };

  await offlineManager.queueOperation('notes', 'insert', note);

  return {
    success: true,
    data: {
      note,
      voiceText: `I've saved your note: ${params.title}`,
    },
  };
}

async function createEventOffline(userId: string, params: any): Promise<ToolResult> {
  const event = {
    id: `temp-${Date.now()}`,
    user_id: userId,
    title: params.title,
    start_time: params.start_time,
    end_time: params.end_time,
    location: params.location,
    created_at: new Date().toISOString(),
  };

  await offlineManager.queueOperation('calendar_events', 'insert', event);

  return {
    success: true,
    data: {
      event,
      voiceText: `I've added "${params.title}" to your calendar.`,
    },
  };
}

async function searchTasksOffline(userId: string, params: any): Promise<ToolResult> {
  const cached = await offlineManager.getCachedData('tasks');
  
  if (!cached) {
    return { success: false, error: 'No cached tasks available' };
  }

  const query = params.query?.toLowerCase() || '';
  const results = cached.filter((task: any) => 
    task.title?.toLowerCase().includes(query) ||
    task.description?.toLowerCase().includes(query)
  );

  return {
    success: true,
    data: {
      tasks: results,
      voiceText: `I found ${results.length} task${results.length !== 1 ? 's' : ''}.`,
    },
  };
}

async function searchNotesOffline(userId: string, params: any): Promise<ToolResult> {
  const cached = await offlineManager.getCachedData('notes');
  
  if (!cached) {
    return { success: false, error: 'No cached notes available' };
  }

  const query = params.query?.toLowerCase() || '';
  const results = cached.filter((note: any) => 
    note.title?.toLowerCase().includes(query) ||
    note.content?.toLowerCase().includes(query)
  );

  return {
    success: true,
    data: {
      notes: results,
      voiceText: `I found ${results.length} note${results.length !== 1 ? 's' : ''}.`,
    },
  };
}

async function getCalendarOffline(userId: string, params: any): Promise<ToolResult> {
  const cached = await offlineManager.getCachedData('calendar_events');
  
  if (!cached) {
    return { success: false, error: 'No cached calendar data available' };
  }

  return {
    success: true,
    data: {
      events: cached,
      voiceText: `You have ${cached.length} event${cached.length !== 1 ? 's' : ''} on your calendar.`,
    },
  };
}