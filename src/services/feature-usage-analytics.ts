"use client";

/**
 * Feature Usage Analytics Service
 * Track feature adoption and usage patterns
 */

interface FeatureUsage {
  featureId: string;
  name: string;
  category: string;
  usageCount: number;
  uniqueUsers: Set<string>;
  firstUsed: number;
  lastUsed: number;
  avgDuration: number;
  successRate: number;
  abandonmentRate: number;
}

interface UsageEvent {
  featureId: string;
  userId: string;
  timestamp: number;
  action: 'start' | 'complete' | 'abandon' | 'error';
  duration?: number;
  metadata?: Record<string, any>;
}

interface FeatureInsight {
  featureId: string;
  insight: string;
  type: 'positive' | 'negative' | 'neutral';
  recommendation?: string;
}

interface AdoptionMetrics {
  totalFeatures: number;
  activeFeatures: number;
  adoptionRate: number;
  topFeatures: { featureId: string; usageCount: number }[];
  underutilizedFeatures: { featureId: string; usageCount: number }[];
  recentlyAdopted: { featureId: string; firstUsed: number }[];
}

class FeatureUsageAnalyticsService {
  private features: Map<string, FeatureUsage> = new Map();
  private events: UsageEvent[] = [];
  private activeOperations: Map<string, { featureId: string; startTime: number }> = new Map();
  private currentUserId: string = 'anonymous';
  private readonly MAX_EVENTS = 10000;

  constructor() {
    this.loadData();
    this.initializeDefaultFeatures();
  }

  /**
   * Initialize with user ID
   */
  initialize(userId: string): void {
    this.currentUserId = userId;
    console.log('[feature-usage] Initialized for user:', userId);
  }

  /**
   * Load data from storage
   */
  private loadData(): void {
    try {
      const stored = localStorage.getItem('feature_usage_data');
      if (stored) {
        const data = JSON.parse(stored);
        data.features.forEach((f: any) => {
          f.uniqueUsers = new Set(f.uniqueUsers);
          this.features.set(f.featureId, f);
        });
      }
    } catch (error) {
      console.error('[feature-usage] Failed to load data:', error);
    }
  }

  /**
   * Save data to storage
   */
  private saveData(): void {
    try {
      const features = Array.from(this.features.values()).map(f => ({
        ...f,
        uniqueUsers: Array.from(f.uniqueUsers)
      }));
      localStorage.setItem('feature_usage_data', JSON.stringify({ features }));
    } catch (error) {
      console.error('[feature-usage] Failed to save data:', error);
    }
  }

  /**
   * Initialize default features
   */
  private initializeDefaultFeatures(): void {
    const defaultFeatures = [
      { id: 'voice_commands', name: 'Voice Commands', category: 'voice' },
      { id: 'task_management', name: 'Task Management', category: 'productivity' },
      { id: 'reminders', name: 'Reminders', category: 'productivity' },
      { id: 'notes', name: 'Notes', category: 'productivity' },
      { id: 'calendar', name: 'Calendar', category: 'productivity' },
      { id: 'widgets', name: 'Dashboard Widgets', category: 'ui' },
      { id: 'offline_mode', name: 'Offline Mode', category: 'system' },
      { id: 'conversation_mode', name: 'Conversation Mode', category: 'voice' },
      { id: 'smart_scheduling', name: 'Smart Scheduling', category: 'ai' },
      { id: 'knowledge_base', name: 'Knowledge Base', category: 'ai' },
      { id: 'contacts', name: 'Contacts', category: 'productivity' },
      { id: 'notifications', name: 'Notifications', category: 'system' },
      { id: 'analytics', name: 'Analytics Dashboard', category: 'system' },
      { id: 'settings', name: 'Settings', category: 'system' }
    ];

    defaultFeatures.forEach(({ id, name, category }) => {
      if (!this.features.has(id)) {
        this.features.set(id, {
          featureId: id,
          name,
          category,
          usageCount: 0,
          uniqueUsers: new Set(),
          firstUsed: 0,
          lastUsed: 0,
          avgDuration: 0,
          successRate: 1,
          abandonmentRate: 0
        });
      }
    });
  }

  /**
   * Start tracking feature usage
   */
  startUsage(featureId: string, metadata?: Record<string, any>): string {
    const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.activeOperations.set(operationId, {
      featureId,
      startTime: Date.now()
    });

    this.recordEvent({
      featureId,
      userId: this.currentUserId,
      timestamp: Date.now(),
      action: 'start',
      metadata
    });

    return operationId;
  }

  /**
   * Complete feature usage
   */
  completeUsage(operationId: string, metadata?: Record<string, any>): void {
    const operation = this.activeOperations.get(operationId);
    if (!operation) return;

    const duration = Date.now() - operation.startTime;
    
    this.recordEvent({
      featureId: operation.featureId,
      userId: this.currentUserId,
      timestamp: Date.now(),
      action: 'complete',
      duration,
      metadata
    });

    this.updateFeatureStats(operation.featureId, 'complete', duration);
    this.activeOperations.delete(operationId);
  }

  /**
   * Record feature abandonment
   */
  abandonUsage(operationId: string, reason?: string): void {
    const operation = this.activeOperations.get(operationId);
    if (!operation) return;

    const duration = Date.now() - operation.startTime;
    
    this.recordEvent({
      featureId: operation.featureId,
      userId: this.currentUserId,
      timestamp: Date.now(),
      action: 'abandon',
      duration,
      metadata: { reason }
    });

    this.updateFeatureStats(operation.featureId, 'abandon', duration);
    this.activeOperations.delete(operationId);
  }

  /**
   * Record feature error
   */
  recordError(featureId: string, error: string): void {
    this.recordEvent({
      featureId,
      userId: this.currentUserId,
      timestamp: Date.now(),
      action: 'error',
      metadata: { error }
    });

    this.updateFeatureStats(featureId, 'error');
  }

  /**
   * Quick track (for simple feature usage without duration)
   */
  track(featureId: string, metadata?: Record<string, any>): void {
    this.recordEvent({
      featureId,
      userId: this.currentUserId,
      timestamp: Date.now(),
      action: 'complete',
      metadata
    });

    this.updateFeatureStats(featureId, 'complete');
  }

  /**
   * Record usage event
   */
  private recordEvent(event: UsageEvent): void {
    this.events.push(event);

    // Trim old events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }
  }

  /**
   * Update feature statistics
   */
  private updateFeatureStats(
    featureId: string, 
    action: 'complete' | 'abandon' | 'error',
    duration?: number
  ): void {
    let feature = this.features.get(featureId);
    
    if (!feature) {
      feature = {
        featureId,
        name: featureId,
        category: 'unknown',
        usageCount: 0,
        uniqueUsers: new Set(),
        firstUsed: Date.now(),
        lastUsed: Date.now(),
        avgDuration: 0,
        successRate: 1,
        abandonmentRate: 0
      };
      this.features.set(featureId, feature);
    }

    feature.usageCount++;
    feature.uniqueUsers.add(this.currentUserId);
    feature.lastUsed = Date.now();
    
    if (feature.firstUsed === 0) {
      feature.firstUsed = Date.now();
    }

    // Update duration average
    if (duration !== undefined) {
      feature.avgDuration = (feature.avgDuration * (feature.usageCount - 1) + duration) / feature.usageCount;
    }

    // Update success/abandonment rates
    const recentEvents = this.events
      .filter(e => e.featureId === featureId)
      .slice(-100);
    
    const completions = recentEvents.filter(e => e.action === 'complete').length;
    const abandonments = recentEvents.filter(e => e.action === 'abandon').length;
    const errors = recentEvents.filter(e => e.action === 'error').length;
    const total = completions + abandonments + errors;

    if (total > 0) {
      feature.successRate = completions / total;
      feature.abandonmentRate = abandonments / total;
    }

    this.saveData();
  }

  /**
   * Get feature usage stats
   */
  getFeatureStats(featureId: string): FeatureUsage | null {
    return this.features.get(featureId) || null;
  }

  /**
   * Get all features
   */
  getAllFeatures(): FeatureUsage[] {
    return Array.from(this.features.values());
  }

  /**
   * Get features by category
   */
  getFeaturesByCategory(category: string): FeatureUsage[] {
    return Array.from(this.features.values())
      .filter(f => f.category === category);
  }

  /**
   * Get adoption metrics
   */
  getAdoptionMetrics(): AdoptionMetrics {
    const features = Array.from(this.features.values());
    const activeFeatures = features.filter(f => f.usageCount > 0);
    
    return {
      totalFeatures: features.length,
      activeFeatures: activeFeatures.length,
      adoptionRate: features.length > 0 
        ? (activeFeatures.length / features.length) * 100 
        : 0,
      topFeatures: features
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5)
        .map(f => ({ featureId: f.featureId, usageCount: f.usageCount })),
      underutilizedFeatures: features
        .filter(f => f.usageCount < 5)
        .sort((a, b) => a.usageCount - b.usageCount)
        .slice(0, 5)
        .map(f => ({ featureId: f.featureId, usageCount: f.usageCount })),
      recentlyAdopted: features
        .filter(f => f.firstUsed > Date.now() - 7 * 24 * 60 * 60 * 1000)
        .sort((a, b) => b.firstUsed - a.firstUsed)
        .slice(0, 5)
        .map(f => ({ featureId: f.featureId, firstUsed: f.firstUsed }))
    };
  }

  /**
   * Generate feature insights
   */
  generateInsights(): FeatureInsight[] {
    const insights: FeatureInsight[] = [];
    const features = Array.from(this.features.values());

    features.forEach(feature => {
      // High abandonment rate
      if (feature.abandonmentRate > 0.3 && feature.usageCount > 10) {
        insights.push({
          featureId: feature.featureId,
          insight: `${feature.name} has a ${Math.round(feature.abandonmentRate * 100)}% abandonment rate`,
          type: 'negative',
          recommendation: 'Consider simplifying the feature or adding better guidance'
        });
      }

      // Low success rate
      if (feature.successRate < 0.7 && feature.usageCount > 10) {
        insights.push({
          featureId: feature.featureId,
          insight: `${feature.name} has a ${Math.round(feature.successRate * 100)}% success rate`,
          type: 'negative',
          recommendation: 'Investigate common failure points and improve error handling'
        });
      }

      // High usage
      if (feature.usageCount > 100) {
        insights.push({
          featureId: feature.featureId,
          insight: `${feature.name} is heavily used (${feature.usageCount} times)`,
          type: 'positive',
          recommendation: 'Consider adding power-user features'
        });
      }

      // Underutilized
      if (feature.usageCount < 5 && feature.firstUsed > 0) {
        insights.push({
          featureId: feature.featureId,
          insight: `${feature.name} is underutilized`,
          type: 'neutral',
          recommendation: 'Consider improving discoverability or removing if not needed'
        });
      }

      // Slow feature
      if (feature.avgDuration > 5000 && feature.usageCount > 10) {
        insights.push({
          featureId: feature.featureId,
          insight: `${feature.name} takes ${Math.round(feature.avgDuration / 1000)}s on average`,
          type: 'negative',
          recommendation: 'Optimize performance or add loading indicators'
        });
      }
    });

    return insights;
  }

  /**
   * Get usage trends
   */
  getUsageTrends(featureId: string, days: number = 7): { date: string; count: number }[] {
    const trends: Record<string, number> = {};
    const startDate = Date.now() - days * 24 * 60 * 60 * 1000;

    this.events
      .filter(e => e.featureId === featureId && e.timestamp >= startDate)
      .forEach(e => {
        const date = new Date(e.timestamp).toISOString().split('T')[0];
        trends[date] = (trends[date] || 0) + 1;
      });

    return Object.entries(trends)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));
  }

  /**
   * Get category breakdown
   */
  getCategoryBreakdown(): { category: string; totalUsage: number; featureCount: number }[] {
    const categories: Record<string, { totalUsage: number; featureCount: number }> = {};

    this.features.forEach(feature => {
      if (!categories[feature.category]) {
        categories[feature.category] = { totalUsage: 0, featureCount: 0 };
      }
      categories[feature.category].totalUsage += feature.usageCount;
      categories[feature.category].featureCount++;
    });

    return Object.entries(categories)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.totalUsage - a.totalUsage);
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.features.clear();
    this.events = [];
    this.activeOperations.clear();
    localStorage.removeItem('feature_usage_data');
    this.initializeDefaultFeatures();
    console.log('[feature-usage] Cleared all data');
  }
}

export const featureUsageAnalytics = new FeatureUsageAnalyticsService();