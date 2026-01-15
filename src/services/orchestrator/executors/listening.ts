import { ActionResult } from '../types';
import {
  startListeningSession,
  endListeningSession,
  getSessionStatus,
  getPastSessions,
} from "@/services/quiet-mode";
import { showSuccess } from "@/utils/toast";

export async function executeStartListeningMode(
  userId: string,
  context?: string
): Promise<ActionResult> {
  try {
    const session = startListeningSession(userId, context);

    return {
      tool: "start_listening_mode",
      success: true,
      data: {
        sessionId: session.id,
        voiceText: `Entering listening mode${context ? ` for ${context}` : ""}. I'll stay quiet and just listen. Say "Echo, summarize" or "end listening mode" when you're done.`,
        isListeningMode: true,
      },
    };
  } catch (error: any) {
    return { tool: "start_listening_mode", success: false, error: error.message };
  }
}

export async function executeEndListeningMode(
  userId: string,
  openaiApiKey: string
): Promise<ActionResult> {
  try {
    const result = await endListeningSession(userId, openaiApiKey);

    if (!result.success) {
      return {
        tool: "end_listening_mode",
        success: false,
        error: result.error || "Failed to end listening session",
      };
    }

    let voiceText = result.summary || "No conversation was recorded.";
    
    if (result.bulletPoints && result.bulletPoints.length > 0) {
      voiceText += ` Key points: ${result.bulletPoints.slice(0, 3).join(". ")}.`;
    }
    
    if (result.actionItems && result.actionItems.length > 0) {
      voiceText += ` Action items: ${result.actionItems.join(". ")}.`;
    }

    if (result.duration) {
      voiceText = `After ${result.duration} minutes of listening, here's what I captured. ${voiceText}`;
    }

    return {
      tool: "end_listening_mode",
      success: true,
      data: {
        summary: result.summary,
        bulletPoints: result.bulletPoints,
        actionItems: result.actionItems,
        duration: result.duration,
        voiceText,
        isListeningMode: false,
      },
    };
  } catch (error: any) {
    return { tool: "end_listening_mode", success: false, error: error.message };
  }
}

export async function executeGetListeningStatus(userId: string): Promise<ActionResult> {
  try {
    const status = getSessionStatus(userId);

    if (!status.isActive) {
      return {
        tool: "get_listening_status",
        success: true,
        data: {
          isActive: false,
          voiceText: "Listening mode is not active. Say 'go quiet' or 'listening mode' to start.",
        },
      };
    }

    return {
      tool: "get_listening_status",
      success: true,
      data: {
        isActive: true,
        duration: status.duration,
        transcriptCount: status.transcriptCount,
        voiceText: `Listening mode has been active for ${status.duration} minutes. I've captured ${status.transcriptCount} segments so far. Say "summarize" when you're ready.`,
      },
    };
  } catch (error: any) {
    return { tool: "get_listening_status", success: false, error: error.message };
  }
}

export async function executeGetListeningSessions(
  userId: string,
  limit: number = 10
): Promise<ActionResult> {
  try {
    const sessions = await getPastSessions(userId, limit);

    if (sessions.length === 0) {
      return {
        tool: "get_listening_sessions",
        success: true,
        data: {
          sessions: [],
          voiceText: "You don't have any past listening sessions.",
        },
      };
    }

    const voiceText = `You have ${sessions.length} past listening session${sessions.length > 1 ? 's' : ''}. The most recent was ${sessions[0].context || "a listening session"}.`;

    return {
      tool: "get_listening_sessions",
      success: true,
      data: {
        sessions,
        voiceText,
      },
    };
  } catch (error: any) {
    return { tool: "get_listening_sessions", success: false, error: error.message };
  }
}