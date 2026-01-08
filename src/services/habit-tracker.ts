"use client";

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

interface Habit {
  id: string;
  userId: string;
  type: 'location' | 'activity' | 'routine' | 'preference';
  pattern: string;
  frequency: number;
  confidence: number;
  lastOccurrence: number;
  metadata: Record<string, any>;
}

interface LocationPattern {
  place: string;
  arrivalTime: string;
  departureTime: string;
  daysOfWeek: number[];
  frequency: number;
}

interface DailyRoutine {
  timeSlot: string;
  activity: string;
  location?: string;
  duration: number;
  confidence: number;
}

/**
 * Habit Tracker Service
 * Learns user patterns and routines for intelligent assistance
 */
class HabitTrackerService {
  private habits = new Map<string, Habit>();
  private locationHistory: Array<{ lat: number; lng: number; timestamp: number; place?: string }> = [];

  /**
   * Track user location
   */
  async trackLocation(lat: number, lng: number, place?: string): Promise<void> {
    this.locationHistory.push({
      lat,
      lng,
      timestamp: Date.now(),
      place,
    });

    // Keep only last 1000 locations
    if (this.locationHistory.length > 1000) {
      this.locationHistory = this.locationHistory.slice(-1000);
    }

    // Analyze for patterns
    await this.analyzeLocationPatterns();
  }

  /**
   * Analyze location patterns
   */
  private async analyzeLocationPatterns(): Promise<void> {
    // Group by place
    const placeVisits = new Map<string, number[]>();

    this.locationHistory.forEach(loc => {
      if (loc.place) {
        if (!placeVisits.has(loc.place)) {
          placeVisits.set(loc.place, []);
        }
        placeVisits.get(loc.place)!.push(loc.timestamp);
      }
    });

    // Detect patterns
    placeVisits.forEach((timestamps, place) => {
      if (timestamps.length < 3) return; // Need at least 3 visits

      // Analyze arrival/departure times
      const arrivalTimes = timestamps.map(t => new Date(t).getHours());
      const avgArrival = arrivalTimes.reduce((a, b) => a + b, 0) / arrivalTimes.length;

      // Detect days of week
      const daysOfWeek = timestamps.map(t => new Date(t).getDay());
      const commonDays = this.findCommonDays(daysOfWeek);

      // Create habit
      const habit: Habit = {
        id: `location-${place}`,
        userId: '', // Set from context
        type: 'location',
        pattern: `Visits ${place} at ${Math.round(avgArrival)}:00`,
        frequency: timestamps.length,
        confidence: Math.min(timestamps.length / 10, 1),
        lastOccurrence: Math.max(...timestamps),
        metadata: {
          place,
          avgArrival,
          commonDays,
        },
      };

      this.habits.set(habit.id, habit);
    });
  }

  /**
   * Find common days of week
   */
  private findCommonDays(days: number[]): number[] {
    const counts = new Map<number, number>();
    days.forEach(day => {
      counts.set(day, (counts.get(day) || 0) + 1);
    });

    // Return days that appear more than 50% of the time
    const threshold = days.length * 0.5;
    return Array.from(counts.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([day, _]) => day);
  }

  /**
   * Learn daily routine
   */
  async learnDailyRoutine(userId: string): Promise<DailyRoutine[]> {
    const routines: DailyRoutine[] = [];

    // Analyze calendar events
    const { data: events } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (events) {
      // Group by time slot
      const timeSlots = new Map<string, any[]>();

      events.forEach(event => {
        const hour = new Date(event.start_time).getHours();
        const slot = this.getTimeSlot(hour);
        
        if (!timeSlots.has(slot)) {
          timeSlots.set(slot, []);
        }
        timeSlots.get(slot)!.push(event);
      });

      // Create routines
      timeSlots.forEach((events, slot) => {
        if (events.length < 3) return;

        const commonActivity = this.findCommonActivity(events);
        const avgDuration = events.reduce((sum, e) => {
          const start = new Date(e.start_time).getTime();
          const end = new Date(e.end_time).getTime();
          return sum + (end - start);
        }, 0) / events.length / 60000; // Convert to minutes

        routines.push({
          timeSlot: slot,
          activity: commonActivity,
          location: events[0].location,
          duration: Math.round(avgDuration),
          confidence: Math.min(events.length / 10, 1),
        });
      });
    }

    return routines;
  }

  /**
   * Get time slot
   */
  private getTimeSlot(hour: number): string {
    if (hour < 6) return 'night';
    if (hour < 9) return 'early-morning';
    if (hour < 12) return 'morning';
    if (hour < 14) return 'midday';
    if (hour < 17) return 'afternoon';
    if (hour < 20) return 'evening';
    return 'night';
  }

  /**
   * Find common activity
   */
  private findCommonActivity(events: any[]): string {
    const titles = events.map(e => e.title.toLowerCase());
    
    // Find most common words
    const words = new Map<string, number>();
    titles.forEach(title => {
      title.split(/\s+/).forEach(word => {
        if (word.length > 3) {
          words.set(word, (words.get(word) || 0) + 1);
        }
      });
    });

    // Return most common word
    let maxWord = '';
    let maxCount = 0;
    words.forEach((count, word) => {
      if (count > maxCount) {
        maxCount = count;
        maxWord = word;
      }
    });

    return maxWord || 'activity';
  }

  /**
   * Get all habits
   */
  getHabits(): Habit[] {
    return Array.from(this.habits.values());
  }

  /**
   * Get habits by type
   */
  getHabitsByType(type: Habit['type']): Habit[] {
    return this.getHabits().filter(h => h.type === type);
  }

  /**
   * Save habits to database
   */
  async saveHabits(userId: string): Promise<void> {
    const habits = this.getHabits();
    
    // Save to knowledge base
    for (const habit of habits) {
      await supabase.from('knowledge').upsert({
        user_id: userId,
        category: 'habits',
        key: habit.pattern,
        value: JSON.stringify(habit.metadata),
      });
    }

    logger.log('HabitTracker', `Saved ${habits.length} habits`);
  }
}

export const habitTracker = new HabitTrackerService();