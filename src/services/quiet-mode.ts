"use client";

import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE_SENTINEL_KEY } from "@/services/demo-mode";
import { proxyChat } from "@/services/ai-proxy";

export interface ListeningSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  transcripts: TranscriptSegment[];
  status: "active" | "paused" | "ended";
  context?: string;
  summary?: string;
  bulletPoints?: string[];
  actionItems?: string[];
}

export interface TranscriptSegment {
  timestamp: Date;
  text: string;
  speaker?: string;
  confidence?: number;
}

// In-memory storage for active sessions (would be in database for production)
const activeSessions: Map<string, ListeningSession> = new Map();

// Trigger phrases to exit quiet mode
const EXIT_PHRASES = [
  "echo wake up",
  "hey echo",
  "ok echo",
  "echo come back",
  "end listening mode",
  "stop listening mode",
  "exit quiet mode",
  "summarize now",
  "what did you hear",
  "give me the summary",
];

// Trigger phrases to enter quiet mode
const ENTER_PHRASES = [
  "go quiet",
  "quiet mode",
  "listening mode",
  "just listen",
  "don't interrupt",
  "stay quiet",
  "silent mode",
  "observe mode",
  "meeting mode",
];

// Check if text contains an exit phrase
export function isExitPhrase(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  return EXIT_PHRASES.some(phrase => normalized.includes(phrase));
}

// Check if text contains an enter phrase
export function isEnterPhrase(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  return ENTER_PHRASES.some(phrase => normalized.includes(phrase));
}

// Start a new listening session
export function startListeningSession(
  userId: string,
  context?: string
): ListeningSession {
  const session: ListeningSession = {
    id: `session-${Date.now()}`,
    userId,
    startTime: new Date(),
    transcripts: [],
    status: "active",
    context,
  };

  activeSessions.set(userId, session);
  
  // Save to database for persistence
  saveSessionToDatabase(session);
  
  return session;
}

// Add transcript to active session
export function addTranscript(
  userId: string,
  text: string,
  speaker?: string
): boolean {
  const session = activeSessions.get(userId);
  if (!session || session.status !== "active") {
    return false;
  }

  session.transcripts.push({
    timestamp: new Date(),
    text,
    speaker,
  });

  return true;
}

// End listening session and generate summary
export async function endListeningSession(
  userId: string,
  openaiApiKey: string
): Promise<{
  success: boolean;
  summary?: string;
  bulletPoints?: string[];
  actionItems?: string[];
  duration?: number;
  error?: string;
}> {
  const session = activeSessions.get(userId);
  if (!session) {
    return { success: false, error: "No active listening session" };
  }

  session.status = "ended";
  session.endTime = new Date();

  if (session.transcripts.length === 0) {
    activeSessions.delete(userId);
    return { success: true, summary: "No conversation was recorded.", bulletPoints: [], actionItems: [] };
  }

  try {
    // Generate summary using AI
    const fullTranscript = session.transcripts
      .map(t => `[${t.speaker || "Speaker"}]: ${t.text}`)
      .join("\n");

    const messages = [
      {
        role: "system",
        content: `You are a meeting assistant. Analyze the following conversation transcript and provide:
1. A brief summary (2-3 sentences)
2. Key bullet points (up to 5)
3. Action items mentioned (if any)

Format your response as JSON:
{
  "summary": "...",
  "bulletPoints": ["...", "..."],
  "actionItems": ["...", "..."]
}`,
      },
      {
        role: "user",
        content: `Context: ${session.context || "General conversation"}\n\nTranscript:\n${fullTranscript}`,
      },
    ];

    let content: string;

    // Demo Mode: server-side proxy
    if (openaiApiKey === DEMO_MODE_SENTINEL_KEY) {
      const res = await proxyChat({
        model: 'gpt-4o-mini',
        messages: messages as any,
        max_tokens: 1024,
      });
      content = res.content;
    } else {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const data = await response.json();
      content = data.choices[0].message.content;
    }

    // Parse JSON response
    let parsed;
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = { summary: content, bulletPoints: [], actionItems: [] };
      }
    } catch {
      parsed = { summary: content, bulletPoints: [], actionItems: [] };
    }

    session.summary = parsed.summary;
    session.bulletPoints = parsed.bulletPoints;
    session.actionItems = parsed.actionItems;

    // Save final session to database
    await saveSessionToDatabase(session);

    // Calculate duration
    const duration = Math.round(
      (session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60
    );

    activeSessions.delete(userId);

    return {
      success: true,
      summary: parsed.summary,
      bulletPoints: parsed.bulletPoints,
      actionItems: parsed.actionItems,
      duration,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get current session status
export function getSessionStatus(userId: string): {
  isActive: boolean;
  session?: ListeningSession;
  transcriptCount?: number;
  duration?: number;
} {
  const session = activeSessions.get(userId);
  if (!session) {
    return { isActive: false };
  }

  const duration = Math.round(
    (new Date().getTime() - session.startTime.getTime()) / 1000 / 60
  );

  return {
    isActive: session.status === "active",
    session,
    transcriptCount: session.transcripts.length,
    duration,
  };
}

// Pause listening session
export function pauseSession(userId: string): boolean {
  const session = activeSessions.get(userId);
  if (!session || session.status !== "active") {
    return false;
  }
  session.status = "paused";
  return true;
}

// Resume listening session
export function resumeSession(userId: string): boolean {
  const session = activeSessions.get(userId);
  if (!session || session.status !== "paused") {
    return false;
  }
  session.status = "active";
  return true;
}

// Save session to database
async function saveSessionToDatabase(session: ListeningSession): Promise<void> {
  try {
    await supabase.from("ai_logs").insert({
      user_id: session.userId,
      type: "listening_session",
      title: session.context || "Listening Session",
      content: JSON.stringify({
        transcripts: session.transcripts,
        summary: session.summary,
        bulletPoints: session.bulletPoints,
        actionItems: session.actionItems,
      }),
      metadata: {
        startTime: session.startTime.toISOString(),
        endTime: session.endTime?.toISOString(),
        status: session.status,
        transcriptCount: session.transcripts.length,
      },
    });
  } catch (error) {
    console.error("Failed to save listening session:", error);
  }
}

// Get past listening sessions
export async function getPastSessions(
  userId: string,
  limit: number = 10
): Promise<ListeningSession[]> {
  try {
    const { data, error } = await supabase
      .from("ai_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "listening_session")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(log => {
      const content = typeof log.content === "string" ? JSON.parse(log.content) : log.content;
      const metadata = log.metadata as Record<string, any>;
      
      return {
        id: log.id,
        userId: log.user_id,
        startTime: new Date(metadata?.startTime || log.created_at),
        endTime: metadata?.endTime ? new Date(metadata.endTime) : undefined,
        transcripts: content?.transcripts || [],
        status: (metadata?.status || "ended") as "active" | "paused" | "ended",
        context: log.title,
        summary: content?.summary,
        bulletPoints: content?.bulletPoints,
        actionItems: content?.actionItems,
      };
    });
  } catch (error) {
    console.error("Failed to get past sessions:", error);
    return [];
  }
}

// Generate voice-friendly summary
export function formatSummaryForVoice(session: ListeningSession): string {
  if (!session.summary) {
    return "I didn't capture any meaningful conversation during the listening session.";
  }

  let voiceText = `Here's what I heard during the ${Math.round((session.endTime!.getTime() - session.startTime.getTime()) / 1000 / 60)} minute session. `;
  voiceText += session.summary + " ";

  if (session.bulletPoints && session.bulletPoints.length > 0) {
    voiceText += `Key points: ${session.bulletPoints.slice(0, 3).join(". ")}. `;
  }

  if (session.actionItems && session.actionItems.length > 0) {
    voiceText += `Action items: ${session.actionItems.join(". ")}.`;
  }

  return voiceText;
}