/**
 * Orchestrator Layouts Extension
 * Handles layout switching commands
 */

import type { ActionResult } from "./orchestrator/types";
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

// Note: Layout tools are now defined in src/services/orchestrator/tools/widgets.tools.ts
// The switch_layout tool is part of WIDGET_TOOLS