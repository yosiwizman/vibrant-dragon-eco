import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { voiceProcessor, conversationManager, VoiceConfig } from '@/services/voice';
import { logVoiceCommand, logAIError } from '@/services/ai-logging';
import { LocationContext } from '@/services/context';
import { useVoiceFeedback } from '@/components/VoiceFeedback';
import { showError, showSuccess } from '@/utils/toast';

export interface UseVoiceCommandsOptions {
  userId: string | null;
  config: VoiceConfig;
  userLocation: LocationContext | null;
  isQuietMode: boolean;
  onProcessingChange: (isProcessing: boolean) => void;
  onTranscriptChange: (transcript: string) => void;
  onResponseChange: (response: string) => void;
  speak: (text: string) => Promise<void>;
  stopConversationMode: () => void;
  enterQuietMode: (context?: string) => void;
  exitQuietMode: () => Promise<{ summary: string; bulletPoints: string[]; actionItems: string[] } | null>;
}

export interface UseVoiceCommandsReturn {
  processCommand: (text: string) => Promise<string>;
  handleTranscription: (text: string, isConversation: boolean) => Promise<void>;
}

export function useVoiceCommands(options: UseVoiceCommandsOptions): UseVoiceCommandsReturn {
  const {
    userId,
    config,
    userLocation,
    isQuietMode,
    onProcessingChange,
    onTranscriptChange,
    onResponseChange,
    speak,
    stopConversationMode,
    enterQuietMode,
    exitQuietMode,
  } = options;

  const navigate = useNavigate();
  const { playFeedback } = useVoiceFeedback();

  const processCommand = useCallback(async (text: string): Promise<string> => {
    if (!userId) {
      throw new Error('Please log in to use AI features');
    }

    onProcessingChange(true);
    onTranscriptChange(text);

    try {
      const result = await voiceProcessor.processCommand(
        text,
        userId,
        config.openaiApiKey,
        config,
        userLocation,
        (path) => navigate(path)
      );

      onResponseChange(result.response);
      onProcessingChange(false);
      
      return result.response;
    } catch (error: any) {
      onProcessingChange(false);
      console.error('[VoiceCommands] Processing error:', error);
      
      logAIError(userId, error.message, { command: text });
      
      throw error;
    }
  }, [userId, config, userLocation, navigate, onProcessingChange, onTranscriptChange, onResponseChange]);

  const handleTranscription = useCallback(async (text: string, isConversation: boolean) => {
    if (!text?.trim()) {
      onProcessingChange(false);
      return;
    }

    // Check for special commands via conversation manager
    if (userId) {
      const result = conversationManager.handleTranscript(userId, text);
      
      if (result.handled) {
        switch (result.action) {
          case 'exit':
            onProcessingChange(false);
            await speak(result.message!);
            stopConversationMode();
            return;
            
          case 'quiet-enter':
            if (result.data?.context !== undefined) {
              enterQuietMode(result.data.context);
            } else if (isQuietMode) {
              conversationManager.addQuietModeTranscript(userId, text);
            }
            onProcessingChange(false);
            if (result.message) await speak(result.message);
            return;
            
          case 'quiet-exit':
            const quietResult = await exitQuietMode();
            onProcessingChange(false);
            if (quietResult) {
              let summaryText = quietResult.summary;
              if (quietResult.bulletPoints.length > 0) {
                summaryText += ` Key points: ${quietResult.bulletPoints.slice(0, 3).join('. ')}.`;
              }
              playFeedback('success');
              await speak(summaryText);
            } else {
              await speak("I didn't capture any conversation during the listening session.");
            }
            return;
            
          case 'multi-step':
            if (result.data?.complete) {
              playFeedback('success');
              const response = await processCommand(
                `Create ${result.data.intent?.replace(/_/g, ' ')} with: ${JSON.stringify(result.data.collectedData)}`
              );
              await speak(response);
            } else if (result.message) {
              onProcessingChange(false);
              await speak(result.message);
            }
            return;
            
          case 'modification':
            playFeedback('success');
            onProcessingChange(false);
            await speak(result.message!);
            return;
            
          case 'cancel':
            onProcessingChange(false);
            await speak(result.message!);
            return;
        }
      }
    }

    // Process as regular command
    try {
      const response = await processCommand(text);
      playFeedback('success');
      
      if (userId) {
        logVoiceCommand(userId, text, response);
      }
      
      await speak(response);
    } catch (error: any) {
      playFeedback('error');
      onProcessingChange(false);
      showError(error.message || 'Voice processing failed');
      
      await speak('Sorry, I had trouble with that. Please try again.');
    }
  }, [userId, isQuietMode, processCommand, speak, playFeedback, stopConversationMode, enterQuietMode, exitQuietMode, onProcessingChange]);

  return {
    processCommand,
    handleTranscription,
  };
}