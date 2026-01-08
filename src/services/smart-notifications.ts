"use client";

import { logger } from "@/utils/logger";

interface SmartNotification {
  id: string;
  title: string;
  body: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  timestamp: number;
  deliverAt?: number;
  delivered: boolean;
}

interface UserContext {
  isBusy: boolean;
  isInMeeting: boolean;
  isDriving: boolean;
  isSleeping: boolean;
  lastActive: number;
}

/**
 * Smart Notifications Service
 * Intelligent notification delivery with context awareness
 */
class SmartNotificationsService {
  private queue: SmartNotification[] = [];
  private userContext: UserContext = {
    isBusy: false,
    isInMeeting: false,
    isDriving: false,
    isSleeping: false,
    lastActive: Date.now(),
  };
  private dndUntil: number | null = null;

  /**
   * Send smart notification
   */
  async send(notification: Omit<SmartNotification, 'id' | 'timestamp' | 'delivered'>): Promise<void> {
    const smartNotif: SmartNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      delivered: false,
    };

    // Determine delivery time based on priority and context
    const deliverAt = this.calculateDeliveryTime(smartNotif);
    smartNotif.deliverAt = deliverAt;

    this.queue.push(smartNotif);
    
    logger.log('SmartNotifications', `Queued: ${notification.title} (deliver at ${new Date(deliverAt).toLocaleTimeString()})`);

    // Process queue
    this.processQueue();
  }

  /**
   * Calculate optimal delivery time
   */
  private calculateDeliveryTime(notification: SmartNotification): number {
    const now = Date.now();

    // Urgent: deliver immediately
    if (notification.priority === 'urgent') {
      return now;
    }

    // Check DND
    if (this.dndUntil && now < this.dndUntil) {
      // High priority: deliver after DND
      if (notification.priority === 'high') {
        return this.dndUntil;
      }
      // Others: wait until next active period
      return this.dndUntil + 30 * 60 * 1000; // 30 min after DND
    }

    // Check user context
    if (this.userContext.isInMeeting) {
      // Wait until meeting likely ends (assume 1 hour)
      return now + 60 * 60 * 1000;
    }

    if (this.userContext.isDriving) {
      // Wait until likely stopped (assume 30 min)
      return now + 30 * 60 * 1000;
    }

    if (this.userContext.isSleeping) {
      // Wait until morning (8am)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      return tomorrow.getTime();
    }

    // Low priority: batch with others (wait 15 min)
    if (notification.priority === 'low') {
      return now + 15 * 60 * 1000;
    }

    // Medium: deliver soon (wait 5 min)
    if (notification.priority === 'medium') {
      return now + 5 * 60 * 1000;
    }

    // Default: immediate
    return now;
  }

  /**
   * Process notification queue
   */
  private async processQueue(): Promise<void> {
    const now = Date.now();
    const ready = this.queue.filter(n => !n.delivered && n.deliverAt! <= now);

    if (ready.length === 0) return;

    // Group by category
    const grouped = this.groupNotifications(ready);

    // Deliver grouped notifications
    for (const [category, notifications] of Object.entries(grouped)) {
      if (notifications.length === 1) {
        await this.deliver(notifications[0]);
      } else {
        await this.deliverGrouped(category, notifications);
      }
    }

    // Schedule next check
    setTimeout(() => this.processQueue(), 60000); // Check every minute
  }

  /**
   * Group notifications by category
   */
  private groupNotifications(notifications: SmartNotification[]): Record<string, SmartNotification[]> {
    const grouped: Record<string, SmartNotification[]> = {};

    notifications.forEach(n => {
      if (!grouped[n.category]) {
        grouped[n.category] = [];
      }
      grouped[n.category].push(n);
    });

    return grouped;
  }

  /**
   * Deliver single notification
   */
  private async deliver(notification: SmartNotification): Promise<void> {
    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.body,
        icon: '/favicon.ico',
        tag: notification.id,
      });
    }

    // Speak if high priority
    if (notification.priority === 'high' || notification.priority === 'urgent') {
      const utterance = new SpeechSynthesisUtterance(`${notification.title}. ${notification.body}`);
      utterance.volume = 0.5;
      window.speechSynthesis.speak(utterance);
    }

    notification.delivered = true;
    logger.log('SmartNotifications', `Delivered: ${notification.title}`);
  }

  /**
   * Deliver grouped notifications
   */
  private async deliverGrouped(category: string, notifications: SmartNotification[]): Promise<void> {
    const count = notifications.length;
    const title = `${count} ${category} notifications`;
    const body = notifications.map(n => n.title).join(', ');

    // Show single grouped notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: `grouped-${category}`,
      });
    }

    // Speak summary
    const utterance = new SpeechSynthesisUtterance(`You have ${count} ${category} notifications`);
    utterance.volume = 0.5;
    window.speechSynthesis.speak(utterance);

    notifications.forEach(n => n.delivered = true);
    logger.log('SmartNotifications', `Delivered grouped: ${count} ${category} notifications`);
  }

  /**
   * Update user context
   */
  updateContext(context: Partial<UserContext>): void {
    this.userContext = { ...this.userContext, ...context };
    logger.log('SmartNotifications', 'Context updated:', context);
  }

  /**
   * Enable Do Not Disturb
   */
  enableDND(durationMinutes: number): void {
    this.dndUntil = Date.now() + durationMinutes * 60 * 1000;
    logger.log('SmartNotifications', `DND enabled for ${durationMinutes} minutes`);
  }

  /**
   * Disable Do Not Disturb
   */
  disableDND(): void {
    this.dndUntil = null;
    logger.log('SmartNotifications', 'DND disabled');
    
    // Process any queued notifications
    this.processQueue();
  }

  /**
   * Get pending notifications
   */
  getPending(): SmartNotification[] {
    return this.queue.filter(n => !n.delivered);
  }

  /**
   * Clear delivered notifications
   */
  clearDelivered(): void {
    this.queue = this.queue.filter(n => !n.delivered);
  }

  /**
   * Get DND status
   */
  getDNDStatus(): { active: boolean; until?: number } {
    if (this.dndUntil && Date.now() < this.dndUntil) {
      return { active: true, until: this.dndUntil };
    }
    return { active: false };
  }
}

export const smartNotifications = new SmartNotificationsService();