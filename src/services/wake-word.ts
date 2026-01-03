// Wake word detection patterns
const WAKE_PATTERNS = [
  /^(hey|hi|hello|ok|okay)\s*(echo|assistant)/i,
  /^echo\b/i,
  /^assistant\b/i,
];

// Check if text starts with a wake word
export function detectWakeWord(text: string): { detected: boolean; command: string } {
  const normalized = text.trim().toLowerCase();
  
  for (const pattern of WAKE_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      // Remove the wake word and return the remaining command
      const command = normalized.replace(pattern, "").trim();
      return { detected: true, command };
    }
  }
  
  return { detected: false, command: text };
}

// Common command patterns for quick matching
export const QUICK_COMMANDS: { pattern: RegExp; action: string; description: string }[] = [
  { pattern: /^(what('s| is) the )?time/i, action: "get_current_time", description: "Get current time" },
  { pattern: /^(what('s| is) the )?weather/i, action: "get_weather", description: "Get weather" },
  { pattern: /^(open|go to|show)\s+(.+)/i, action: "navigate_to", description: "Navigate to page" },
  { pattern: /^(read|tell me|what('s| is|'re| are))\s+(my\s+)?(tasks?|to\s*do)/i, action: "read_tasks", description: "Read tasks" },
  { pattern: /^(read|tell me|what('s| is|'re| are))\s+(my\s+)?reminders?/i, action: "read_reminders", description: "Read reminders" },
  { pattern: /^(read|tell me|what('s| is|'re| are))\s+(my\s+)?notes?/i, action: "read_notes", description: "Read notes" },
  { pattern: /^(read|tell me|what('s| is|'re| are))\s+(my\s+)?(calendar|schedule|events?)/i, action: "read_calendar", description: "Read calendar" },
  { pattern: /^(summarize|summary|how('s| is))\s+(my\s+)?day/i, action: "get_daily_summary", description: "Daily summary" },
  { pattern: /^(add|create|new)\s+task/i, action: "create_task", description: "Create task" },
  { pattern: /^remind\s+me/i, action: "create_reminder", description: "Create reminder" },
  { pattern: /^(take|make|create|new)\s+(a\s+)?note/i, action: "create_note", description: "Create note" },
  { pattern: /^(schedule|create|add)\s+(a\s+)?(meeting|event|appointment)/i, action: "create_calendar_event", description: "Create event" },
  { pattern: /^search\s+(for\s+)?(.+)/i, action: "web_search", description: "Web search" },
  { pattern: /^find\s+(nearby\s+)?(.+)/i, action: "find_nearby", description: "Find nearby" },
];

// Match a quick command
export function matchQuickCommand(text: string): { matched: boolean; action: string; params?: Record<string, string> } {
  const normalized = text.trim().toLowerCase();
  
  for (const cmd of QUICK_COMMANDS) {
    const match = normalized.match(cmd.pattern);
    if (match) {
      return {
        matched: true,
        action: cmd.action,
        params: match.groups || {},
      };
    }
  }
  
  return { matched: false, action: "" };
}

// Feedback phrases for different states
export const VOICE_FEEDBACK = {
  listening: [
    "I'm listening",
    "Go ahead",
    "Yes?",
    "How can I help?",
  ],
  processing: [
    "Let me check that",
    "Working on it",
    "One moment",
    "Processing",
  ],
  success: [
    "Done!",
    "All set!",
    "Got it!",
    "Completed!",
  ],
  error: [
    "Sorry, I couldn't do that",
    "Something went wrong",
    "I had trouble with that",
  ],
  notUnderstood: [
    "I didn't catch that",
    "Could you repeat that?",
    "I'm not sure what you mean",
  ],
};

// Get a random feedback phrase
export function getRandomFeedback(type: keyof typeof VOICE_FEEDBACK): string {
  const phrases = VOICE_FEEDBACK[type];
  return phrases[Math.floor(Math.random() * phrases.length)];
}