/**
 * Voice Widget Control Service
 * Enables complete voice control of the widget dashboard
 */

import type { Widget } from "@/types/widgets";
import { WIDGET_CONFIGS } from "@/types/widgets";

export interface VoiceWidgetCommand {
  action: "add" | "remove" | "move" | "resize" | "list";
  widgetType?: string;
  widgetId?: string;
  position?: { x: number; y: number };
  size?: { w: number; h: number };
}

export interface VoiceWidgetResult {
  success: boolean;
  message: string;
  voiceResponse: string;
  action?: () => void;
}

/**
 * Parse voice command for widget operations
 */
export function parseWidgetVoiceCommand(text: string): VoiceWidgetCommand | null {
  const lower = text.toLowerCase().trim();

  // Add widget commands
  if (lower.includes("add") || lower.includes("show") || lower.includes("open")) {
    for (const [type, config] of Object.entries(WIDGET_CONFIGS)) {
      const aliases = [
        config.name.toLowerCase(),
        type.toLowerCase(),
        ...getWidgetAliases(type),
      ];

      if (aliases.some(alias => lower.includes(alias))) {
        return {
          action: "add",
          widgetType: type,
        };
      }
    }
  }

  // Remove widget commands
  if (lower.includes("remove") || lower.includes("delete") || lower.includes("close") || lower.includes("hide")) {
    for (const [type, config] of Object.entries(WIDGET_CONFIGS)) {
      const aliases = [
        config.name.toLowerCase(),
        type.toLowerCase(),
        ...getWidgetAliases(type),
      ];

      if (aliases.some(alias => lower.includes(alias))) {
        return {
          action: "remove",
          widgetType: type,
        };
      }
    }
  }

  // List widgets command
  if (
    lower.includes("what widgets") ||
    lower.includes("show widgets") ||
    lower.includes("list widgets") ||
    lower.includes("my widgets")
  ) {
    return {
      action: "list",
    };
  }

  return null;
}

/**
 * Get widget aliases for voice recognition
 */
function getWidgetAliases(type: string): string[] {
  const aliases: Record<string, string[]> = {
    time: ["clock", "time widget"],
    weather: ["weather widget", "forecast"],
    tasks: ["task widget", "to do", "todo", "task list"],
    reminders: ["reminder widget", "reminder list", "alerts"],
    notes: ["note widget", "note pad", "notepad"],
    calendar: ["calendar widget", "schedule", "events"],
    upcoming: ["coming up", "upcoming widget", "what's next"],
    contacts: ["contact widget", "contact list", "address book"],
    messages: ["message widget", "inbox", "messages"],
    location: ["map widget", "map", "location"],
    productivity: ["productivity widget", "stats", "productivity stats"],
    "ai-usage": ["ai usage", "ai widget", "ai stats"],
    "quick-actions": ["quick actions", "shortcuts"],
    "recent-activity": ["recent activity", "activity widget", "recent"],
    stocks: ["stock widget", "stock market", "stocks", "stock prices"],
    news: ["news widget", "news feed", "headlines"],
  };

  return aliases[type] || [];
}

/**
 * Execute voice widget command
 */
export function executeVoiceWidgetCommand(
  command: VoiceWidgetCommand,
  currentWidgets: Widget[]
): VoiceWidgetResult {
  switch (command.action) {
    case "add":
      return handleAddWidget(command, currentWidgets);
    case "remove":
      return handleRemoveWidget(command, currentWidgets);
    case "list":
      return handleListWidgets(currentWidgets);
    default:
      return {
        success: false,
        message: "Unknown widget command",
        voiceResponse: "I didn't understand that widget command.",
      };
  }
}

/**
 * Handle add widget command
 */
function handleAddWidget(
  command: VoiceWidgetCommand,
  currentWidgets: Widget[]
): VoiceWidgetResult {
  if (!command.widgetType) {
    return {
      success: false,
      message: "Widget type not specified",
      voiceResponse: "Which widget would you like to add?",
    };
  }

  const config = WIDGET_CONFIGS[command.widgetType];
  if (!config) {
    return {
      success: false,
      message: `Unknown widget type: ${command.widgetType}`,
      voiceResponse: `I don't know about a ${command.widgetType} widget.`,
    };
  }

  // Check if widget already exists
  const exists = currentWidgets.some(w => w.type === command.widgetType);
  if (exists) {
    return {
      success: false,
      message: `${config.name} widget already exists`,
      voiceResponse: `You already have a ${config.name} widget on your dashboard.`,
    };
  }

  // Trigger add widget via global function
  return {
    success: true,
    message: `Adding ${config.name} widget`,
    voiceResponse: `Adding ${config.name} widget to your dashboard.`,
    action: () => {
      if ((window as any).addWidgetToDashboard) {
        (window as any).addWidgetToDashboard(
          command.widgetType,
          config.defaultSize
        );
      }
    },
  };
}

/**
 * Handle remove widget command
 */
function handleRemoveWidget(
  command: VoiceWidgetCommand,
  currentWidgets: Widget[]
): VoiceWidgetResult {
  if (!command.widgetType) {
    return {
      success: false,
      message: "Widget type not specified",
      voiceResponse: "Which widget would you like to remove?",
    };
  }

  const config = WIDGET_CONFIGS[command.widgetType];
  if (!config) {
    return {
      success: false,
      message: `Unknown widget type: ${command.widgetType}`,
      voiceResponse: `I don't know about a ${command.widgetType} widget.`,
    };
  }

  // Find widget to remove
  const widget = currentWidgets.find(w => w.type === command.widgetType);
  if (!widget) {
    return {
      success: false,
      message: `${config.name} widget not found`,
      voiceResponse: `You don't have a ${config.name} widget on your dashboard.`,
    };
  }

  // Trigger remove widget via global function
  return {
    success: true,
    message: `Removing ${config.name} widget`,
    voiceResponse: `Removing ${config.name} widget from your dashboard.`,
    action: () => {
      if ((window as any).removeWidgetFromDashboard) {
        (window as any).removeWidgetFromDashboard(widget.id);
      }
    },
  };
}

/**
 * Handle list widgets command
 */
function handleListWidgets(currentWidgets: Widget[]): VoiceWidgetResult {
  if (currentWidgets.length === 0) {
    return {
      success: true,
      message: "No widgets on dashboard",
      voiceResponse: "You don't have any widgets on your dashboard yet. Would you like to add some?",
    };
  }

  const widgetNames = currentWidgets
    .map(w => WIDGET_CONFIGS[w.type]?.name || w.type)
    .join(", ");

  const count = currentWidgets.length;
  const voiceResponse = `You have ${count} widget${count !== 1 ? 's' : ''} on your dashboard: ${widgetNames}.`;

  return {
    success: true,
    message: `${count} widgets found`,
    voiceResponse,
  };
}

/**
 * Get available widgets for voice
 */
export function getAvailableWidgetsForVoice(): string {
  const widgets = Object.entries(WIDGET_CONFIGS)
    .map(([type, config]) => config.name)
    .join(", ");

  return `Available widgets: ${widgets}`;
}

/**
 * Check if text is a widget command
 */
export function isWidgetCommand(text: string): boolean {
  const lower = text.toLowerCase();
  
  const widgetKeywords = ["widget", "dashboard"];
  const actionKeywords = ["add", "remove", "delete", "show", "hide", "open", "close", "list"];
  
  const hasWidgetKeyword = widgetKeywords.some(kw => lower.includes(kw));
  const hasActionKeyword = actionKeywords.some(kw => lower.includes(kw));
  
  // Also check for specific widget names
  const hasWidgetName = Object.values(WIDGET_CONFIGS).some(config =>
    lower.includes(config.name.toLowerCase())
  );
  
  return (hasWidgetKeyword && hasActionKeyword) || 
         (hasActionKeyword && hasWidgetName);
}