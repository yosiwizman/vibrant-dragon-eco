import { showSuccess } from "@/utils/toast";

export interface NavigationRoute {
  path: string;
  aliases: string[];
  description: string;
}

export const APP_ROUTES: NavigationRoute[] = [
  { path: "/", aliases: ["home", "dashboard", "main", "start", "index"], description: "Home dashboard" },
  { path: "/voice", aliases: ["voice", "voice chat", "talk", "speak", "conversation", "voice mode"], description: "Voice chat" },
  { path: "/chat", aliases: ["chat", "text", "text chat", "message", "type"], description: "Text chat" },
  { path: "/tasks", aliases: ["tasks", "to do", "todo", "to-do", "to do list", "task list", "todos"], description: "Tasks and to-dos" },
  { path: "/reminders", aliases: ["reminders", "reminder", "alarms", "alarm", "alerts"], description: "Reminders" },
  { path: "/notes", aliases: ["notes", "note", "notebook", "notepad", "memos"], description: "Notes" },
  { path: "/calendar", aliases: ["calendar", "schedule", "events", "appointments", "meetings"], description: "Calendar" },
  { path: "/contacts", aliases: ["contacts", "contact", "people", "address book", "phonebook"], description: "Contacts" },
  { path: "/messages", aliases: ["messages", "sms", "email", "emails", "texts", "inbox"], description: "Messages" },
  { path: "/notifications", aliases: ["notifications", "notification", "alerts", "bell"], description: "Notifications" },
  { path: "/knowledge", aliases: ["knowledge", "memory", "facts", "info", "information"], description: "Knowledge" },
  { path: "/knowledge-base", aliases: ["knowledge base", "rag", "documents", "document base", "my documents", "stored knowledge"], description: "Knowledge Base (RAG)" },
  { path: "/tools", aliases: ["tools", "utilities", "search", "web search"], description: "Tools" },
  { path: "/settings", aliases: ["settings", "preferences", "config", "configuration", "options"], description: "Settings" },
  { path: "/profile", aliases: ["profile", "account", "my account", "user"], description: "User profile" },
  { path: "/integrations", aliases: ["integrations", "apps", "connections", "services", "api"], description: "Integrations" },
  { path: "/history", aliases: ["history", "past", "previous"], description: "History" },
  { path: "/appointments", aliases: ["appointments", "appointment", "bookings", "booking", "scheduled meetings"], description: "Appointments" },
  { path: "/ai-logs", aliases: ["ai logs", "ai log", "ai history", "ai activity", "logs", "activity log"], description: "AI Logs" },
  { path: "/drafts", aliases: ["drafts", "draft", "email drafts", "sms drafts", "message drafts"], description: "Drafts" },
  { path: "/booking-tasks", aliases: ["booking tasks", "booking", "bookings", "call tasks", "phone tasks"], description: "Booking Tasks" },
  { path: "/documents", aliases: ["documents", "document", "files", "uploads", "my files", "my documents"], description: "Documents" },
];

export function findRouteByVoiceCommand(command: string): NavigationRoute | null {
  const normalizedCommand = command.toLowerCase().trim();
  
  // Direct path match
  for (const route of APP_ROUTES) {
    if (normalizedCommand === route.path || normalizedCommand === route.path.slice(1)) {
      return route;
    }
  }
  
  // Alias match (exact)
  for (const route of APP_ROUTES) {
    for (const alias of route.aliases) {
      if (normalizedCommand === alias || normalizedCommand.includes(alias)) {
        return route;
      }
    }
  }
  
  // Fuzzy match - check if command contains any alias
  for (const route of APP_ROUTES) {
    for (const alias of route.aliases) {
      if (normalizedCommand.includes(alias) || alias.includes(normalizedCommand)) {
        return route;
      }
    }
  }
  
  return null;
}

export function parseNavigationIntent(text: string): { shouldNavigate: boolean; route: NavigationRoute | null; action: string } {
  const normalizedText = text.toLowerCase();
  
  // Navigation trigger phrases
  const navigationPhrases = [
    "go to", "open", "show", "navigate to", "take me to", "switch to",
    "let me see", "show me", "bring up", "pull up", "display"
  ];
  
  for (const phrase of navigationPhrases) {
    if (normalizedText.includes(phrase)) {
      // Extract the destination after the phrase
      const afterPhrase = normalizedText.split(phrase)[1]?.trim();
      if (afterPhrase) {
        const route = findRouteByVoiceCommand(afterPhrase);
        if (route) {
          return { shouldNavigate: true, route, action: phrase };
        }
      }
    }
  }
  
  // Check for direct page mentions without trigger phrases
  const route = findRouteByVoiceCommand(normalizedText);
  if (route && (normalizedText.includes("page") || normalizedText.includes("screen"))) {
    return { shouldNavigate: true, route, action: "open" };
  }
  
  return { shouldNavigate: false, route: null, action: "" };
}

export function getNavigationSuggestion(failedCommand: string): string {
  const suggestions = APP_ROUTES.map(r => r.aliases[0]).slice(0, 5);
  return `I couldn't find that page. Try saying: "Open ${suggestions.join('", "Open ')}"`;
}