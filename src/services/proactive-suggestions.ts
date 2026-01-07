"use client";

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

interface Suggestion {
  id: string;
  type: 'task' | 'reminder' | 'event' | 'info';
  title: string;
  message: string;
  action?: () => void;
  priority: 'low' | 'medium' | 'high';
  timestamp: number;
}

/**
 * Proactive Suggestions Service
 * Analyzes user behavior and provides intelligent suggestions
 */
class ProactiveSuggestionsService {
  private suggestions: Suggestion[] = [];
  private listeners: Set<(suggestions: Suggestion[]) => void> = new Set();

  /**
   * Analyze user data and generate suggestions
   */
  async analyzeSuggestions(userId: string): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    // Check for overdue tasks
    const overdueSuggestion = await this.checkOverdueTasks(userId);
    if (overdueSuggestion) suggestions.push(overdueSuggestion);

    // Check for upcoming events
    const upcomingSuggestion = await this.checkUpcomingEvents(userId);
    if (upcomingSuggestion) suggestions.push(upcomingSuggestion);

    // Check for incomplete daily tasks
    const dailySuggestion = await this.checkDailyTasks(userId);
    if (dailySuggestion) suggestions.push(dailySuggestion);

    // Check for scheduling conflicts
    const conflictSuggestion = await this.checkConflicts(userId);
    if (conflictSuggestion) suggestions.push(conflictSuggestion);

    // Check for productivity patterns
    const productivitySuggestion = await this.checkProductivity(userId);
    if (productivitySuggestion) suggestions.push(productivitySuggestion);

    this.suggestions = suggestions;
    this.notifyListeners();

    return suggestions;
  }

  /**
   * Check for overdue tasks
   */
  private async checkOverdueTasks(userId: string): Promise<Suggestion | null> {
    const { data: overdue } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString())
      .limit(5);

    if (overdue && overdue.length > 0) {
      return {
        id: 'overdue-tasks',
        type: 'task',
        title: 'Overdue Tasks',
        message: `You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}. Would you like to reschedule them?`,
        priority: 'high',
        timestamp: Date.now(),
      };
    }

    return null;
  }

  /**
   * Check for upcoming events
   */
  private async checkUpcomingEvents(userId: string): Promise<Suggestion | null> {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const { data: upcoming } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', now.toISOString())
      .lte('start_time', oneHourFromNow.toISOString())
      .limit(1);

    if (upcoming && upcoming.length > 0) {
      const event = upcoming[0];
      const minutesUntil = Math.round((new Date(event.start_time).getTime() - now.getTime()) / 60000);

      return {
        id: 'upcoming-event',
        type: 'event',
        title: 'Upcoming Event',
        message: `"${event.title}" starts in ${minutesUntil} minutes${event.location ? ` at ${event.location}` : ''}.`,
        priority: minutesUntil <= 15 ? 'high' : 'medium',
        timestamp: Date.now(),
      };
    }

    return null;
  }

  /**
   * Check daily task completion
   */
  private async checkDailyTasks(userId: string): Promise<Suggestion | null> {
    const hour = new Date().getHours();
    
    // Only suggest in evening (after 6pm)
    if (hour < 18) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gte('created_at', today.toISOString());

    if (todayTasks && todayTasks.length > 3) {
      return {
        id: 'daily-tasks',
        type: 'task',
        title: 'Daily Review',
        message: `You have ${todayTasks.length} tasks left today. Want to review and reschedule some for tomorrow?`,
        priority: 'low',
        timestamp: Date.now(),
      };
    }

    return null;
  }

  /**
   * Check for scheduling conflicts
   */
  private async checkConflicts(userId: string): Promise<Suggestion | null> {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: events } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', now.toISOString())
      .lte('start_time', tomorrow.toISOString())
      .order('start_time', { ascending: true });

    if (events && events.length > 1) {
      // Check for overlapping events
      for (let i = 0; i < events.length - 1; i++) {
        const current = events[i];
        const next = events[i + 1];
        
        if (new Date(current.end_time) > new Date(next.start_time)) {
          return {
            id: 'schedule-conflict',
            type: 'event',
            title: 'Schedule Conflict',
            message: `"${current.title}" and "${next.title}" overlap. Would you like to reschedule one?`,
            priority: 'high',
            timestamp: Date.now(),
          };
        }
      }
    }

    return null;
  }

  /**
   * Check productivity patterns
   */
  private async checkProductivity(userId: string): Promise<Suggestion | null> {
    const hour = new Date().getHours();
    
    // Morning productivity check (9-10am)
    if (hour === 9 || hour === 10) {
      const { data: todayCompleted } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', new Date().setHours(0, 0, 0, 0));

      if (!todayCompleted || todayCompleted.length === 0) {
        return {
          id: 'morning-productivity',
          type: 'info',
          title: 'Start Your Day',
          message: 'Good morning! Ready to tackle your tasks? Say "read my tasks" to get started.',
          priority: 'low',
          timestamp: Date.now(),
        };
      }
    }

    return null;
  }

  /**
   * Subscribe to suggestion updates
   */
  subscribe(callback: (suggestions: Suggestion[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(cb => cb(this.suggestions));
  }

  /**
   * Get current suggestions
   */
  getSuggestions(): Suggestion[] {
    return this.suggestions;
  }

  /**
   * Dismiss suggestion
   */
  dismiss(id: string): void {
    this.suggestions = this.suggestions.filter(s => s.id !== id);
    this.notifyListeners();
  }

  /**
   * Clear all suggestions
   */
  clear(): void {
    this.suggestions = [];
    this.notifyListeners();
  }
}

export const proactiveSuggestions = new ProactiveSuggestionsService();