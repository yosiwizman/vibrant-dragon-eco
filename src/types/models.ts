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
  preferredName: string;
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
  enableSmartScheduling: boolean;
  defaultReminderLeadTime: number;
  quietModeExitPhrase: string;
  // New enhanced preferences
  enableActionHistory: boolean;
  maxUndoTimeMinutes: number;
  enableProductivityTracking: boolean;
  defaultTaskPriority: "low" | "medium" | "high" | "urgent";
  defaultReminderChannel: "push" | "sms" | "email";
  enableConflictDetection: boolean;
  enablePatternLearning: boolean;
  snoozeDefaultMinutes: number;
  notificationSoundEnabled: boolean;
  compactVoiceResponses: boolean;
  widgetLayout?: any[];
  widgets?: any[];
}

export interface ToolExecutionLog {
  id: string;
  userId: string;
  tool: string;
  parameters: Record<string, any>;
  success: boolean;
  duration: number;
  error?: string;
  timestamp: string;
}

export interface ProductivityStats {
  period: string;
  tasksCompleted: number;
  tasksCreated: number;
  completionRate: string;
  currentStreak: number;
  averageTasksPerDay: number;
  mostProductiveDay: string;
  mostProductiveHour: number;
}

export interface SystemStatus {
  tasks: { total: number; pending: number; completed: number; overdue: number };
  reminders: { pending: number; completed: number };
  notes: { total: number; pinned: number };
  contacts: { total: number };
  notifications: { unread: number };
  appointments: { upcoming: number };
  knowledge: { documents: number; memories: number };
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