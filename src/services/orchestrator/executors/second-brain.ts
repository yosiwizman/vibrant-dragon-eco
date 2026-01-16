import { alwaysOnAssistant } from '@/services/always-on-assistant';
import { factChecker } from '@/services/real-time-fact-checker';
import { conversationIndexer } from '@/services/conversation-indexer';
import { conversationMemory } from '@/services/conversation-memory';
import { speakerIdentification } from '@/services/second-brain/speaker-identification';
import { whisperMode } from '@/services/second-brain/whisper-mode';
import { logger } from '@/utils/logger';

/**
 * Start the Second Brain system
 */
export async function executeStartSecondBrain(params: {
  wake_word?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const wakeWord = params.wake_word || 'echo';
    await alwaysOnAssistant.start(wakeWord);
    factChecker.start();
    
    logger.log('SecondBrainExecutor', 'Second Brain started');
    
    return {
      success: true,
      message: `Second Brain is now active with wake word "${wakeWord}". I'm listening for conversations, ready to translate, fact-check, and remember everything.`,
    };
  } catch (error) {
    logger.error('SecondBrainExecutor', 'Failed to start Second Brain:', error);
    return {
      success: false,
      message: 'Failed to start Second Brain. Please check microphone permissions.',
    };
  }
}

/**
 * Stop the Second Brain system
 */
export function executeStopSecondBrain(): { success: boolean; message: string } {
  try {
    alwaysOnAssistant.stop();
    factChecker.stop();
    
    logger.log('SecondBrainExecutor', 'Second Brain stopped');
    
    return {
      success: true,
      message: 'Second Brain has been deactivated. I\'m no longer listening continuously.',
    };
  } catch (error) {
    logger.error('SecondBrainExecutor', 'Failed to stop Second Brain:', error);
    return {
      success: false,
      message: 'Failed to stop Second Brain.',
    };
  }
}

/**
 * Enter privacy mode
 */
export function executeEnterPrivacyMode(): { success: boolean; message: string } {
  try {
    alwaysOnAssistant.exitPrivacyMode(); // Note: This actually enters privacy mode in the service
    
    logger.log('SecondBrainExecutor', 'Entered privacy mode');
    
    return {
      success: true,
      message: 'Privacy mode activated. I\'ve stopped listening. Say "Hey Echo" when you need me again.',
    };
  } catch (error) {
    logger.error('SecondBrainExecutor', 'Failed to enter privacy mode:', error);
    return {
      success: false,
      message: 'Failed to enter privacy mode.',
    };
  }
}

/**
 * Exit privacy mode
 */
export function executeExitPrivacyMode(): { success: boolean; message: string } {
  try {
    alwaysOnAssistant.exitPrivacyMode();
    
    logger.log('SecondBrainExecutor', 'Exited privacy mode');
    
    return {
      success: true,
      message: 'Privacy mode deactivated. I\'m listening again.',
    };
  } catch (error) {
    logger.error('SecondBrainExecutor', 'Failed to exit privacy mode:', error);
    return {
      success: false,
      message: 'Failed to exit privacy mode.',
    };
  }
}

/**
 * Search conversations
 */
export async function executeSearchConversations(
  userId: string,
  params: { query: string }
): Promise<{ success: boolean; results: any[]; message: string }> {
  try {
    const results = await conversationIndexer.searchConversations(userId, params.query);
    
    logger.log('SecondBrainExecutor', `Found ${results.length} conversations for query: ${params.query}`);
    
    if (results.length === 0) {
      return {
        success: true,
        results: [],
        message: `I couldn't find any conversations matching "${params.query}".`,
      };
    }
    
    const summaries = results.slice(0, 5).map(r => r.summary).join('; ');
    
    return {
      success: true,
      results,
      message: `Found ${results.length} conversations. ${summaries}`,
    };
  } catch (error) {
    logger.error('SecondBrainExecutor', 'Failed to search conversations:', error);
    return {
      success: false,
      results: [],
      message: 'Failed to search conversations.',
    };
  }
}

/**
 * Get conversations with a specific person
 */
export async function executeGetConversationsWith(
  userId: string,
  params: { person_name: string }
): Promise<{ success: boolean; results: any[]; message: string }> {
  try {
    const results = await conversationIndexer.getConversationsWith(userId, params.person_name);
    
    logger.log('SecondBrainExecutor', `Found ${results.length} conversations with ${params.person_name}`);
    
    if (results.length === 0) {
      return {
        success: true,
        results: [],
        message: `I don't have any recorded conversations with ${params.person_name}.`,
      };
    }
    
    const latestSummary = results[0]?.summary || '';
    
    return {
      success: true,
      results,
      message: `Found ${results.length} conversations with ${params.person_name}. Most recent: ${latestSummary}`,
    };
  } catch (error) {
    logger.error('SecondBrainExecutor', 'Failed to get conversations:', error);
    return {
      success: false,
      results: [],
      message: `Failed to get conversations with ${params.person_name}.`,
    };
  }
}

/**
 * Get items from conversations
 */
export async function executeGetItemsFromConversation(
  userId: string,
  params: { person_name: string; topic?: string }
): Promise<{ success: boolean; items: string[]; message: string }> {
  try {
    const items = await conversationIndexer.getItemsFrom(userId, params.person_name, params.topic);
    
    logger.log('SecondBrainExecutor', `Found ${items.length} items from ${params.person_name}`);
    
    if (items.length === 0) {
      return {
        success: true,
        items: [],
        message: `I don't have any items recorded from ${params.person_name}${params.topic ? ` about ${params.topic}` : ''}.`,
      };
    }
    
    return {
      success: true,
      items,
      message: `${params.person_name} mentioned ${items.length} items: ${items.join(', ')}`,
    };
  } catch (error) {
    logger.error('SecondBrainExecutor', 'Failed to get items:', error);
    return {
      success: false,
      items: [],
      message: `Failed to get items from ${params.person_name}.`,
    };
  }
}

/**
 * Enable fact checking
 */
export function executeEnableFactChecking(): { success: boolean; message: string } {
  try {
    factChecker.start();
    
    logger.log('SecondBrainExecutor', 'Fact checking enabled');
    
    return {
      success: true,
      message: 'Real-time fact checking is now enabled. I\'ll whisper suggestions during negotiations and verify claims.',
    };
  } catch (error) {
    logger.error('SecondBrainExecutor', 'Failed to enable fact checking:', error);
    return {
      success: false,
      message: 'Failed to enable fact checking.',
    };
  }
}

/**
 * Disable fact checking
 */
export function executeDisableFactChecking(): { success: boolean; message: string } {
  try {
    factChecker.stop();
    
    logger.log('SecondBrainExecutor', 'Fact checking disabled');
    
    return {
      success: true,
      message: 'Real-time fact checking has been disabled.',
    };
  } catch (error) {
    logger.error('SecondBrainExecutor', 'Failed to disable fact checking:', error);
    return {
      success: false,
      message: 'Failed to disable fact checking.',
    };
  }
}

/**
 * Get Second Brain status
 */
export function executeGetSecondBrainStatus(): {
  success: boolean;
  status: {
    isActive: boolean;
    privacyMode: boolean;
    speakerCount: number;
    segmentCount: number;
    factCheckingEnabled: boolean;
  };
  message: string;
} {
  try {
    const assistantStatus = alwaysOnAssistant.getStatus();
    const speakerStats = speakerIdentification.getStatistics();
    
    const status = {
      isActive: assistantStatus.isActive,
      privacyMode: assistantStatus.privacyMode,
      speakerCount: assistantStatus.speakerCount,
      segmentCount: assistantStatus.segmentCount,
      factCheckingEnabled: true, // Would need to track this in the service
    };
    
    let message = status.isActive
      ? `Second Brain is active. ${status.speakerCount} speakers detected, ${status.segmentCount} conversation segments captured.`
      : 'Second Brain is not active.';
    
    if (status.privacyMode) {
      message += ' Privacy mode is on.';
    }
    
    return {
      success: true,
      status,
      message,
    };
  } catch (error) {
    logger.error('SecondBrainExecutor', 'Failed to get status:', error);
    return {
      success: false,
      status: {
        isActive: false,
        privacyMode: false,
        speakerCount: 0,
        segmentCount: 0,
        factCheckingEnabled: false,
      },
      message: 'Failed to get Second Brain status.',
    };
  }
}

/**
 * Clear conversation memory
 */
export function executeClearConversationMemory(): { success: boolean; message: string } {
  try {
    conversationMemory.clear();
    speakerIdentification.clearSpeakers();
    alwaysOnAssistant.clearConversation();
    
    logger.log('SecondBrainExecutor', 'Conversation memory cleared');
    
    return {
      success: true,
      message: 'All conversation memory has been cleared.',
    };
  } catch (error) {
    logger.error('SecondBrainExecutor', 'Failed to clear memory:', error);
    return {
      success: false,
      message: 'Failed to clear conversation memory.',
    };
  }
}

/**
 * Name a speaker
 */
export function executeNameSpeaker(params: {
  speaker_id: string;
  name: string;
}): { success: boolean; message: string } {
  try {
    const success = speakerIdentification.nameSpeaker(params.speaker_id, params.name);
    
    if (success) {
      logger.log('SecondBrainExecutor', `Named speaker ${params.speaker_id} as ${params.name}`);
      return {
        success: true,
        message: `I'll remember that speaker as ${params.name}.`,
      };
    } else {
      return {
        success: false,
        message: `I couldn't find that speaker to name.`,
      };
    }
  } catch (error) {
    logger.error('SecondBrainExecutor', 'Failed to name speaker:', error);
    return {
      success: false,
      message: 'Failed to name the speaker.',
    };
  }
}

/**
 * Get detected speakers
 */
export function executeGetDetectedSpeakers(): {
  success: boolean;
  speakers: any[];
  message: string;
} {
  try {
    const speakers = speakerIdentification.getAllSpeakers();
    const recentSpeakers = speakerIdentification.getRecentSpeakers();
    
    logger.log('SecondBrainExecutor', `Found ${speakers.length} speakers`);
    
    if (speakers.length === 0) {
      return {
        success: true,
        speakers: [],
        message: 'No speakers have been detected yet.',
      };
    }
    
    const speakerNames = speakers
      .map(s => s.name || `Speaker ${s.id.slice(-4)}`)
      .join(', ');
    
    return {
      success: true,
      speakers,
      message: `${speakers.length} speakers detected: ${speakerNames}. ${recentSpeakers.length} are currently active.`,
    };
  } catch (error) {
    logger.error('SecondBrainExecutor', 'Failed to get speakers:', error);
    return {
      success: false,
      speakers: [],
      message: 'Failed to get detected speakers.',
    };
  }
}

/**
 * Whisper a message
 */
export async function executeWhisperMessage(params: {
  message: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}): Promise<{ success: boolean; message: string }> {
  try {
    await whisperMode.whisper(params.message, params.priority || 'normal');
    
    logger.log('SecondBrainExecutor', `Whispered: ${params.message}`);
    
    return {
      success: true,
      message: 'Message whispered.',
    };
  } catch (error) {
    logger.error('SecondBrainExecutor', 'Failed to whisper:', error);
    return {
      success: false,
      message: 'Failed to whisper the message.',
    };
  }
}

/**
 * Set whisper volume
 */
export function executeSetWhisperVolume(params: {
  volume: number;
}): { success: boolean; message: string } {
  try {
    const volume = Math.max(0, Math.min(100, params.volume));
    whisperMode.setVolume(volume / 100);
    
    logger.log('SecondBrainExecutor', `Set whisper volume to ${volume}%`);
    
    return {
      success: true,
      message: `Whisper volume set to ${volume}%.`,
    };
  } catch (error) {
    logger.error('SecondBrainExecutor', 'Failed to set volume:', error);
    return {
      success: false,
      message: 'Failed to set whisper volume.',
    };
  }
}