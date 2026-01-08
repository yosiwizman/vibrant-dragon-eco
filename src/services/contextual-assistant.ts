"use client";

import { logger } from "@/utils/logger";
import { habitTracker } from "./habit-tracker";
import { intelligentScheduler } from "./intelligent-scheduler";
import { smartNotifications } from "./smart-notifications";
import { conversationIndexer } from "./conversation-indexer";

interface UserContext {
  currentLocation?: { lat: number; lng: number; place?: string };
  currentActivity?: string;
  nextEvent?: any;
  recentConversations: any[];
  pendingErrands: string[];
}

/**
 * Contextual Assistant Service
 * Complete intelligent assistant that learns and anticipates
 */
class ContextualAssistantService {
  private context: UserContext = {
    recentConversations: [],
    pendingErrands: [],
  };

  /**
   * Your exact scenario: Office to daughter's school
   */
  async monitorDepartureTime(userId: string): Promise<void> {
    // Get next event
    const { data: nextEvent } = await (await import('@/integrations/supabase/client')).supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(1)
      .single();

    if (!nextEvent) return;

    // Example: Daughter's school at 2:30pm
    const eventTime = new Date(nextEvent.start_time).getTime();
    const now = Date.now();

    // Get current location (office)
    const currentLocation = await this.getCurrentLocation();
    if (!currentLocation) return;

    // Calculate travel time with traffic
    const travelTime = await intelligentScheduler['calculateTravelTime'](
      currentLocation,
      { lat: 0, lng: 0 }, // School location
      eventTime
    );

    // It's 2pm, event at 2:30pm, 40min drive with traffic
    const minutesUntilEvent = (eventTime - now) / 60000;
    const travelMinutes = travelTime.duration / 60000;
    const bufferMinutes = 5; // Safety buffer

    const shouldLeaveIn = minutesUntilEvent - travelMinutes - bufferMinutes;

    // If should leave now or soon
    if (shouldLeaveIn <= 10) {
      const message = shouldLeaveIn <= 0
        ? `Time to leave NOW for ${nextEvent.title}! Traffic is ${travelTime.traffic}, ${Math.round(travelMinutes)} minute drive.`
        : `Leave in ${Math.round(shouldLeaveIn)} minutes for ${nextEvent.title}. Traffic is ${travelTime.traffic}, ${Math.round(travelMinutes)} minute drive.`;

      // Send voice notification
      await this.speakNotification(message, 'urgent');

      // Check for errands on the way
      await this.checkErrandsOnRoute(currentLocation, { lat: 0, lng: 0 });
    }
  }

  /**
   * Check errands on route
   */
  private async checkErrandsOnRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<void> {
    // Example: Wife asked to get milk
    const errands = this.context.pendingErrands;

    if (errands.length > 0) {
      const message = `Before you go, remember to ${errands.join(', ')}`;
      await this.speakNotification(message, 'high');
    }
  }

  /**
   * Learn from conversation
   */
  async learnFromConversation(
    userId: string,
    speaker: string,
    text: string
  ): Promise<void> {
    const lower = text.toLowerCase();

    // Detect errands
    if (lower.includes('get') || lower.includes('pick up') || lower.includes('stop by')) {
      // Extract what to get
      const items = this.extractErrands(text);
      
      items.forEach(item => {
        this.context.pendingErrands.push(item);
        
        // Save as task
        this.createErrandTask(userId, item, speaker);
      });

      logger.log('ContextualAssistant', `Learned errand from ${speaker}: ${items.join(', ')}`);
    }

    // Detect preferences
    if (lower.includes('i like') || lower.includes('i prefer') || lower.includes('i always')) {
      await this.savePreference(userId, text);
    }

    // Detect routines
    if (lower.includes('every') || lower.includes('usually') || lower.includes('always')) {
      await this.saveRoutine(userId, text);
    }
  }

  /**
   * Extract errands from text
   */
  private extractErrands(text: string): string[] {
    const errands: string[] = [];
    
    // Pattern: "get milk", "pick up dry cleaning", "stop by store"
    const patterns = [
      /(?:get|buy|purchase)\s+([a-z\s]+?)(?:\.|,|$)/gi,
      /(?:pick up|pickup)\s+([a-z\s]+?)(?:\.|,|$)/gi,
      /(?:stop by|stop at)\s+([a-z\s]+?)(?:\.|,|$)/gi,
    ];

    patterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        errands.push(match[1].trim());
      }
    });

    return errands;
  }

  /**
   * Create errand task
   */
  private async createErrandTask(userId: string, errand: string, requestedBy: string): Promise<void> {
    await (await import('@/integrations/supabase/client')).supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: errand,
        description: `Requested by ${requestedBy}`,
        priority: 'medium',
        status: 'pending',
      });

    logger.log('ContextualAssistant', `Created errand task: ${errand}`);
  }

  /**
   * Save user preference
   */
  private async savePreference(userId: string, text: string): Promise<void> {
    await (await import('@/integrations/supabase/client')).supabase
      .from('knowledge')
      .insert({
        user_id: userId,
        category: 'preferences',
        key: 'user_preference',
        value: text,
      });

    logger.log('ContextualAssistant', 'Saved preference');
  }

  /**
   * Save routine
   */
  private async saveRoutine(userId: string, text: string): Promise<void> {
    await (await import('@/integrations/supabase/client')).supabase
      .from('knowledge')
      .insert({
        user_id: userId,
        category: 'routines',
        key: 'daily_routine',
        value: text,
      });

    logger.log('ContextualAssistant', 'Saved routine');
  }

  /**
   * Speak notification
   */
  private async speakNotification(message: string, priority: string): Promise<void> {
    const utterance = new SpeechSynthesisUtterance(message);
    
    if (priority === 'urgent') {
      utterance.volume = 1.0;
      utterance.rate = 1.0;
    } else if (priority === 'high') {
      utterance.volume = 0.8;
      utterance.rate = 1.1;
    } else {
      utterance.volume = 0.6;
      utterance.rate = 1.2;
    }

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Get current location
   */
  private async getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Update context
   */
  updateContext(updates: Partial<UserContext>): void {
    this.context = { ...this.context, ...updates };
  }

  /**
   * Get context
   */
  getContext(): UserContext {
    return this.context;
  }
}

export const contextualAssistant = new ContextualAssistantService();