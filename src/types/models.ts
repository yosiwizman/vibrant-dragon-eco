export type Role = "user" | "assistant" | "system";

export interface Citation {
  title: string;
  url: string;
}

export interface ToolCall {
  type: "search" | "nearby";
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

export interface Preferences {
  baseUrl: string;
  privateMode: boolean;
  pinEnabled: boolean;
  pinCode?: string;
  authToken?: string;
}