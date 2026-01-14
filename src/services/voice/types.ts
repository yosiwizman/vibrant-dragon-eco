export interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isQuietMode: boolean;
  isConversationMode: boolean;
  lastTranscript: string;
  currentTranscript: string;
  lastResponse: string;
}

export interface VoiceConfig {
  openaiApiKey: string | null;
  assistantName: string;
  openaiVoice: string;
  voiceSpeed: number;
  preferOpenAIVoice: boolean;
  enableMemory: boolean;
  enableChatHistory: boolean;
  chatHistoryLimit: number;
  privateMode: boolean;
}

export interface RecordingCallbacks {
  onStart: () => void;
  onStop: () => void;
  onData: (blob: Blob) => void;
  onError: (error: Error) => void;
  onSilenceDetected?: () => void;
}

export interface TranscriptionResult {
  text: string;
  confidence?: number;
}

export interface SpeechOptions {
  voice?: string;
  rate?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

export interface ProcessingResult {
  response: string;
  toolResults?: any[];
  navigateTo?: string;
}

export type VoiceEventType = 
  | 'recording-start'
  | 'recording-stop'
  | 'transcription-complete'
  | 'processing-start'
  | 'processing-complete'
  | 'speech-start'
  | 'speech-end'
  | 'error';

export interface VoiceEvent {
  type: VoiceEventType;
  data?: any;
  timestamp: number;
}

export type VoiceEventHandler = (event: VoiceEvent) => void;