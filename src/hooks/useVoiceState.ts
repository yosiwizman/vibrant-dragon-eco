import { useState, useRef, useEffect, useCallback } from 'react';
import { VoiceState } from '@/services/voice/types';

export interface UseVoiceStateReturn extends VoiceState {
  setIsListening: (value: boolean) => void;
  setIsProcessing: (value: boolean) => void;
  setIsSpeaking: (value: boolean) => void;
  setIsQuietMode: (value: boolean) => void;
  setIsConversationMode: (value: boolean) => void;
  setLastTranscript: (value: string) => void;
  setCurrentTranscript: (value: string) => void;
  setLastResponse: (value: string) => void;
  conversationModeRef: React.MutableRefObject<boolean>;
  isStartingRef: React.MutableRefObject<boolean>;
}

export function useVoiceState(): UseVoiceStateReturn {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isQuietMode, setIsQuietMode] = useState(false);
  const [isConversationMode, setIsConversationMode] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');

  // Refs for tracking state in callbacks
  const conversationModeRef = useRef(false);
  const isStartingRef = useRef(false);

  // Sync conversation mode ref with state
  useEffect(() => {
    conversationModeRef.current = isConversationMode;
  }, [isConversationMode]);

  return {
    isListening,
    isProcessing,
    isSpeaking,
    isQuietMode,
    isConversationMode,
    lastTranscript,
    currentTranscript,
    lastResponse,
    setIsListening,
    setIsProcessing,
    setIsSpeaking,
    setIsQuietMode,
    setIsConversationMode,
    setLastTranscript,
    setCurrentTranscript,
    setLastResponse,
    conversationModeRef,
    isStartingRef,
  };
}