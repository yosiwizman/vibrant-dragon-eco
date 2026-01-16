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
    // Only exit if the message is primarily an exit phrase
    const normalizedText = text.toLowerCase().trim();
    
    // Exact exit phrases (must match exactly or be the primary content)
    const exactExitPhrases = [
      'goodbye', 'bye', 'bye bye', 'stop', 'exit', 'quit',
      'end conversation', "that's all", 'good bye', 'see you',
      'see ya', 'later', 'talk later', "i'm done", 'done',
      "that's it", 'nothing else', 'end', 'close', 'finish'
    ];
    
    // Phrases that indicate exit when they're the main content
    const exitIndicators = ['thank you', 'thanks', 'ok thanks', 'okay thanks'];
    
    // Check for exact match first
    const isExactMatch = exactExitPhrases.includes(normalizedText);
    
    // Check if it's a short message (< 25 chars) that contains an exit phrase
    const isShortExitMessage = normalizedText.length < 25 &&
      exactExitPhrases.some(phrase => normalizedText.includes(phrase));
    
    // Check for thank you variants only if they're standalone (not part of a longer request)
    const isThankYouExit = normalizedText.length < 30 &&
      exitIndicators.some(phrase => normalizedText.includes(phrase)) &&
      !normalizedText.includes('can you') &&
      !normalizedText.includes('please') &&
      !normalizedText.includes('help');
    
    const shouldExit = isExactMatch || isShortExitMessage || isThankYouExit;
    
    if (this.isConversationActive && shouldExit) {
      console.log('[ConversationManager] Exit phrase detected:', normalizedText);
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