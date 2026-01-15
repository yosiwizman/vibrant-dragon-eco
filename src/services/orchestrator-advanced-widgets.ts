/**
 * Orchestrator Advanced Widget Extension
 * Adds voice control for widget positioning and configuration
 */

import type { ActionResult } from "./orchestrator/types";
import type { Widget } from "@/types/widgets";
import { executeVoiceMoveCommand, parseMoveVoiceCommand } from "./voice-widget-positioning";

/**
 * Move a widget on the dashboard
 */
export async function executeMoveWidget(
  widgetType: string,
  destination: string
): Promise<ActionResult> {
  const currentWidgets = (window as any).getCurrentWidgets?.() || [];
  const setWidgets = (window as any).setWidgets;
  
  if (!setWidgets) {
    return {
      tool: "move_widget",
      success: false,
      error: "Widget system not ready",
    };
  }

  // Construct a pseudo-command string to reuse the parser logic
  // or manually construct the command object
  let commandText = `move ${widgetType} ${destination}`;
  const command = parseMoveVoiceCommand(commandText);
  
  if (!command) {
    // Fallback if parser fails (e.g. strict matching issues)
    // Here we map "top left" etc manually if needed, but parser should handle it
     return {
      tool: "move_widget",
      success: false,
      error: `Could not understand move command for ${widgetType} to ${destination}`,
    };
  }
  
  // Override widgetType from parameter just in case parser got it wrong or user was specific
  command.widgetType = widgetType;

  const result = executeVoiceMoveCommand(command, currentWidgets, setWidgets);

  if (result.success && result.action) {
    result.action();
    return {
      tool: "move_widget",
      success: true,
      data: {
        voiceText: result.voiceResponse,
      },
    };
  }

  return {
    tool: "move_widget",
    success: false,
    error: result.message,
    data: {
      voiceText: result.voiceResponse,
    },
  };
}

// Note: Widget tools are now defined in src/services/orchestrator/tools/widgets.tools.ts
// Import from there if needed: import { WIDGET_TOOLS } from './orchestrator/tools/widgets.tools';