"use client";

/**
 * Advanced Telemetry Service
 * Comprehensive system monitoring and diagnostics
 */

interface TelemetryEvent {
  id: string;
  category: 'performance' | 'error' | 'user' | 'system' | 'network' | 'voice';
  name: string;
  timestamp: number;
  duration?: number;
  metadata: Record<string, any>;
  tags: string[];
}

interface PerformanceMetric {
  name: string;
  values: number[];
  timestamps: number[];
  unit: string;
}

interface SystemSnapshot {
  timestamp: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  performance: {
    fcp: number;
    lcp: number;
    fid: number;
    cls: number;
  };
  network: {
    online: boolean;
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
  errors: number;
  warnings: number;
}

interface TelemetryReport {
  period: { start: number; end: number };
  summary: {
    totalEvents: number;
    errorRate: number;
    avgResponseTime: number;
    userSessions: number;
  };
  topEvents: { name: string; count: number }[];
  errorBreakdown: { type: string; count: number }[];
  performanceTrends: { metric: string; trend: 'improving' | 'stable' | 'degrading' }[];
}

class AdvancedTelemetryService {
  private events: TelemetryEvent[] = [];
  private metrics: Map<string, PerformanceMetric> = new Map();
  private snapshots: SystemSnapshot[] = [];
  private sessionId: string;
  private sessionStart: number;
  private readonly MAX_EVENTS = 10000;
  private readonly MAX_SNAPSHOTS = 100;
  private snapshotInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
    this.initializeMetrics();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize default metrics
   */
  private initializeMetrics(): void {
    const defaultMetrics = [
      'page_load_time',
      'api_response_time',
      'voice_processing_time',
      'render_time',
      'memory_usage',
      'error_count'
    ];

    defaultMetrics.forEach(name => {
      this.metrics.set(name, {
        name,
        values: [],
        timestamps: [],
        unit: name.includes('time') ? 'ms' : name.includes('memory') ? 'MB' : 'count'
      });
    });
  }

  /**
   * Start automatic snapshot collection
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.snapshotInterval) return;

    this.snapshotInterval = setInterval(() => {
      this.captureSnapshot();
    }, intervalMs);

    // Capture initial snapshot
    this.captureSnapshot();

    console.log('[advanced-telemetry] Monitoring started');
  }

  /**
   * Stop automatic snapshot collection
   */
  stopMonitoring(): void {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
      this.snapshotInterval = null;
    }

    console.log('[advanced-telemetry] Monitoring stopped');
  }

  /**
   * Capture system snapshot
   */
  private captureSnapshot(): void {
    const snapshot: SystemSnapshot = {
      timestamp: Date.now(),
      memory: this.getMemoryInfo(),
      performance: this.getPerformanceMetrics(),
      network: this.getNetworkInfo(),
      errors: this.getRecentErrorCount(),
      warnings: this.getRecentWarningCount()
    };

    this.snapshots.push(snapshot);

    // Trim old snapshots
    if (this.snapshots.length > this.MAX_SNAPSHOTS) {
      this.snapshots = this.snapshots.slice(-this.MAX_SNAPSHOTS);
    }
  }

  /**
   * Get memory information
   */
  private getMemoryInfo(): SystemSnapshot['memory'] {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
        percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
      };
    }
    return { used: 0, total: 0, percentage: 0 };
  }

  /**
   * Get Core Web Vitals
   */
  private getPerformanceMetrics(): SystemSnapshot['performance'] {
    const metrics = { fcp: 0, lcp: 0, fid: 0, cls: 0 };

    try {
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');
      if (fcpEntry) metrics.fcp = Math.round(fcpEntry.startTime);

      // LCP, FID, CLS would require PerformanceObserver in production
    } catch (error) {
      // Ignore errors
    }

    return metrics;
  }

  /**
   * Get network information
   */
  private getNetworkInfo(): SystemSnapshot['network'] {
    const connection = (navigator as any).connection;
    
    return {
      online: navigator.onLine,
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0
    };
  }

  /**
   * Get recent error count
   */
  private getRecentErrorCount(): number {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return this.events.filter(e => 
      e.category === 'error' && e.timestamp > fiveMinutesAgo
    ).length;
  }

  /**
   * Get recent warning count
   */
  private getRecentWarningCount(): number {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return this.events.filter(e => 
      e.tags.includes('warning') && e.timestamp > fiveMinutesAgo
    ).length;
  }

  /**
   * Track an event
   */
  track(
    category: TelemetryEvent['category'],
    name: string,
    metadata: Record<string, any> = {},
    tags: string[] = []
  ): string {
    const event: TelemetryEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category,
      name,
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        sessionId: this.sessionId
      },
      tags
    };

    this.events.push(event);

    // Trim old events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    return event.id;
  }

  /**
   * Track a timed operation
   */
  trackTimed(
    category: TelemetryEvent['category'],
    name: string,
    operation: () => Promise<any> | any,
    metadata: Record<string, any> = {}
  ): Promise<any> {
    const startTime = performance.now();

    const complete = (result: any, error?: Error) => {
      const duration = performance.now() - startTime;
      
      this.track(category, name, {
        ...metadata,
        duration,
        success: !error,
        error: error?.message
      }, error ? ['error'] : []);

      // Record metric
      this.recordMetric(`${name}_time`, duration);

      if (error) throw error;
      return result;
    };

    try {
      const result = operation();
      if (result instanceof Promise) {
        return result.then(r => complete(r)).catch(e => complete(null, e));
      }
      return Promise.resolve(complete(result));
    } catch (error) {
      return Promise.reject(complete(null, error as Error));
    }
  }

  /**
   * Record a metric value
   */
  recordMetric(name: string, value: number): void {
    let metric = this.metrics.get(name);
    
    if (!metric) {
      metric = {
        name,
        values: [],
        timestamps: [],
        unit: name.includes('time') ? 'ms' : 'count'
      };
      this.metrics.set(name, metric);
    }

    metric.values.push(value);
    metric.timestamps.push(Date.now());

    // Keep only last 1000 values
    if (metric.values.length > 1000) {
      metric.values = metric.values.slice(-1000);
      metric.timestamps = metric.timestamps.slice(-1000);
    }
  }

  /**
   * Get metric statistics
   */
  getMetricStats(name: string): {
    current: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
    trend: 'up' | 'down' | 'stable';
  } | null {
    const metric = this.metrics.get(name);
    if (!metric || metric.values.length === 0) return null;

    const values = [...metric.values].sort((a, b) => a - b);
    const n = values.length;

    const avg = values.reduce((a, b) => a + b, 0) / n;
    const p50 = values[Math.floor(n * 0.5)];
    const p95 = values[Math.floor(n * 0.95)];
    const p99 = values[Math.floor(n * 0.99)];

    // Calculate trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (n >= 10) {
      const recentAvg = values.slice(-5).reduce((a, b) => a + b, 0) / 5;
      const olderAvg = values.slice(-10, -5).reduce((a, b) => a + b, 0) / 5;
      
      if (recentAvg > olderAvg * 1.1) trend = 'up';
      else if (recentAvg < olderAvg * 0.9) trend = 'down';
    }

    return {
      current: values[n - 1],
      avg: Math.round(avg * 100) / 100,
      min: values[0],
      max: values[n - 1],
      p50,
      p95,
      p99,
      trend
    };
  }

  /**
   * Generate telemetry report
   */
  generateReport(periodHours: number = 24): TelemetryReport {
    const periodStart = Date.now() - periodHours * 60 * 60 * 1000;
    const periodEnd = Date.now();

    const periodEvents = this.events.filter(e => 
      e.timestamp >= periodStart && e.timestamp <= periodEnd
    );

    // Count events by name
    const eventCounts: Record<string, number> = {};
    periodEvents.forEach(e => {
      eventCounts[e.name] = (eventCounts[e.name] || 0) + 1;
    });

    // Count errors by type
    const errorCounts: Record<string, number> = {};
    periodEvents
      .filter(e => e.category === 'error')
      .forEach(e => {
        const type = e.metadata.errorType || 'unknown';
        errorCounts[type] = (errorCounts[type] || 0) + 1;
      });

    // Calculate error rate
    const totalEvents = periodEvents.length;
    const errorEvents = periodEvents.filter(e => e.category === 'error').length;
    const errorRate = totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0;

    // Calculate average response time
    const responseTimes = periodEvents
      .filter(e => e.duration !== undefined)
      .map(e => e.duration!);
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    // Get performance trends
    const performanceTrends: TelemetryReport['performanceTrends'] = [];
    ['page_load_time', 'api_response_time', 'voice_processing_time'].forEach(metric => {
      const stats = this.getMetricStats(metric);
      if (stats) {
        performanceTrends.push({
          metric,
          trend: stats.trend === 'up' ? 'degrading' : 
                 stats.trend === 'down' ? 'improving' : 'stable'
        });
      }
    });

    return {
      period: { start: periodStart, end: periodEnd },
      summary: {
        totalEvents,
        errorRate: Math.round(errorRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime),
        userSessions: 1 // Would be calculated from unique session IDs
      },
      topEvents: Object.entries(eventCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count })),
      errorBreakdown: Object.entries(errorCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => ({ type, count })),
      performanceTrends
    };
  }

  /**
   * Get recent snapshots
   */
  getSnapshots(limit: number = 10): SystemSnapshot[] {
    return this.snapshots.slice(-limit);
  }

  /**
   * Get events by category
   */
  getEventsByCategory(category: TelemetryEvent['category'], limit: number = 100): TelemetryEvent[] {
    return this.events
      .filter(e => e.category === category)
      .slice(-limit);
  }

  /**
   * Get session info
   */
  getSessionInfo(): {
    sessionId: string;
    duration: number;
    eventCount: number;
    errorCount: number;
  } {
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.sessionStart,
      eventCount: this.events.length,
      errorCount: this.events.filter(e => e.category === 'error').length
    };
  }

  /**
   * Export telemetry data
   */
  exportData(): {
    events: TelemetryEvent[];
    metrics: Record<string, PerformanceMetric>;
    snapshots: SystemSnapshot[];
    session: ReturnType<typeof this.getSessionInfo>;
  } {
    return {
      events: this.events,
      metrics: Object.fromEntries(this.metrics),
      snapshots: this.snapshots,
      session: this.getSessionInfo()
    };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.events = [];
    this.snapshots = [];
    this.metrics.forEach(m => {
      m.values = [];
      m.timestamps = [];
    });
    
    console.log('[advanced-telemetry] Cleared all data');
  }
}

export const advancedTelemetry = new AdvancedTelemetryService();