/**
 * Voice Widget Positioning Service
 * Enables moving widgets by voice commands
 */

import type { Widget } from "@/types/widgets";
import { WIDGET_CONFIGS } from "@/types/widgets";

// Grid configuration (must match WidgetGrid.tsx)
const GRID_COLS = 4;

export interface VoiceMoveCommand {
  action: "move";
  widgetType: string;
  direction?: "up" | "down" | "left" | "right";
  position?: "top" | "bottom" | "start" | "end" | "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export interface VoiceMoveResult {
  success: boolean;
  message: string;
  voiceResponse: string;
  action?: () => void;
}

/**
 * Parse voice command for moving widgets
 */
export function parseMoveVoiceCommand(text: string): VoiceMoveCommand | null {
  const lower = text.toLowerCase().trim();
  
  if (!lower.includes("move")) return null;

  // Extract widget type
  let widgetType = "";
  for (const [type, config] of Object.entries(WIDGET_CONFIGS)) {
    if (lower.includes(config.name.toLowerCase()) || lower.includes(type.toLowerCase())) {
      widgetType = type;
      break;
    }
  }

  if (!widgetType) return null;

  // Check directions
  if (lower.includes("up")) return { action: "move", widgetType, direction: "up" };
  if (lower.includes("down")) return { action: "move", widgetType, direction: "down" };
  if (lower.includes("left")) return { action: "move", widgetType, direction: "left" };
  if (lower.includes("right")) return { action: "move", widgetType, direction: "right" };

  // Check absolute positions
  if (lower.includes("top left")) return { action: "move", widgetType, position: "top-left" };
  if (lower.includes("top right")) return { action: "move", widgetType, position: "top-right" };
  if (lower.includes("bottom left")) return { action: "move", widgetType, position: "bottom-left" };
  if (lower.includes("bottom right")) return { action: "move", widgetType, position: "bottom-right" };
  if (lower.includes("top")) return { action: "move", widgetType, position: "top" };
  if (lower.includes("bottom")) return { action: "move", widgetType, position: "bottom" };
  
  return null;
}

/**
 * Execute move command
 */
export function executeVoiceMoveCommand(
  command: VoiceMoveCommand,
  currentWidgets: Widget[],
  updateWidgets: (widgets: Widget[]) => void
): VoiceMoveResult {
  const widgetIndex = currentWidgets.findIndex(w => w.type === command.widgetType);
  
  if (widgetIndex === -1) {
    return {
      success: false,
      message: "Widget not found",
      voiceResponse: `I couldn't find the ${WIDGET_CONFIGS[command.widgetType]?.name || command.widgetType} widget on your dashboard.`,
    };
  }

  const widget = { ...currentWidgets[widgetIndex] };
  const newWidgets = [...currentWidgets];
  
  // Calculate max row
  const maxRow = Math.max(...currentWidgets.map(w => w.y + w.h), 0);

  if (command.direction) {
    // Relative movement
    switch (command.direction) {
      case "up":
        widget.y = Math.max(0, widget.y - 1);
        break;
      case "down":
        widget.y = widget.y + 1;
        break;
      case "left":
        widget.x = Math.max(0, widget.x - 1);
        break;
      case "right":
        widget.x = Math.max(0, Math.min(GRID_COLS - widget.w, widget.x + 1));
        break;
    }
  } else if (command.position) {
    // Absolute positioning
    switch (command.position) {
      case "top-left":
        widget.x = 0;
        widget.y = 0;
        break;
      case "top-right":
        widget.x = Math.max(0, GRID_COLS - widget.w);
        widget.y = 0;
        break;
      case "bottom-left":
        widget.x = 0;
        widget.y = maxRow;
        break;
      case "bottom-right":
        widget.x = Math.max(0, GRID_COLS - widget.w);
        widget.y = maxRow;
        break;
      case "top":
        widget.y = 0;
        break;
      case "bottom":
        widget.y = maxRow;
        break;
    }
  }

  // Update widget in array
  newWidgets[widgetIndex] = widget;
  
  // Execute update
  return {
    success: true,
    message: `Moved ${WIDGET_CONFIGS[widget.type].name} widget`,
    voiceResponse: `Moved the ${WIDGET_CONFIGS[widget.type].name} widget.`,
    action: () => updateWidgets(newWidgets),
  };
}