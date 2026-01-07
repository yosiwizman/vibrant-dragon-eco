"use client";

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private maxEvents = 1000;
  private flushInterval = 60000; // 1 minute
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Load existing events from localStorage
    this.loadEvents();
    
    // Start auto-flush
    this.startAutoFlush();
  }

  private loadEvents() {
    try {
      const stored = localStorage.getItem("analytics-events");
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load analytics events:", e);
    }
  }

  private saveEvents() {
    try {
      // Keep only recent events
      if (this.events.length > this.maxEvents) {
        this.events = this.events.slice(-this.maxEvents);
      }
      localStorage.setItem("analytics-events", JSON.stringify(this.events));
    } catch (e) {
      console.error("Failed to save analytics events:", e);
    }
  }

  private startAutoFlush() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Track an event
   */
  track(event: string, properties?: Record<string, any>, userId?: string) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now(),
      userId,
    };

    this.events.push(analyticsEvent);
    this.saveEvents();

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics]", event, properties);
    }
  }

  /**
   * Track page view
   */
  pageView(path: string, userId?: string) {
    this.track("page_view", { path }, userId);
  }

  /**
   * Track widget interaction
   */
  widgetInteraction(
    widgetType: string,
    action: string,
    properties?: Record<string, any>,
    userId?: string
  ) {
    this.track("widget_interaction", {
      widgetType,
      action,
      ...properties,
    }, userId);
  }

  /**
   * Track voice command
   */
  voiceCommand(command: string, success: boolean, userId?: string) {
    this.track("voice_command", {
      command: command.substring(0, 100), // Truncate for privacy
      success,
    }, userId);
  }

  /**
   * Track error
   */
  error(errorMessage: string, context?: Record<string, any>, userId?: string) {
    this.track("error", {
      message: errorMessage,
      ...context,
    }, userId);
  }

  /**
   * Get analytics summary
   */
  getSummary(userId?: string): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    recentEvents: AnalyticsEvent[];
  } {
    const filtered = userId 
      ? this.events.filter(e => e.userId === userId)
      : this.events;

    const eventsByType: Record<string, number> = {};
    filtered.forEach(event => {
      eventsByType[event.event] = (eventsByType[event.event] || 0) + 1;
    });

    return {
      totalEvents: filtered.length,
      eventsByType,
      recentEvents: filtered.slice(-20),
    };
  }

  /**
   * Flush events to external service (placeholder)
   */
  async flush() {
    if (this.events.length === 0) return;

    // In production, send to analytics service (e.g., PostHog, Mixpanel, etc.)
    // For now, just log
    console.log(`[Analytics] Flushing ${this.events.length} events`);

    // Here you would send to your analytics service:
    // await fetch('https://analytics.example.com/events', {
    //   method: 'POST',
    //   body: JSON.stringify(this.events)
    // });

    // Clear old events after successful flush
    // this.events = [];
    // this.saveEvents();
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Singleton instance
export const analytics = new Analytics();

// Convenience functions
export const trackEvent = (event: string, properties?: Record<string, any>, userId?: string) => {
  analytics.track(event, properties, userId);
};

export const trackPageView = (path: string, userId?: string) => {
  analytics.pageView(path, userId);
};

export const trackWidgetInteraction = (
  widgetType: string,
  action: string,
  properties?: Record<string, any>,
  userId?: string
) => {
  analytics.widgetInteraction(widgetType, action, properties, userId);
};

export const trackVoiceCommand = (command: string, success: boolean, userId?: string) => {
  analytics.voiceCommand(command, success, userId);
};

export const trackError = (errorMessage: string, context?: Record<string, any>, userId?: string) => {
  analytics.error(errorMessage, context, userId);
};