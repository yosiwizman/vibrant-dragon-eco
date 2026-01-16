"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/utils/logger";

// Lazy-loaded services to prevent blocking app initialization
let alwaysOnAssistant: any = null;
let factChecker: any = null;
let conversationIndexer: any = null;
let conversationMemory: any = null;
let intentPredictor: any = null;

async function loadServices() {
  try {
    if (!alwaysOnAssistant) {
      const module = await import("@/services/always-on-assistant");
      alwaysOnAssistant = module.alwaysOnAssistant;
    }
    if (!factChecker) {
      const module = await import("@/services/real-time-fact-checker");
      factChecker = module.factChecker;
    }
    if (!conversationIndexer) {
      const module = await import("@/services/conversation-indexer");
      conversationIndexer = module.conversationIndexer;
    }
    if (!conversationMemory) {
      const module = await import("@/services/conversation-memory");
      conversationMemory = module.conversationMemory;
    }
    if (!intentPredictor) {
      const module = await import("@/services/intent-predictor");
      intentPredictor = module.intentPredictor;
    }
    return true;
  } catch (error) {
    logger.error('SecondBrain', 'Failed to load services:', error);
    return false;
  }
}

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
  const servicesLoadedRef = useRef(false);
  
  const [state, setState] = useState<SecondBrainState>({
    isActive: false,
    isPrivacyMode: false,
    isFactCheckingEnabled: false,
    activeConversationId: null,
    speakerCount: 0,
    segmentCount: 0,
  });

  // Load services on first use
  const ensureServicesLoaded = useCallback(async () => {
    if (servicesLoadedRef.current) return true;
    const loaded = await loadServices();
    servicesLoadedRef.current = loaded;
    return loaded;
  }, []);

  // Start the Second Brain system
  const start = useCallback(async (wakeWord: string = 'echo') => {
    if (!user) {
      logger.warn('SecondBrain', 'Cannot start without user');
      return;
    }

    const loaded = await ensureServicesLoaded();
    if (!loaded) {
      logger.error('SecondBrain', 'Services not available');
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
  }, [user, ensureServicesLoaded]);

  // Stop the Second Brain system
  const stop = useCallback(() => {
    if (alwaysOnAssistant) alwaysOnAssistant.stop();
    if (factChecker) factChecker.stop();
    
    if (state.activeConversationId && conversationIndexer) {
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
    if (alwaysOnAssistant) alwaysOnAssistant.exitPrivacyMode();
    setState(prev => ({ ...prev, isPrivacyMode: true }));
    logger.log('SecondBrain', 'Entered privacy mode');
  }, []);

  const exitPrivacyMode = useCallback(() => {
    if (alwaysOnAssistant) alwaysOnAssistant.exitPrivacyMode();
    setState(prev => ({ ...prev, isPrivacyMode: false }));
    logger.log('SecondBrain', 'Exited privacy mode');
  }, []);

  // Fact checking controls
  const enableFactChecking = useCallback(() => {
    if (factChecker) factChecker.start();
    setState(prev => ({ ...prev, isFactCheckingEnabled: true }));
  }, []);

  const disableFactChecking = useCallback(() => {
    if (factChecker) factChecker.stop();
    setState(prev => ({ ...prev, isFactCheckingEnabled: false }));
  }, []);

  // Search conversations
  const searchConversations = useCallback(async (query: string) => {
    if (!user) return [];
    await ensureServicesLoaded();
    if (!conversationIndexer) return [];
    return conversationIndexer.searchConversations(user.id, query);
  }, [user, ensureServicesLoaded]);

  // Get conversations with specific person
  const getConversationsWith = useCallback(async (personName: string) => {
    if (!user) return [];
    await ensureServicesLoaded();
    if (!conversationIndexer) return [];
    return conversationIndexer.getConversationsWith(user.id, personName);
  }, [user, ensureServicesLoaded]);

  // Get items from conversations
  const getItemsFrom = useCallback(async (personName: string, topic?: string) => {
    if (!user) return [];
    await ensureServicesLoaded();
    if (!conversationIndexer) return [];
    return conversationIndexer.getItemsFrom(user.id, personName, topic);
  }, [user, ensureServicesLoaded]);

  // Predict intent from partial text
  const predictIntent = useCallback((text: string) => {
    if (!intentPredictor) return null;
    return intentPredictor.predict(text);
  }, []);

  // Get conversation context for AI
  const getConversationContext = useCallback(() => {
    if (!conversationMemory) return '';
    return conversationMemory.getContext();
  }, []);

  // Clear conversation memory
  const clearMemory = useCallback(() => {
    if (conversationMemory) conversationMemory.clear();
    logger.log('SecondBrain', 'Memory cleared');
  }, []);

  // Update state periodically when active
  useEffect(() => {
    if (!state.isActive || !alwaysOnAssistant) return;

    const interval = setInterval(() => {
      try {
        const status = alwaysOnAssistant.getStatus();
        setState(prev => ({
          ...prev,
          isPrivacyMode: status.privacyMode,
          speakerCount: status.speakerCount,
          segmentCount: status.segmentCount,
        }));
      } catch (error) {
        // Ignore errors during status update
      }
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