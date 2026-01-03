export type Role = "user" | "assistant" | "system";

export interface Citation {
  title: string;
  url: string;
}

export interface ToolCall {
  type: "search" | "nearby" | "orchestrator";
  input: string;
  outputMeta?: Record<string, unknown>;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  citations?: Citation[];
  toolCall?: ToolCall;
  createdAt: number;
  audioUrl?: string;
}

export interface Conversation {
  id: string;
  title?: string;
  createdAt: number;
  messages: Message[];
}

export interface LocationSnapshot {
  lat: number;
  lng: number;
  timestamp: number;
}

export type OpenAIVoice = "alloy" | "ash" | "ballad" | "coral" | "echo" | "fable" | "onyx" | "nova" | "sage" | "shimmer" | "verse";

export interface Preferences {
  baseUrl: string;
  privateMode: boolean;
  pinEnabled: boolean;
  pinCode?: string;
  authToken?: string;
  openaiApiKey?: string;
  openaiVoice: OpenAIVoice;
  conversationMode: boolean;
  silenceThreshold: number;
  silenceTimeout: number;
  voiceSpeed: number;
  autoListenAfterSpeech: boolean;
  wakeWord: string;
  wakeWordEnabled: boolean;
  voiceFeedbackEnabled: boolean;
  voiceFeedbackVolume: number;
  enableMultiStepConversations: boolean;
  enableRAGKnowledge: boolean;
  enableMemory: boolean;
  enableChatHistory: boolean;
  assistantName: string;
  chatHistoryLimit: number;
  // Smart Scheduling
  enableSmartScheduling: boolean;
  defaultReminderLeadTime: number;
  // Quiet/Listening Mode
  quietModeExitPhrase: string;
}
  enableSmartScheduling: boolean;
  defaultReminderLeadTime: number;
  // Quiet/Listening Mode
  quietModeExitPhrase: string;
}

export interface Memory {
  id: string;
  userId: string;
  category: string;
  key: string;
  value: string;
  importance: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
}

export interface ChatHistoryEntry {
  id: string;
  userId: string;
  role: Role;
  content: string;
  createdAt: string;
  sessionId?: string;
}

export const OPENAI_VOICES: { value: OpenAIVoice; label: string; description: string }[] = [
  { value: "alloy", label: "Alloy", description: "Neutral and balanced" },
  { value: "ash", label: "Ash", description: "Soft and thoughtful" },
  { value: "ballad", label: "Ballad", description: "Warm and expressive" },
  { value: "coral", label: "Coral", description: "Clear and friendly" },
  { value: "echo", label: "Echo", description: "Smooth and calm" },
  { value: "fable", label: "Fable", description: "Expressive British accent" },
  { value: "onyx", label: "Onyx", description: "Deep and authoritative" },
  { value: "nova", label: "Nova", description: "Energetic and bright" },
  { value: "sage", label: "Sage", description: "Wise and measured" },
  { value: "shimmer", label: "Shimmer", description: "Soft and gentle" },
  { value: "verse", label: "Verse", description: "Dynamic and versatile" },
];