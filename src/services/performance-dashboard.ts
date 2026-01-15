"use client";

// Real-time Performance Dashboard Service
// Provides live metrics visualization and monitoring

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  trend: 'up' | 'down' | 'stable';
  threshold?: { warning: number; critical: number };
}

interface DashboardState {
  metrics: Map<string, PerformanceMetric[]>;
  alerts: Alert[];
  isRecording: boolean;
  sessionStart: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  metric: string;
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

class PerformanceDashboardService {
  private state: DashboardState = {
    metrics: new Map(),
    alerts: [],
    isRecording: false,
    sessionStart: 0
  };
  
  private observers: Set<(state: DashboardState) => void> = new Set();
  private metricsInterval: NodeJS.Timeout | null = null;
  private readonly MAX_HISTORY = 100;
  
  // Metric thresholds
  private thresholds = {
    'page_load': { warning: 2000, critical: 5000 },
    'api_response': { warning: 500, critical: 2000 },
    'memory_usage': { warning: 70, critical: 90 },
    'cpu_usage': { warning: 60, critical: 80 },
    'error_rate': { warning: 1, critical: 5 },
    'voice_latency': { warning: 300, critical: 1000 }
  };

  startRecording(): void {
    if (this.state.isRecording) return;
    
    this.state.isRecording = true;
    this.state.sessionStart = Date.now();
    
    // Collect metrics every second
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 1000);
    
    console.log('[performance-dashboard] Recording started');
    this.notifyObservers();
  }

  stopRecording(): void {
    if (!this.state.isRecording) return;
    
    this.state.isRecording = false;
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    
    console.log('[performance-dashboard] Recording stopped');
    this.notifyObservers();
  }

  private collectMetrics(): void {
    const now = Date.now();
    
    // Memory metrics
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.recordMetric('memory_usage', {
        name: 'Memory Usage',
        value: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100),
        unit: '%',
        timestamp: now,
        trend: 'stable',
        threshold: this.thresholds.memory_usage
      });
    }
    
    // Navigation timing
    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navTiming) {
      this.recordMetric('page_load', {
        name: 'Page Load Time',
        value: Math.round(navTiming.loadEventEnd - navTiming.startTime),
        unit: 'ms',
        timestamp: now,
        trend: 'stable',
        threshold: this.thresholds.page_load
      });
    }
    
    // Resource timing (API calls)
    const resources = performance.getEntriesByType('resource');
    const apiCalls = resources.filter(r => r.name.includes('/api/') || r.name.includes('supabase'));
    if (apiCalls.length > 0) {
      const avgDuration = apiCalls.reduce((sum, r) => sum + r.duration, 0) / apiCalls.length;
      this.recordMetric('api_response', {
        name: 'Avg API Response',
        value: Math.round(avgDuration),
        unit: 'ms',
        timestamp: now,
        trend: 'stable',
        threshold: this.thresholds.api_response
      });
    }
    
    // Frame rate (if available)
    this.measureFrameRate();
    
    // Check for threshold violations
    this.checkThresholds();
  }

  private measureFrameRate(): void {
    let lastTime = performance.now();
    let frames = 0;
    
    const measureFrame = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        this.recordMetric('frame_rate', {
          name: 'Frame Rate',
          value: frames,
          unit: 'fps',
          timestamp: Date.now(),
          trend: frames >= 55 ? 'stable' : frames >= 30 ? 'down' : 'down'
        });
        frames = 0;
        lastTime = currentTime;
      }
      
      if (this.state.isRecording) {
        requestAnimationFrame(measureFrame);
      }
    };
    
    requestAnimationFrame(measureFrame);
  }

  private recordMetric(key: string, metric: PerformanceMetric): void {
    const history = this.state.metrics.get(key) || [];
    
    // Calculate trend
    if (history.length > 0) {
      const lastValue = history[history.length - 1].value;
      if (metric.value > lastValue * 1.1) {
        metric.trend = 'up';
      } else if (metric.value < lastValue * 0.9) {
        metric.trend = 'down';
      } else {
        metric.trend = 'stable';
      }
    }
    
    history.push(metric);
    
    // Keep only recent history
    if (history.length > this.MAX_HISTORY) {
      history.shift();
    }
    
    this.state.metrics.set(key, history);
  }

  private checkThresholds(): void {
    this.state.metrics.forEach((history, key) => {
      if (history.length === 0) return;
      
      const latest = history[history.length - 1];
      if (!latest.threshold) return;
      
      const existingAlert = this.state.alerts.find(
        a => a.metric === key && !a.acknowledged && Date.now() - a.timestamp < 60000
      );
      
      if (existingAlert) return; // Don't spam alerts
      
      if (latest.value >= latest.threshold.critical) {
        this.addAlert({
          id: `${key}-${Date.now()}`,
          type: 'critical',
          metric: key,
          message: `${latest.name} is critically high: ${latest.value}${latest.unit}`,
          timestamp: Date.now(),
          acknowledged: false
        });
      } else if (latest.value >= latest.threshold.warning) {
        this.addAlert({
          id: `${key}-${Date.now()}`,
          type: 'warning',
          metric: key,
          message: `${latest.name} is elevated: ${latest.value}${latest.unit}`,
          timestamp: Date.now(),
          acknowledged: false
        });
      }
    });
  }

  private addAlert(alert: Alert): void {
    this.state.alerts.unshift(alert);
    
    // Keep only recent alerts
    if (this.state.alerts.length > 50) {
      this.state.alerts = this.state.alerts.slice(0, 50);
    }
    
    console.log(`[performance-dashboard] Alert: ${alert.type} - ${alert.message}`);
    this.notifyObservers();
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.state.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.notifyObservers();
    }
  }

  getMetricHistory(key: string): PerformanceMetric[] {
    return this.state.metrics.get(key) || [];
  }

  getLatestMetrics(): Record<string, PerformanceMetric | null> {
    const latest: Record<string, PerformanceMetric | null> = {};
    
    this.state.metrics.forEach((history, key) => {
      latest[key] = history.length > 0 ? history[history.length - 1] : null;
    });
    
    return latest;
  }

  getAlerts(includeAcknowledged = false): Alert[] {
    return includeAcknowledged 
      ? this.state.alerts 
      : this.state.alerts.filter(a => !a.acknowledged);
  }

  getSessionDuration(): number {
    if (!this.state.isRecording) return 0;
    return Date.now() - this.state.sessionStart;
  }

  generateReport(): {
    summary: string;
    metrics: Record<string, { avg: number; min: number; max: number }>;
    alerts: Alert[];
    recommendations: string[];
  } {
    const metricsReport: Record<string, { avg: number; min: number; max: number }> = {};
    const recommendations: string[] = [];
    
    this.state.metrics.forEach((history, key) => {
      if (history.length === 0) return;
      
      const values = history.map(m => m.value);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      metricsReport[key] = { avg: Math.round(avg), min, max };
      
      // Generate recommendations
      const threshold = this.thresholds[key as keyof typeof this.thresholds];
      if (threshold && avg > threshold.warning) {
        recommendations.push(`Consider optimizing ${key}: average ${avg} exceeds warning threshold ${threshold.warning}`);
      }
    });
    
    const criticalAlerts = this.state.alerts.filter(a => a.type === 'critical').length;
    const warningAlerts = this.state.alerts.filter(a => a.type === 'warning').length;
    
    return {
      summary: `Session: ${Math.round(this.getSessionDuration() / 1000)}s | Metrics: ${this.state.metrics.size} | Alerts: ${criticalAlerts} critical, ${warningAlerts} warnings`,
      metrics: metricsReport,
      alerts: this.state.alerts,
      recommendations
    };
  }

  subscribe(callback: (state: DashboardState) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  private notifyObservers(): void {
    this.observers.forEach(cb => cb(this.state));
  }

  // Custom metric recording for external use
  recordCustomMetric(key: string, name: string, value: number, unit: string): void {
    this.recordMetric(key, {
      name,
      value,
      unit,
      timestamp: Date.now(),
      trend: 'stable'
    });
  }
}

export const performanceDashboard = new PerformanceDashboardService();