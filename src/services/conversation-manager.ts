import type { Message } from "@/types/models";

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

// Extract time expressions from text
export function extractTimeExpression(text: string): { time: Date | null; remaining: string } {
  const now = new Date();
  let time: Date | null = null;
  let remaining = text;
  
  // Relative time patterns
  const relativePatterns = [
    { pattern: /in (\d+) minutes?/i, handler: (m: RegExpMatchArray) => new Date(now.getTime() + parseInt(m[1]) * 60000) },
    { pattern: /in (\d+) hours?/i, handler: (m: RegExpMatchArray) => new Date(now.getTime() + parseInt(m[1]) * 3600000) },
    { pattern: /in (\d+) days?/i, handler: (m: RegExpMatchArray) => new Date(now.getTime() + parseInt(m[1]) * 86400000) },
    { pattern: /tomorrow/i, handler: () => new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0) },
    { pattern: /next week/i, handler: () => new Date(now.getTime() + 7 * 86400000) },
    { pattern: /tonight/i, handler: () => new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0) },
    { pattern: /this evening/i, handler: () => new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0) },
    { pattern: /this afternoon/i, handler: () => new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0) },
    { pattern: /this morning/i, handler: () => new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0) },
  ];
  
  for (const { pattern, handler } of relativePatterns) {
    const match = text.match(pattern);
    if (match) {
      time = handler(match);
      remaining = text.replace(pattern, "").trim();
      break;
    }
  }
  
  // Absolute time patterns (e.g., "at 3pm", "at 15:00")
  const absolutePattern = /at (\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const absoluteMatch = text.match(absolutePattern);
  if (absoluteMatch && !time) {
    let hours = parseInt(absoluteMatch[1]);
    const minutes = absoluteMatch[2] ? parseInt(absoluteMatch[2]) : 0;
    const meridiem = absoluteMatch[3]?.toLowerCase();
    
    if (meridiem === "pm" && hours < 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
    
    time = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    if (time < now) {
      time.setDate(time.getDate() + 1); // If time has passed, assume tomorrow
    }
    remaining = text.replace(absolutePattern, "").trim();
  }
  
  return { time, remaining };
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