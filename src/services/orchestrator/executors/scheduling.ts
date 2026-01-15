import { ActionResult } from '../types';
import {
  checkScheduleConflicts,
  getSchedulingSuggestions,
  getDailyScheduleAnalysis,
  learnUserPatterns,
  createPatternBasedReminder,
} from "@/services/smart-scheduling";

export async function executeCheckScheduleConflicts(
  userId: string,
  startTime: string,
  endTime: string,
  title: string,
  estimatedDuration?: number
): Promise<ActionResult> {
  try {
    const conflicts = await checkScheduleConflicts(
      userId,
      new Date(startTime),
      new Date(endTime),
      title,
      estimatedDuration
    );

    if (conflicts.length === 0) {
      return {
        tool: "check_schedule_conflicts",
        success: true,
        data: {
          hasConflicts: false,
          conflicts: [],
          voiceText: "This time slot is available. No conflicts found.",
        },
      };
    }

    const conflictMessages = conflicts.map(c => c.message).join(" Also, ");
    const suggestions = conflicts.flatMap(c => c.suggestions).slice(0, 3);

    return {
      tool: "check_schedule_conflicts",
      success: true,
      data: {
        hasConflicts: true,
        conflicts,
        suggestions,
        voiceText: `I found some scheduling issues. ${conflictMessages}. ${suggestions.length > 0 ? `Alternative times: ${suggestions.join(", ")}` : ""}`,
      },
    };
  } catch (error: any) {
    return { tool: "check_schedule_conflicts", success: false, error: error.message };
  }
}

export async function executeGetSchedulingSuggestions(
  userId: string,
  taskTitle: string,
  estimatedDuration: number = 30,
  preferredDate?: string
): Promise<ActionResult> {
  try {
    const suggestions = await getSchedulingSuggestions(
      userId,
      taskTitle,
      estimatedDuration,
      preferredDate ? new Date(preferredDate) : undefined
    );

    if (suggestions.length === 0) {
      return {
        tool: "get_scheduling_suggestions",
        success: true,
        data: {
          suggestions: [],
          voiceText: "I don't have enough data yet to make scheduling suggestions. Keep using the app and I'll learn your patterns!",
        },
      };
    }

    const topSuggestions = suggestions.slice(0, 3);
    const voiceText = topSuggestions.map(s => s.message).join(" ");

    return {
      tool: "get_scheduling_suggestions",
      success: true,
      data: {
        suggestions: topSuggestions,
        voiceText,
      },
    };
  } catch (error: any) {
    return { tool: "get_scheduling_suggestions", success: false, error: error.message };
  }
}

export async function executeGetScheduleAnalysis(userId: string): Promise<ActionResult> {
  try {
    const analysis = await getDailyScheduleAnalysis(userId);

    let voiceText = `Today you have ${analysis.totalEvents} scheduled items taking about ${analysis.busyHours} hours. `;
    
    if (analysis.freeSlots.length > 0) {
      const freeSlot = analysis.freeSlots[0];
      const startTime = freeSlot.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      const endTime = freeSlot.end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      voiceText += `Your next free slot is from ${startTime} to ${endTime}. `;
    }

    if (analysis.patternAlerts.length > 0) {
      voiceText += analysis.patternAlerts.join(" ");
    }

    return {
      tool: "get_schedule_analysis",
      success: true,
      data: {
        ...analysis,
        voiceText,
      },
    };
  } catch (error: any) {
    return { tool: "get_schedule_analysis", success: false, error: error.message };
  }
}

export async function executeLearnUserPatterns(userId: string): Promise<ActionResult> {
  try {
    const patterns = await learnUserPatterns(userId);

    if (patterns.length === 0) {
      return {
        tool: "learn_user_patterns",
        success: true,
        data: {
          patterns: [],
          voiceText: "I haven't learned enough patterns yet. Keep using the app and I'll start recognizing your routines!",
        },
      };
    }

    const highConfidencePatterns = patterns.filter(p => p.confidence > 0.6);
    let voiceText = `I've learned ${patterns.length} patterns about your schedule. `;
    
    if (highConfidencePatterns.length > 0) {
      const examples = highConfidencePatterns.slice(0, 2).map(p =>
        `${p.activity} on ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][p.dayOfWeek || 0]}s at ${p.timeOfDay}`
      );
      voiceText += `For example: ${examples.join(", and ")}.`;
    }

    return {
      tool: "learn_user_patterns",
      success: true,
      data: {
        patterns,
        voiceText,
      },
    };
  } catch (error: any) {
    return { tool: "learn_user_patterns", success: false, error: error.message };
  }
}

export async function executeCreatePatternReminder(
  userId: string,
  activity: string,
  dayOfWeek: number,
  time: string,
  leadTimeMinutes: number = 30
): Promise<ActionResult> {
  try {
    const pattern = {
      id: `manual-${Date.now()}`,
      userId,
      patternType: "recurring_activity" as const,
      dayOfWeek,
      timeOfDay: time,
      activity,
      confidence: 1,
      occurrences: 1,
      lastSeen: new Date(),
    };

    const result = await createPatternBasedReminder(userId, pattern, leadTimeMinutes);

    if (!result.success) {
      return { tool: "create_pattern_reminder", success: false, error: result.error };
    }

    const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek];

    return {
      tool: "create_pattern_reminder",
      success: true,
      data: {
        reminderId: result.reminderId,
        voiceText: `Got it! I'll remind you ${leadTimeMinutes} minutes before "${activity}" every ${dayName} at ${time}. I've also saved this pattern so I'll learn to remind you automatically.`,
      },
    };
  } catch (error: any) {
    return { tool: "create_pattern_reminder", success: false, error: error.message };
  }
}