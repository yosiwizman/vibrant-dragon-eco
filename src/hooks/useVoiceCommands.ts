import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { voiceProcessor, conversationManager, VoiceConfig } from '@/services/voice';
import { logVoiceCommand, logAIError } from '@/services/ai-logging';
import { LocationContext } from '@/services/context';
import { useVoiceFeedback } from '@/components/VoiceFeedback';
import { showError, showSuccess } from '@/utils/toast';
import { conversationMemory } from '@/services/conversation-memory';
import { intentPredictor } from '@/services/intent-predictor';

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
      console.log('[VoiceCommands] Processing command:', text);
      
      // Predict intent for faster processing
      const predictedIntent = intentPredictor.predict(text);
      if (predictedIntent) {
        console.log('[VoiceCommands] Predicted intent:', predictedIntent.type, 'confidence:', predictedIntent.confidence);
      }
      
      const result = await voiceProcessor.processCommand(
        text,
        userId,
        config.openaiApiKey,
        config,
        userLocation,
        (path) => {
          console.log('[VoiceCommands] Navigating to:', path);
          navigate(path);
        }
      );

      console.log('[VoiceCommands] Got response:', result.response.substring(0, 50) + '...');
      
      // Add to conversation memory for context
      await conversationMemory.addTurn(text, result.response, result.toolsUsed || []);
      
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
      console.log('[VoiceCommands] Empty transcription, skipping');
      onProcessingChange(false);
      return;
    }

    console.log('[VoiceCommands] Handling transcription:', text, 'isConversation:', isConversation);

    // Check for special commands via conversation manager
    if (userId) {
      const result = conversationManager.handleTranscript(userId, text);
      
      if (result.handled) {
        console.log('[VoiceCommands] Special command handled:', result.action);
        
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
      console.log('[VoiceCommands] Processing as regular command');
      const response = await processCommand(text);
      playFeedback('success');
      
      if (userId) {
        logVoiceCommand(userId, text, response);
      }
      
      console.log('[VoiceCommands] Speaking response');
      // The speak function will handle auto-continuing conversation mode via onEnd callback
      await speak(response);
      console.log('[VoiceCommands] Finished speaking');
    } catch (error: any) {
      playFeedback('error');
      onProcessingChange(false);
      console.error('[VoiceCommands] Error processing command:', error);
      showError(error.message || 'Voice processing failed');
      
      // Speak error message - this will also trigger conversation continuation
      await speak('Sorry, I had trouble with that. Please try again.');
    }
  }, [userId, isQuietMode, processCommand, speak, playFeedback, stopConversationMode, enterQuietMode, exitQuietMode, onProcessingChange]);

  return {
    processCommand,
    handleTranscription,
  };
}