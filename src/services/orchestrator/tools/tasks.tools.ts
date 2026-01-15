import { ToolDefinition } from '../types';

export const TASK_TOOLS: ToolDefinition[] = [
  {
    name: "create_task",
    description: "Create a to-do task",
    parameters: {
      title: "string",
      description: "string",
      priority: "low|medium|high|urgent",
      due_date: "ISO datetime string",
      tags: "string[] (optional)",
    },
    category: "tasks",
  },
  {
    name: "get_tasks",
    description: "Get user's tasks",
    parameters: {
      status: "pending|completed|all",
      priority: "low|medium|high|urgent (optional)",
      limit: "number (optional)",
    },
    category: "tasks",
  },
  {
    name: "complete_task",
    description: "Mark a task as completed",
    parameters: {
      task_id: "string",
      or: "task_title: string (to find by title)",
    },
    category: "tasks",
  },
  {
    name: "update_task",
    description: "Update a task's title, description, or priority",
    parameters: {
      task_id: "string (optional)",
      task_title: "string (optional, to find by title)",
      new_title: "string (optional)",
      new_description: "string (optional)",
      new_priority: "low|medium|high|urgent (optional)",
    },
    category: "tasks",
  },
  {
    name: "reschedule_task",
    description: "Reschedule a task to a new date",
    parameters: {
      task_id: "string (optional)",
      task_title: "string (optional, to find by title)",
      new_due_date: "ISO datetime string",
    },
    category: "tasks",
  },
  {
    name: "get_overdue_tasks",
    description: "Get all overdue tasks",
    parameters: {},
    category: "tasks",
  },
  {
    name: "delete_task",
    description: "Delete a task permanently",
    parameters: {
      task_id: "string (optional)",
      task_title: "string (optional, to find by title)",
    },
    category: "tasks",
  },
  {
    name: "get_task_stats",
    description: "Get task statistics including completion rate and priority breakdown",
    parameters: { days: "number (default: 7)" },
    category: "tasks",
  },
];