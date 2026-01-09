/**
 * Orchestrator Layouts Extension
 * Handles layout switching commands
 */

import type { ActionResult } from "./orchestrator";
import { getLayout, hydrateLayout } from "./voice-layouts";

export async function executeSwitchLayout(layoutName: string): Promise<ActionResult> {
  const setWidgets = (window as any).setWidgets;
  
  if (!setWidgets) {
    return {
      tool: "switch_layout",
      success: false,
      error: "Widget system not ready",
    };
  }

  const layoutTemplate = getLayout(layoutName);
  
  if (!layoutTemplate) {
    return {
      tool: "switch_layout",
      success: false,
      error: `Unknown layout: ${layoutName}`,
      data: {
        voiceText: `I don't have a layout called "${layoutName}". You can try "productivity", "finance", "morning", or "default".`,
      }
    };
  }

  const newWidgets = hydrateLayout(layoutTemplate);
  setWidgets(newWidgets);

  return {
    tool: "switch_layout",
    success: true,
    data: {
      layout: layoutName,
      voiceText: `Switched dashboard to ${layoutName} layout.`,
    },
  };
}

export const LAYOUT_TOOLS = [
  {
    name: "switch_layout",
    description: "Switch dashboard to a preset layout. Use when user says 'switch to [mode] mode', 'reset dashboard', 'use [layout] layout'.",
    parameters: {
      layout: "string (e.g. 'productivity', 'finance', 'morning', 'default')"
    },
    category: "widgets"
  }
];