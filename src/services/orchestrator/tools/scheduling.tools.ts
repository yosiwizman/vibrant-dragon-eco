import { ToolDefinition } from '../types';

export const SCHEDULING_TOOLS: ToolDefinition[] = [
  {
    name: "check_schedule_conflicts",
    description: "Check if a proposed time conflicts with existing events, tasks, or appointments. Use this BEFORE creating any scheduled item.",
    parameters: {
      start_time: "ISO datetime",
      end_time: "ISO datetime",
      title: "string",
      estimated_duration: "number (minutes, optional)",
    },
    category: "scheduling",
  },
  {
    name: "get_scheduling_suggestions",
    description: "Get AI-powered suggestions for the best time to schedule a task or event based on user's patterns and availability",
    parameters: {
      task_title: "string",
      estimated_duration: "number (minutes, default 30)",
      preferred_date: "ISO date (optional)",
    },
    category: "scheduling",
  },
  {
    name: "get_schedule_analysis",
    description: "Get a comprehensive analysis of the user's daily schedule including busy hours, free slots, and pattern-based alerts",
    parameters: {},
    category: "scheduling",
  },
  {
    name: "learn_user_patterns",
    description: "Analyze user's behavior patterns for scheduling optimization. Returns learned routines and preferences.",
    parameters: {},
    category: "scheduling",
  },
  {
    name: "create_pattern_reminder",
    description: "Create an automatic reminder based on a learned pattern (e.g., 'pick up daughter from school every Wednesday at 2pm')",
    parameters: {
      activity: "string",
      day_of_week: "number (0-6, Sunday-Saturday)",
      time: "HH:mm format",
      lead_time_minutes: "number (default: 30)",
    },
    category: "scheduling",
  },
];