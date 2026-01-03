import type { Message } from "@/types/models";
import { parseNaturalTime, ParsedTime } from "./smart-time-parser";

export interface ConversationContext {
  messages: Message[];
  lastIntent?: string;
  lastTool?: string;
  pendingAction?: {
    type: string;
    data: any;
    confirmationNeeded: boolean;
  };
  userPreferences: {
    verbosity: "brief" | "normal" | "detailed";
    confirmActions: boolean;
  };
}

export interface IntentClassification {
  intent: string;
  confidence: number;
  entities: Record<string, string>;
  requiresConfirmation: boolean;
}

// Common speech recognition corrections
const SPEECH_CORRECTIONS: Record<string, string> = {
  "to do": "todo",
  "to-do": "todo",
  "to dos": "todos",
  "to-dos": "todos",
  "remind me": "create reminder",
  "set a reminder": "create reminder",
  "set reminder": "create reminder",
  "add a task": "create task",
  "add task": "create task",
  "new task": "create task",
  "make a note": "create note",
  "take a note": "create note",
  "note that": "create note",
  "schedule": "create calendar event",
  "book": "create calendar event",
  "set up a meeting": "create calendar event",
  "what's on my": "get",
  "what is on my": "get",
  "read my": "get",
  "show my": "get",
  "list my": "get",
  "tell me my": "get",
  "summarize": "daily summary",
  "summary": "daily summary",
  "how's my day": "daily summary",
  "what's my day like": "daily summary",
  "go to": "navigate",
  "open": "navigate",
  "show me": "navigate",
  "take me to": "navigate",
};

// Normalize speech input for better understanding
export function normalizeSpeechInput(text: string): string {
  let normalized = text.toLowerCase().trim();
  
  // Apply corrections
  for (const [pattern, replacement] of Object.entries(SPEECH_CORRECTIONS)) {
    normalized = normalized.replace(new RegExp(pattern, "gi"), replacement);
  }
  
  // Remove filler words
  const fillers = ["um", "uh", "like", "you know", "basically", "actually", "so", "well"];
  for (const filler of fillers) {
    normalized = normalized.replace(new RegExp(`\\b${filler}\\b`, "gi"), "");
  }
  
  // Clean up extra spaces
  normalized = normalized.replace(/\s+/g, " ").trim();
  
  return normalized;
}

// Extract time expressions from text using smart parser
export function extractTimeExpression(text: string): {
  time: Date | null;
  remaining: string;
  isRecurring?: boolean;
  recurrenceRule?: any;
} {
  // Use the enhanced smart time parser
  const parsed = parseNaturalTime(text);
  
  if (parsed) {
    return {
      time: parsed.date,
      remaining: parsed.remainingText,
      isRecurring: parsed.isRecurring,
      recurrenceRule: parsed.recurrenceRule,
    };
  }
  
  return { time: null, remaining: text };
}

// Enhanced time extraction with recurrence support
export function extractTimeWithRecurrence(text: string): ParsedTime | null {
  return parseNaturalTime(text);
}

// Extract priority from text
export function extractPriority(text: string): { priority: string; remaining: string } {
  const priorityPatterns = [
    { pattern: /\b(urgent|urgently|asap|immediately)\b/i, priority: "urgent" },
    { pattern: /\b(high priority|important|critical)\b/i, priority: "high" },
    { pattern: /\b(low priority|whenever|not urgent)\b/i, priority: "low" },
  ];
  
  for (const { pattern, priority } of priorityPatterns) {
    if (pattern.test(text)) {
      return { priority, remaining: text.replace(pattern, "").trim() };
    }
  }
  
  return { priority: "medium", remaining: text };
}

// Build conversation context for AI
export function buildConversationContext(
  messages: Message[],
  maxMessages: number = 10
): { role: string; content: string }[] {
  const recentMessages = messages.slice(-maxMessages);
  return recentMessages.map(m => ({
    role: m.role,
    content: m.content,
  }));
}

// Generate contextual follow-up suggestions
export function generateFollowUpSuggestions(lastIntent: string, lastTool?: string): string[] {
  const suggestions: Record<string, string[]> = {
    "create_task": [
      "Would you like to set a reminder for this task?",
      "Should I add this to your calendar as well?",
    ],
    "create_reminder": [
      "Would you like me to create a task for this too?",
      "Should I set another reminder?",
    ],
    "get_tasks": [
      "Would you like me to mark any of these as complete?",
      "Should I reschedule any overdue tasks?",
    ],
    "daily_summary": [
      "Would you like more details on any of these?",
      "Should I read your tasks or reminders?",
    ],
    "navigate": [
      "Is there anything else you'd like me to help with?",
    ],
  };
  
  return suggestions[lastIntent] || suggestions[lastTool || ""] || [];
}

// Detect if user is asking for confirmation
export function isConfirmation(text: string): boolean {
  const confirmPatterns = /\b(yes|yeah|yep|sure|ok|okay|confirm|do it|go ahead|please|correct|right)\b/i;
  return confirmPatterns.test(text);
}

// Detect if user is declining
export function isDeclination(text: string): boolean {
  const declinePatterns = /\b(no|nope|nah|cancel|stop|don't|never mind|forget it)\b/i;
  return declinePatterns.test(text);
}