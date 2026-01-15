/**
 * Advanced Analytics Service
 * Real-time performance dashboards and user behavior insights
 */

import { logger } from '@/utils/logger';

interface AnalyticsEvent {
  name: string;
  category: string;
  timestamp: number;
  properties: Record<string, any>;
  userId?: string;
  sessionId: string;
}

interface UserSession {
  id: string;
  startTime: number;
  endTime?: number;
  events: AnalyticsEvent[];
  pageViews: string[];
  voiceCommands: number;
  toolsUsed: string[];
}

interface AnalyticsInsight {
  type: 'trend' | 'anomaly' | 'recommendation';
  title: string;
  description: string;
  metric: string;
  value: number;
  change?: number;
  timestamp: number;
}

class AdvancedAnalyticsService {
  private events: AnalyticsEvent[] = [];
  private sessions: Map<string, UserSession> = new Map();
  private currentSessionId: string;
  private insights: AnalyticsInsight[] = [];
  private maxEvents = 10000;

  constructor() {
    this.currentSessionId = this.generateSessionId();
    this.startSession();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start new session
   */
  private startSession(): void {
    const session: UserSession = {
      id: this.currentSessionId,
      startTime: Date.now(),
      events: [],
      pageViews: [],
      voiceCommands: 0,
      toolsUsed: [],
    };
    this.sessions.set(this.currentSessionId, session);
  }

  /**
   * Track event
   */
  track(
    name: string,
    category: string,
    properties: Record<string, any> = {},
    userId?: string
  ): void {
    const event: AnalyticsEvent = {
      name,
      category,
      timestamp: Date.now(),
      properties,
      userId,
      sessionId: this.currentSessionId,
    };

    this.events.push(event);

    // Update session
    const session = this.sessions.get(this.currentSessionId);
    if (session) {
      session.events.push(event);
      
      if (category === 'voice') {
        session.voiceCommands++;
      }
      
      if (category === 'tool' && properties.toolName) {
        if (!session.toolsUsed.includes(properties.toolName)) {
          session.toolsUsed.push(properties.toolName);
        }
      }
      
      if (category === 'navigation' && properties.page) {
        session.pageViews.push(properties.page);
      }
    }

    // Trim old events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Check for anomalies
    this.detectAnomalies(event);
  }

  /**
   * Track page view
   */
  trackPageView(page: string, userId?: string): void {
    this.track('page_view', 'navigation', { page }, userId);
  }

  /**
   * Track voice command
   */
  trackVoiceCommand(command: string, success: boolean, duration: number, userId?: string): void {
    this.track('voice_command', 'voice', { command, success, duration }, userId);
  }

  /**
   * Track tool usage
   */
  trackToolUsage(toolName: string, success: boolean, duration: number, userId?: string): void {
    this.track('tool_usage', 'tool', { toolName, success, duration }, userId);
  }

  /**
   * Detect anomalies in events
   */
  private detectAnomalies(event: AnalyticsEvent): void {
    // Check for error spikes
    const recentErrors = this.events
      .filter(e => e.timestamp > Date.now() - 60000 && e.properties.error)
      .length;

    if (recentErrors > 10) {
      this.addInsight({
        type: 'anomaly',
        title: 'Error Spike Detected',
        description: `${recentErrors} errors in the last minute`,
        metric: 'errors_per_minute',
        value: recentErrors,
        timestamp: Date.now(),
      });
    }

    // Check for slow performance
    if (event.category === 'voice' && event.properties.duration > 5000) {
      this.addInsight({
        type: 'anomaly',
        title: 'Slow Voice Response',
        description: `Voice command took ${event.properties.duration}ms`,
        metric: 'voice_latency',
        value: event.properties.duration,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Add insight
   */
  private addInsight(insight: AnalyticsInsight): void {
    this.insights.push(insight);
    
    // Keep only recent insights
    if (this.insights.length > 100) {
      this.insights = this.insights.slice(-100);
    }
    
    logger.log('Analytics', `Insight: ${insight.title}`);
  }

  /**
   * Get event count by category
   */
  getEventCountByCategory(timeRange: number = 3600000): Record<string, number> {
    const cutoff = Date.now() - timeRange;
    const counts: Record<string, number> = {};
    
    this.events
      .filter(e => e.timestamp > cutoff)
      .forEach(e => {
        counts[e.category] = (counts[e.category] || 0) + 1;
      });
    
    return counts;
  }

  /**
   * Get top tools used
   */
  getTopTools(limit: number = 10): { tool: string; count: number }[] {
    const toolCounts: Record<string, number> = {};
    
    this.events
      .filter(e => e.category === 'tool')
      .forEach(e => {
        const tool = e.properties.toolName;
        if (tool) {
          toolCounts[tool] = (toolCounts[tool] || 0) + 1;
        }
      });
    
    return Object.entries(toolCounts)
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get voice command success rate
   */
  getVoiceSuccessRate(timeRange: number = 3600000): number {
    const cutoff = Date.now() - timeRange;
    const voiceEvents = this.events.filter(
      e => e.category === 'voice' && e.timestamp > cutoff
    );
    
    if (voiceEvents.length === 0) return 100;
    
    const successful = voiceEvents.filter(e => e.properties.success).length;
    return (successful / voiceEvents.length) * 100;
  }

  /**
   * Get average response time
   */
  getAverageResponseTime(category: string, timeRange: number = 3600000): number {
    const cutoff = Date.now() - timeRange;
    const events = this.events.filter(
      e => e.category === category && e.timestamp > cutoff && e.properties.duration
    );
    
    if (events.length === 0) return 0;
    
    const total = events.reduce((sum, e) => sum + e.properties.duration, 0);
    return total / events.length;
  }

  /**
   * Get session summary
   */
  getSessionSummary(): {
    totalSessions: number;
    currentSession: UserSession | undefined;
    avgSessionDuration: number;
    avgVoiceCommandsPerSession: number;
  } {
    const sessions = Array.from(this.sessions.values());
    const currentSession = this.sessions.get(this.currentSessionId);
    
    const completedSessions = sessions.filter(s => s.endTime);
    const avgDuration = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.endTime! - s.startTime), 0) / completedSessions.length
      : 0;
    
    const avgVoiceCommands = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + s.voiceCommands, 0) / sessions.length
      : 0;
    
    return {
      totalSessions: sessions.length,
      currentSession,
      avgSessionDuration: avgDuration,
      avgVoiceCommandsPerSession: avgVoiceCommands,
    };
  }

  /**
   * Get insights
   */
  getInsights(limit: number = 10): AnalyticsInsight[] {
    return this.insights.slice(-limit);
  }

  /**
   * Get real-time dashboard data
   */
  getDashboardData(): {
    eventCounts: Record<string, number>;
    topTools: { tool: string; count: number }[];
    voiceSuccessRate: number;
    avgVoiceLatency: number;
    avgToolLatency: number;
    insights: AnalyticsInsight[];
    sessionSummary: ReturnType<typeof this.getSessionSummary>;
  } {
    return {
      eventCounts: this.getEventCountByCategory(),
      topTools: this.getTopTools(5),
      voiceSuccessRate: this.getVoiceSuccessRate(),
      avgVoiceLatency: this.getAverageResponseTime('voice'),
      avgToolLatency: this.getAverageResponseTime('tool'),
      insights: this.getInsights(5),
      sessionSummary: this.getSessionSummary(),
    };
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(): AnalyticsInsight[] {
    const recommendations: AnalyticsInsight[] = [];
    
    // Check voice success rate
    const voiceRate = this.getVoiceSuccessRate();
    if (voiceRate < 90) {
      recommendations.push({
        type: 'recommendation',
        title: 'Improve Voice Recognition',
        description: 'Voice command success rate is below 90%. Consider speaking more clearly or checking microphone settings.',
        metric: 'voice_success_rate',
        value: voiceRate,
        timestamp: Date.now(),
      });
    }
    
    // Check latency
    const avgLatency = this.getAverageResponseTime('voice');
    if (avgLatency > 3000) {
      recommendations.push({
        type: 'recommendation',
        title: 'Optimize Performance',
        description: 'Average voice response time is high. Consider enabling offline AI for faster responses.',
        metric: 'avg_voice_latency',
        value: avgLatency,
        timestamp: Date.now(),
      });
    }
    
    // Check tool diversity
    const topTools = this.getTopTools(3);
    if (topTools.length < 3) {
      recommendations.push({
        type: 'recommendation',
        title: 'Explore More Features',
        description: 'You\'re only using a few tools. Try voice commands like "create reminder" or "search notes".',
        metric: 'tool_diversity',
        value: topTools.length,
        timestamp: Date.now(),
      });
    }
    
    return recommendations;
  }

  /**
   * End current session
   */
  endSession(): void {
    const session = this.sessions.get(this.currentSessionId);
    if (session) {
      session.endTime = Date.now();
    }
    
    // Start new session
    this.currentSessionId = this.generateSessionId();
    this.startSession();
  }

  /**
   * Export analytics data
   */
  exportData(): {
    events: AnalyticsEvent[];
    sessions: UserSession[];
    insights: AnalyticsInsight[];
  } {
    return {
      events: this.events,
      sessions: Array.from(this.sessions.values()),
      insights: this.insights,
    };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.events = [];
    this.sessions.clear();
    this.insights = [];
    this.startSession();
  }
}

export const advancedAnalytics = new AdvancedAnalyticsService();