"use client";

/**
 * Predictive Intent Service
 * AI-powered intent prediction based on user behavior patterns
 */

interface IntentPattern {
  intent: string;
  triggers: string[];
  timeOfDay?: { start: number; end: number };
  dayOfWeek?: number[];
  frequency: number;
  lastTriggered: number;
  successRate: number;
}

interface PredictedIntent {
  intent: string;
  confidence: number;
  reason: string;
  suggestedAction?: string;
}

interface UserBehavior {
  timestamp: number;
  action: string;
  context: {
    timeOfDay: number;
    dayOfWeek: number;
    previousAction?: string;
    location?: string;
  };
}

interface IntentContext {
  currentTime: Date;
  recentActions: string[];
  activeWidgets: string[];
  pendingTasks: number;
  upcomingEvents: number;
}

class PredictiveIntentService {
  private patterns: Map<string, IntentPattern> = new Map();
  private behaviorHistory: UserBehavior[] = [];
  private readonly MAX_HISTORY = 1000;
  private readonly PREDICTION_THRESHOLD = 0.6;

  constructor() {
    this.loadPatterns();
    this.initializeDefaultPatterns();
  }

  /**
   * Load patterns from storage
   */
  private loadPatterns(): void {
    try {
      const stored = localStorage.getItem('intent_patterns');
      if (stored) {
        const patterns = JSON.parse(stored);
        patterns.forEach((p: IntentPattern) => this.patterns.set(p.intent, p));
      }
    } catch (error) {
      console.error('[predictive-intent] Failed to load patterns:', error);
    }
  }

  /**
   * Save patterns to storage
   */
  private savePatterns(): void {
    try {
      const patterns = Array.from(this.patterns.values());
      localStorage.setItem('intent_patterns', JSON.stringify(patterns));
    } catch (error) {
      console.error('[predictive-intent] Failed to save patterns:', error);
    }
  }

  /**
   * Initialize default intent patterns
   */
  private initializeDefaultPatterns(): void {
    const defaultPatterns: IntentPattern[] = [
      {
        intent: 'morning_routine',
        triggers: ['check_calendar', 'view_tasks', 'weather'],
        timeOfDay: { start: 6, end: 10 },
        frequency: 0,
        lastTriggered: 0,
        successRate: 0.8
      },
      {
        intent: 'end_of_day_review',
        triggers: ['complete_tasks', 'plan_tomorrow', 'summary'],
        timeOfDay: { start: 17, end: 21 },
        frequency: 0,
        lastTriggered: 0,
        successRate: 0.75
      },
      {
        intent: 'quick_task_add',
        triggers: ['create_task', 'add_reminder'],
        frequency: 0,
        lastTriggered: 0,
        successRate: 0.9
      },
      {
        intent: 'meeting_prep',
        triggers: ['check_calendar', 'view_notes', 'contacts'],
        timeOfDay: { start: 8, end: 18 },
        dayOfWeek: [1, 2, 3, 4, 5], // Weekdays
        frequency: 0,
        lastTriggered: 0,
        successRate: 0.7
      },
      {
        intent: 'weekend_planning',
        triggers: ['calendar', 'reminders', 'notes'],
        dayOfWeek: [5, 6], // Friday, Saturday
        frequency: 0,
        lastTriggered: 0,
        successRate: 0.65
      }
    ];

    defaultPatterns.forEach(pattern => {
      if (!this.patterns.has(pattern.intent)) {
        this.patterns.set(pattern.intent, pattern);
      }
    });
  }

  /**
   * Record user behavior
   */
  recordBehavior(action: string, context?: Partial<UserBehavior['context']>): void {
    const now = new Date();
    
    const behavior: UserBehavior = {
      timestamp: Date.now(),
      action,
      context: {
        timeOfDay: now.getHours(),
        dayOfWeek: now.getDay(),
        previousAction: this.behaviorHistory.length > 0 
          ? this.behaviorHistory[this.behaviorHistory.length - 1].action 
          : undefined,
        ...context
      }
    };
    
    this.behaviorHistory.push(behavior);
    
    // Trim history
    if (this.behaviorHistory.length > this.MAX_HISTORY) {
      this.behaviorHistory = this.behaviorHistory.slice(-this.MAX_HISTORY);
    }
    
    // Update patterns based on behavior
    this.updatePatterns(behavior);
  }

  /**
   * Update patterns based on observed behavior
   */
  private updatePatterns(behavior: UserBehavior): void {
    this.patterns.forEach(pattern => {
      if (pattern.triggers.includes(behavior.action)) {
        pattern.frequency++;
        pattern.lastTriggered = behavior.timestamp;
        
        // Check if time/day matches
        const timeMatch = this.checkTimeMatch(pattern, behavior.context.timeOfDay);
        const dayMatch = this.checkDayMatch(pattern, behavior.context.dayOfWeek);
        
        if (timeMatch && dayMatch) {
          pattern.successRate = Math.min(1, pattern.successRate + 0.01);
        }
      }
    });
    
    this.savePatterns();
  }

  /**
   * Check if current time matches pattern
   */
  private checkTimeMatch(pattern: IntentPattern, hour: number): boolean {
    if (!pattern.timeOfDay) return true;
    return hour >= pattern.timeOfDay.start && hour < pattern.timeOfDay.end;
  }

  /**
   * Check if current day matches pattern
   */
  private checkDayMatch(pattern: IntentPattern, day: number): boolean {
    if (!pattern.dayOfWeek) return true;
    return pattern.dayOfWeek.includes(day);
  }

  /**
   * Predict user intent based on context
   */
  predict(context: IntentContext): PredictedIntent[] {
    const predictions: PredictedIntent[] = [];
    const now = context.currentTime;
    const hour = now.getHours();
    const day = now.getDay();
    
    this.patterns.forEach(pattern => {
      let confidence = pattern.successRate * 0.5; // Base confidence from success rate
      let reasons: string[] = [];
      
      // Time-based boost
      if (this.checkTimeMatch(pattern, hour)) {
        confidence += 0.2;
        reasons.push('matches typical time');
      }
      
      // Day-based boost
      if (this.checkDayMatch(pattern, day)) {
        confidence += 0.1;
        reasons.push('matches typical day');
      }
      
      // Recent activity boost
      const recentTriggers = context.recentActions.filter(a => 
        pattern.triggers.includes(a)
      ).length;
      if (recentTriggers > 0) {
        confidence += recentTriggers * 0.1;
        reasons.push('related to recent actions');
      }
      
      // Frequency boost
      if (pattern.frequency > 10) {
        confidence += 0.1;
        reasons.push('frequently used');
      }
      
      // Recency boost
      const hoursSinceLastTrigger = (Date.now() - pattern.lastTriggered) / 3600000;
      if (hoursSinceLastTrigger < 24 && hoursSinceLastTrigger > 0) {
        confidence += 0.05;
        reasons.push('used recently');
      }
      
      // Context-specific boosts
      if (pattern.intent === 'quick_task_add' && context.pendingTasks < 3) {
        confidence += 0.1;
        reasons.push('few pending tasks');
      }
      
      if (pattern.intent === 'meeting_prep' && context.upcomingEvents > 0) {
        confidence += 0.15;
        reasons.push('upcoming events');
      }
      
      // Cap confidence at 1
      confidence = Math.min(1, confidence);
      
      if (confidence >= this.PREDICTION_THRESHOLD) {
        predictions.push({
          intent: pattern.intent,
          confidence,
          reason: reasons.join(', '),
          suggestedAction: this.getSuggestedAction(pattern.intent)
        });
      }
    });
    
    // Sort by confidence
    predictions.sort((a, b) => b.confidence - a.confidence);
    
    return predictions.slice(0, 5); // Top 5 predictions
  }

  /**
   * Get suggested action for an intent
   */
  private getSuggestedAction(intent: string): string {
    const actionMap: Record<string, string> = {
      'morning_routine': 'Would you like me to show your schedule for today?',
      'end_of_day_review': 'Ready to review what you accomplished today?',
      'quick_task_add': 'What task would you like to add?',
      'meeting_prep': 'Shall I prepare notes for your upcoming meeting?',
      'weekend_planning': 'Want to plan your weekend activities?'
    };
    
    return actionMap[intent] || 'How can I help you?';
  }

  /**
   * Learn from user feedback
   */
  provideFeedback(intent: string, wasHelpful: boolean): void {
    const pattern = this.patterns.get(intent);
    if (!pattern) return;
    
    if (wasHelpful) {
      pattern.successRate = Math.min(1, pattern.successRate + 0.05);
    } else {
      pattern.successRate = Math.max(0, pattern.successRate - 0.1);
    }
    
    this.savePatterns();
    console.log('[predictive-intent] Feedback recorded for:', intent, wasHelpful ? '👍' : '👎');
  }

  /**
   * Create custom pattern
   */
  createPattern(pattern: Omit<IntentPattern, 'frequency' | 'lastTriggered' | 'successRate'>): void {
    const newPattern: IntentPattern = {
      ...pattern,
      frequency: 0,
      lastTriggered: 0,
      successRate: 0.5 // Start with neutral success rate
    };
    
    this.patterns.set(pattern.intent, newPattern);
    this.savePatterns();
    
    console.log('[predictive-intent] Created pattern:', pattern.intent);
  }

  /**
   * Get pattern statistics
   */
  getPatternStats(): {
    totalPatterns: number;
    mostFrequent: { intent: string; frequency: number }[];
    highestSuccess: { intent: string; rate: number }[];
    recentlyUsed: { intent: string; lastUsed: number }[];
  } {
    const patterns = Array.from(this.patterns.values());
    
    return {
      totalPatterns: patterns.length,
      mostFrequent: patterns
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5)
        .map(p => ({ intent: p.intent, frequency: p.frequency })),
      highestSuccess: patterns
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 5)
        .map(p => ({ intent: p.intent, rate: p.successRate })),
      recentlyUsed: patterns
        .filter(p => p.lastTriggered > 0)
        .sort((a, b) => b.lastTriggered - a.lastTriggered)
        .slice(0, 5)
        .map(p => ({ intent: p.intent, lastUsed: p.lastTriggered }))
    };
  }

  /**
   * Get behavior insights
   */
  getBehaviorInsights(): {
    totalActions: number;
    peakHours: number[];
    mostCommonActions: { action: string; count: number }[];
    actionSequences: { sequence: string[]; count: number }[];
  } {
    const actionCounts: Record<string, number> = {};
    const hourCounts: Record<number, number> = {};
    const sequences: Record<string, number> = {};
    
    this.behaviorHistory.forEach((behavior, index) => {
      // Count actions
      actionCounts[behavior.action] = (actionCounts[behavior.action] || 0) + 1;
      
      // Count hours
      hourCounts[behavior.context.timeOfDay] = (hourCounts[behavior.context.timeOfDay] || 0) + 1;
      
      // Track sequences (pairs)
      if (index > 0) {
        const prev = this.behaviorHistory[index - 1].action;
        const seq = `${prev}->${behavior.action}`;
        sequences[seq] = (sequences[seq] || 0) + 1;
      }
    });
    
    // Find peak hours
    const peakHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
    
    return {
      totalActions: this.behaviorHistory.length,
      peakHours,
      mostCommonActions: Object.entries(actionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([action, count]) => ({ action, count })),
      actionSequences: Object.entries(sequences)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([seq, count]) => ({ 
          sequence: seq.split('->'), 
          count 
        }))
    };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.patterns.clear();
    this.behaviorHistory = [];
    localStorage.removeItem('intent_patterns');
    this.initializeDefaultPatterns();
    console.log('[predictive-intent] Cleared all data');
  }
}

export const predictiveIntent = new PredictiveIntentService();