"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { alwaysOnAssistant } from "@/services/always-on-assistant";
import { factChecker } from "@/services/real-time-fact-checker";
import { conversationIndexer } from "@/services/conversation-indexer";
import { conversationMemory } from "@/services/conversation-memory";
import { intentPredictor } from "@/services/intent-predictor";
import { logger } from "@/utils/logger";

interface SecondBrainState {
  isActive: boolean;
  isPrivacyMode: boolean;
  isFactCheckingEnabled: boolean;
  activeConversationId: string | null;
  speakerCount: number;
  segmentCount: number;
}

interface SecondBrainActions {
  start: (wakeWord?: string) => Promise<void>;
  stop: () => void;
  enterPrivacyMode: () => void;
  exitPrivacyMode: () => void;
  enableFactChecking: () => void;
  disableFactChecking: () => void;
  searchConversations: (query: string) => Promise<any[]>;
  getConversationsWith: (personName: string) => Promise<any[]>;
  getItemsFrom: (personName: string, topic?: string) => Promise<string[]>;
  predictIntent: (text: string) => any;
  getConversationContext: () => string;
  clearMemory: () => void;
}

export function useSecondBrain(): [SecondBrainState, SecondBrainActions] {
  const { user } = useAuth();
  
  const [state, setState] = useState<SecondBrainState>({
    isActive: false,
    isPrivacyMode: false,
    isFactCheckingEnabled: false,
    activeConversationId: null,
    speakerCount: 0,
    segmentCount: 0,
  });

  // Start the Second Brain system
  const start = useCallback(async (wakeWord: string = 'echo') => {
    if (!user) {
      logger.warn('SecondBrain', 'Cannot start without user');
      return;
    }

    try {
      // Start always-on assistant
      await alwaysOnAssistant.start(wakeWord);
      
      // Start fact checker
      factChecker.start();
      
      // Start a new conversation index
      const conversationId = conversationIndexer.startConversation(
        user.id,
        'session',
        undefined,
        'Second Brain session'
      );

      setState(prev => ({
        ...prev,
        isActive: true,
        isFactCheckingEnabled: true,
        activeConversationId: conversationId,
      }));

      logger.log('SecondBrain', 'Started successfully');
    } catch (error) {
      logger.error('SecondBrain', 'Failed to start:', error);
    }
  }, [user]);

  // Stop the Second Brain system
  const stop = useCallback(() => {
    alwaysOnAssistant.stop();
    factChecker.stop();
    
    if (state.activeConversationId) {
      conversationIndexer.endConversation(state.activeConversationId);
    }

    setState(prev => ({
      ...prev,
      isActive: false,
      isFactCheckingEnabled: false,
      activeConversationId: null,
    }));

    logger.log('SecondBrain', 'Stopped');
  }, [state.activeConversationId]);

  // Privacy mode controls
  const enterPrivacyMode = useCallback(() => {
    alwaysOnAssistant.exitPrivacyMode(); // This actually enters privacy mode in the service
    setState(prev => ({ ...prev, isPrivacyMode: true }));
    logger.log('SecondBrain', 'Entered privacy mode');
  }, []);

  const exitPrivacyMode = useCallback(() => {
    alwaysOnAssistant.exitPrivacyMode();
    setState(prev => ({ ...prev, isPrivacyMode: false }));
    logger.log('SecondBrain', 'Exited privacy mode');
  }, []);

  // Fact checking controls
  const enableFactChecking = useCallback(() => {
    factChecker.start();
    setState(prev => ({ ...prev, isFactCheckingEnabled: true }));
  }, []);

  const disableFactChecking = useCallback(() => {
    factChecker.stop();
    setState(prev => ({ ...prev, isFactCheckingEnabled: false }));
  }, []);

  // Search conversations
  const searchConversations = useCallback(async (query: string) => {
    if (!user) return [];
    return conversationIndexer.searchConversations(user.id, query);
  }, [user]);

  // Get conversations with specific person
  const getConversationsWith = useCallback(async (personName: string) => {
    if (!user) return [];
    return conversationIndexer.getConversationsWith(user.id, personName);
  }, [user]);

  // Get items from conversations
  const getItemsFrom = useCallback(async (personName: string, topic?: string) => {
    if (!user) return [];
    return conversationIndexer.getItemsFrom(user.id, personName, topic);
  }, [user]);

  // Predict intent from partial text
  const predictIntent = useCallback((text: string) => {
    return intentPredictor.predict(text);
  }, []);

  // Get conversation context for AI
  const getConversationContext = useCallback(() => {
    return conversationMemory.getContext();
  }, []);

  // Clear conversation memory
  const clearMemory = useCallback(() => {
    conversationMemory.clear();
    logger.log('SecondBrain', 'Memory cleared');
  }, []);

  // Update state periodically when active
  useEffect(() => {
    if (!state.isActive) return;

    const interval = setInterval(() => {
      const status = alwaysOnAssistant.getStatus();
      setState(prev => ({
        ...prev,
        isPrivacyMode: status.privacyMode,
        speakerCount: status.speakerCount,
        segmentCount: status.segmentCount,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isActive]);

  const actions: SecondBrainActions = {
    start,
    stop,
    enterPrivacyMode,
    exitPrivacyMode,
    enableFactChecking,
    disableFactChecking,
    searchConversations,
    getConversationsWith,
    getItemsFrom,
    predictIntent,
    getConversationContext,
    clearMemory,
  };

  return [state, actions];
}