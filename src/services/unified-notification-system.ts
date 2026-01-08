"use client";

import { logger } from "@/utils/logger";
import { supabase } from "@/integrations/supabase/client";
import { intelligentScheduler } from "./intelligent-scheduler";
import { contextualAssistant } from "./contextual-assistant";
import { smartNotifications } from "./smart-notifications";
import { habitTracker } from "./habit-tracker";

interface VoiceNotification {
  id: string;
  type: 'traffic' | 'departure' | 'errand' | 'reminder' | 'event' | 'task' | 'system';
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: number;
  spoken: boolean;
  metadata?: Record<string, any>;
}

/**
 * Unified Notification System
 * All notifications are spoken by Echo - no silent badges
 * Wired from location, time, traffic, calendar, tasks, etc.
 */
class UnifiedNotificationSystem {
  private queue: VoiceNotification[] = [];
  private isProcessing = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Start monitoring all systems
   */
  async startMonitoring(userId: string): Promise<void> {
    if (this.monitoringInterval) {
      logger.warn('UnifiedNotifications', 'Already monitoring');
      return;
    }

    logger.log('UnifiedNotifications', 'Started monitoring all systems');

    // Check every minute
    this.monitoringInterval = setInterval(async () => {
      await this.checkAllSystems(userId);
    }, 60000);

    // Initial check
    await this.checkAllSystems(userId);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.log('UnifiedNotifications', 'Stopped monitoring');
    }
  }

  /**
   * Check all systems for notifications
   */
  private async checkAllSystems(userId: string): Promise<void> {
    // 1. Check traffic & departure times
    await this.checkTrafficAndDeparture(userId);

    // 2. Check time-based reminders
    await this.checkTimeBasedReminders(userId);

    // 3. Check location-based notifications
    await this.checkLocationNotifications(userId);

    // 4. Check calendar events
    await this.checkCalendarEvents(userId);

    // 5. Check task deadlines
    await this.checkTaskDeadlines(userId);

    // 6. Check errands on route
    await this.checkErrandsOnRoute(userId);

    // Process queue
    await this.processQueue();
  }

  /**
   * Check traffic and departure times (Your office to school scenario)
   */
  private async checkTrafficAndDeparture(userId: string): Promise<void> {
    try {
      // Get next event
      const { data: nextEvent } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(1)
        .single();

      if (!nextEvent || !nextEvent.location) return;

      const eventTime = new Date(nextEvent.start_time).getTime();
      const now = Date.now();
      const minutesUntilEvent = (eventTime - now) / 60000;

      // Only check if event is within next 2 hours
      if (minutesUntilEvent > 120) return;

      // Get current location
      const currentLocation = await this.getCurrentLocation();
      if (!currentLocation) return;

      // Calculate travel time with traffic
      const travelTime = await intelligentScheduler['calculateTravelTime'](
        currentLocation,
        { lat: 0, lng: 0 }, // Event location (would geocode in production)
        eventTime
      );

      const travelMinutes = travelTime.duration / 60000;
      const bufferMinutes = 5;
      const shouldLeaveIn = minutesUntilEvent - travelMinutes - bufferMinutes;

      // Notify if should leave soon
      if (shouldLeaveIn <= 10 && shouldLeaveIn > 0) {
        const trafficStatus = travelTime.traffic === 'heavy' ? 'Traffic is heavy!' : 
                             travelTime.traffic === 'moderate' ? 'Moderate traffic.' : 
                             'Traffic is light.';

        this.queueNotification({
          type: 'departure',
          message: `Time to leave in ${Math.round(shouldLeaveIn)} minutes for ${nextEvent.title}. ${Math.round(travelMinutes)} minute drive. ${trafficStatus}`,
          priority: travelTime.traffic === 'heavy' ? 'urgent' : 'high',
          metadata: {
            eventId: nextEvent.id,
            travelTime: travelMinutes,
            traffic: travelTime.traffic,
          },
        });
      } else if (shouldLeaveIn <= 0) {
        this.queueNotification({
          type: 'departure',
          message: `Leave NOW for ${nextEvent.title}! ${Math.round(travelMinutes)} minute drive with ${travelTime.traffic} traffic.`,
          priority: 'urgent',
          metadata: {
            eventId: nextEvent.id,
            travelTime: travelMinutes,
            traffic: travelTime.traffic,
          },
        });
      }
    } catch (error) {
      logger.error('UnifiedNotifications', 'Traffic check failed:', error);
    }
  }

  /**
   * Check time-based reminders
   */
  private async checkTimeBasedReminders(userId: string): Promise<void> {
    try {
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      const { data: reminders } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .gte('due_time', now.toISOString())
        .lte('due_time', fiveMinutesFromNow.toISOString());

      if (reminders && reminders.length > 0) {
        reminders.forEach(reminder => {
          const dueTime = new Date(reminder.due_time);
          const minutesUntil = Math.round((dueTime.getTime() - now.getTime()) / 60000);

          this.queueNotification({
            type: 'reminder',
            message: `Reminder: ${reminder.text}. Due in ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}.`,
            priority: minutesUntil <= 1 ? 'urgent' : 'high',
            metadata: { reminderId: reminder.id },
          });
        });
      }
    } catch (error) {
      logger.error('UnifiedNotifications', 'Reminder check failed:', error);
    }
  }

  /**
   * Check location-based notifications
   */
  private async checkLocationNotifications(userId: string): Promise<void> {
    // Check if user is near saved locations
    const currentLocation = await this.getCurrentLocation();
    if (!currentLocation) return;

    // This would check saved places and notify when nearby
    // "You're near the grocery store. Want to stop for milk?"
  }

  /**
   * Check calendar events
   */
  private async checkCalendarEvents(userId: string): Promise<void> {
    try {
      const now = new Date();
      const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

      const { data: events } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', now.toISOString())
        .lte('start_time', thirtyMinutesFromNow.toISOString());

      if (events && events.length > 0) {
        events.forEach(event => {
          const startTime = new Date(event.start_time);
          const minutesUntil = Math.round((startTime.getTime() - now.getTime()) / 60000);

          this.queueNotification({
            type: 'event',
            message: `${event.title} starts in ${minutesUntil} minutes${event.location ? ` at ${event.location}` : ''}.`,
            priority: minutesUntil <= 10 ? 'high' : 'medium',
            metadata: { eventId: event.id },
          });
        });
      }
    } catch (error) {
      logger.error('UnifiedNotifications', 'Event check failed:', error);
    }
  }

  /**
   * Check task deadlines
   */
  private async checkTaskDeadlines(userId: string): Promise<void> {
    try {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .gte('due_date', now.toISOString())
        .lte('due_date', oneHourFromNow.toISOString());

      if (tasks && tasks.length > 0) {
        tasks.forEach(task => {
          const dueDate = new Date(task.due_date);
          const minutesUntil = Math.round((dueDate.getTime() - now.getTime()) / 60000);

          this.queueNotification({
            type: 'task',
            message: `Task "${task.title}" is due in ${minutesUntil} minutes.`,
            priority: task.priority === 'urgent' ? 'urgent' : 'medium',
            metadata: { taskId: task.id },
          });
        });
      }
    } catch (error) {
      logger.error('UnifiedNotifications', 'Task check failed:', error);
    }
  }

  /**
   * Check errands on route (Your milk scenario)
   */
  private async checkErrandsOnRoute(userId: string): Promise<void> {
    // Get pending errands from contextual assistant
    const context = contextualAssistant.getContext();
    
    if (context.pendingErrands.length > 0) {
      // Check if user is leaving (would need location tracking)
      // For now, notify when next event is coming up
      
      this.queueNotification({
        type: 'errand',
        message: `Before you go, remember to ${context.pendingErrands.join(', ')}.`,
        priority: 'high',
        metadata: { errands: context.pendingErrands },
      });
    }
  }

  /**
   * Queue notification
   */
  private queueNotification(notification: Omit<VoiceNotification, 'id' | 'timestamp' | 'spoken'>): void {
    const fullNotification: VoiceNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      spoken: false,
    };

    // Insert based on priority
    if (notification.priority === 'urgent') {
      this.queue.unshift(fullNotification);
    } else {
      this.queue.push(fullNotification);
    }

    logger.log('UnifiedNotifications', `Queued: ${notification.message}`);
  }

  /**
   * Process notification queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const notification = this.queue.shift()!;
      
      if (notification.spoken) continue;

      // Speak notification
      await this.speakNotification(notification);
      
      notification.spoken = true;

      // Small delay between notifications
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.isProcessing = false;
  }

  /**
   * Speak notification with appropriate voice settings
   */
  private async speakNotification(notification: VoiceNotification): Promise<void> {
    const utterance = new SpeechSynthesisUtterance(notification.message);

    // Set voice parameters based on priority
    switch (notification.priority) {
      case 'urgent':
        utterance.volume = 1.0;
        utterance.rate = 1.0;
        utterance.pitch = 1.1; // Slightly higher pitch for urgency
        break;
      case 'high':
        utterance.volume = 0.9;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        break;
      case 'medium':
        utterance.volume = 0.7;
        utterance.rate = 1.1;
        utterance.pitch = 1.0;
        break;
      case 'low':
        utterance.volume = 0.5;
        utterance.rate = 1.2;
        utterance.pitch = 0.9;
        break;
    }

    // Speak
    window.speechSynthesis.speak(utterance);

    // Also show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Echo AI', {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
      });
    }

    logger.log('UnifiedNotifications', `Spoke: ${notification.message}`);
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
   * Manually trigger notification
   */
  async notify(
    type: VoiceNotification['type'],
    message: string,
    priority: VoiceNotification['priority'] = 'medium',
    metadata?: Record<string, any>
  ): Promise<void> {
    this.queueNotification({ type, message, priority, metadata });
    await this.processQueue();
  }

  /**
   * Get pending notifications
   */
  getPending(): VoiceNotification[] {
    return this.queue.filter(n => !n.spoken);
  }

  /**
   * Clear queue
   */
  clearQueue(): void {
    this.queue = [];
  }
}

export const unifiedNotifications = new UnifiedNotificationSystem();