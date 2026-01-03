import { useEffect, useCallback } from "react";
import { useVoice } from "@/contexts/VoiceContext";

interface UseVoiceShortcutOptions {
  enabled?: boolean;
  key?: string;
  holdToTalk?: boolean;
}

export function useVoiceShortcut(options: UseVoiceShortcutOptions = {}) {
  const { enabled = true, key = " ", holdToTalk = false } = options;
  const { isListening, startListening, stopListening, isProcessing, isSpeaking } = useVoice();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger if typing in an input
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }

    // Check for the activation key (default: Space)
    if (e.key === key && !e.repeat) {
      e.preventDefault();
      
      if (holdToTalk) {
        if (!isListening && !isProcessing) {
          startListening();
        }
      } else {
        // Toggle mode
        if (isListening) {
          stopListening();
        } else if (!isProcessing && !isSpeaking) {
          startListening();
        }
      }
    }
  }, [key, holdToTalk, isListening, isProcessing, isSpeaking, startListening, stopListening]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }

    if (e.key === key && holdToTalk && isListening) {
      e.preventDefault();
      stopListening();
    }
  }, [key, holdToTalk, isListening, stopListening]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [enabled, handleKeyDown, handleKeyUp]);

  return { isListening, isProcessing, isSpeaking };
}