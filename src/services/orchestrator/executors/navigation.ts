import { ActionResult } from '../types';
import { findRouteByVoiceCommand, APP_ROUTES } from "@/services/voice-navigation";

export function executeNavigateTo(page: string): ActionResult {
  const route = findRouteByVoiceCommand(page);
  
  if (route) {
    return {
      tool: "navigate_to",
      success: true,
      data: {
        path: route.path,
        description: route.description,
        voiceText: `Opening ${route.description}.`,
      },
    };
  }
  
  const availablePages = APP_ROUTES.map(r => r.aliases[0]).slice(0, 10).join(", ");
  return {
    tool: "navigate_to",
    success: false,
    error: `Page "${page}" not found. Try: ${availablePages}`,
  };
}