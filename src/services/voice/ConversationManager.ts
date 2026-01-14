import { hasActiveFlow, processMultiStepResponse, cancelFlow, handleInlineModification, detectMultiStepIntent, startMultiStepFlow } from '@/services/multi-step-conversation';
import { isEnterPhrase, isExitPhrase, startListeningSession, addTranscript, endListeningSession, getSessionStatus } from '@/services/quiet-mode';

export interface ConversationState {
  isActive: boolean;
  isQuietMode: boolean;
}

export interface TranscriptHandlerResult {
  handled: boolean;
  action?: 'exit' | 'quiet-enter' | 'quiet-exit' | 'multi-step' | 'modification' | 'cancel';
  message?: string;
  data?: any;
}

export class ConversationManager {
  private isConversationActive = false;
  private isQuietModeActive = false;

  startConversation(): void {
    this.isConversationActive = true;
    console.log('[ConversationManager] Conversation started');
  }

  stopConversation(): void {
    this.isConversationActive = false;
    console.log('[ConversationManager] Conversation stopped');
  }

  enterQuietMode(userId: string, context?: string): void {
    startListeningSession(userId, context);
    this.isQuietModeActive = true;
    console.log('[ConversationManager] Quiet mode entered');
  }

  async exitQuietMode(userId: string, apiKey: string): Promise<{
    summary: string;
    bulletPoints: string[];
    actionItems: string[];
  } | null> {
    try {
      const result = await endListeningSession(userId, apiKey);
      this.isQuietModeActive = false;
      
      if (result.success) {
        return {
          summary: result.summary || '',
          bulletPoints: result.bulletPoints || [],
          actionItems: result.actionItems || [],
        };
      }
    } catch (error) {
      console.error('[ConversationManager] Failed to exit quiet mode:', error);
    }
    
    this.isQuietModeActive = false;
    return null;
  }

  checkQuietModeStatus(userId: string): boolean {
    const status = getSessionStatus(userId);
    this.isQuietModeActive = status.isActive;
    return status.isActive;
  }

  addQuietModeTranscript(userId: string, text: string): void {
    if (this.isQuietModeActive) {
      addTranscript(userId, text);
    }
  }

  handleTranscript(userId: string, text: string): TranscriptHandlerResult {
    // Check for exit phrases in conversation mode
    if (this.isConversationActive && /\b(goodbye|bye|stop|exit|end conversation|that's all|thank you|thanks)\b/i.test(text)) {
      return {
        handled: true,
        action: 'exit',
        message: 'Goodbye! Let me know if you need anything else.',
      };
    }

    // Check for quiet mode entry
    if (isEnterPhrase(text)) {
      const contextMatch = text.match(/for\s+(.+?)(?:\s*$|,)/i);
      const context = contextMatch ? contextMatch[1] : undefined;
      return {
        handled: true,
        action: 'quiet-enter',
        message: `Entering quiet mode${context ? ` for ${context}` : ''}. I'll stay quiet and just listen.`,
        data: { context },
      };
    }

    // Check for quiet mode exit
    if (isExitPhrase(text) && this.isQuietModeActive) {
      return {
        handled: true,
        action: 'quiet-exit',
      };
    }

    // If in quiet mode, just record
    if (this.isQuietModeActive) {
      return {
        handled: true,
        action: 'quiet-enter',
      };
    }

    // Check for multi-step conversation
    if (hasActiveFlow(userId)) {
      const flowResult = processMultiStepResponse(userId, text);
      if (flowResult.complete && flowResult.collectedData) {
        return {
          handled: true,
          action: 'multi-step',
          data: {
            complete: true,
            intent: flowResult.state?.intent,
            collectedData: flowResult.collectedData,
          },
        };
      } else if (flowResult.nextPrompt) {
        return {
          handled: true,
          action: 'multi-step',
          message: flowResult.nextPrompt,
          data: { complete: false },
        };
      }
    }

    // Check for inline modifications
    const modResult = handleInlineModification(userId, text);
    if (modResult.handled && modResult.message) {
      return {
        handled: true,
        action: 'modification',
        message: modResult.message,
      };
    }

    // Check if user wants to start a multi-step flow
    const multiStepIntent = detectMultiStepIntent(text);
    if (multiStepIntent) {
      const flowStart = startMultiStepFlow(userId, multiStepIntent);
      if (flowStart) {
        return {
          handled: true,
          action: 'multi-step',
          message: flowStart.prompt,
          data: { complete: false },
        };
      }
    }

    // Check for cancel/undo commands
    if (/\b(cancel|stop|never\s*mind)\b/i.test(text) && hasActiveFlow(userId)) {
      cancelFlow(userId);
      return {
        handled: true,
        action: 'cancel',
        message: 'Cancelled. What else can I help with?',
      };
    }

    return { handled: false };
  }

  get conversationActive(): boolean {
    return this.isConversationActive;
  }

  get quietModeActive(): boolean {
    return this.isQuietModeActive;
  }
}

export const conversationManager = new ConversationManager();