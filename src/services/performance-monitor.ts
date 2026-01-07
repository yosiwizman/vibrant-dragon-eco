"use client";

import { logger } from "@/utils/logger";

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  metadata?: Record<string, any>;
}

interface PerformanceThresholds {
  [key: string]: number;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  'transcribe': 2000,      // 2s
  'process_ai': 3000,      // 3s
  'speak': 2000,           // 2s
  'tool_execution': 1000,  // 1s
  'database_query': 500,   // 500ms
  'total_voice': 5000,     // 5s total
};

/**
 * Performance Monitoring Service
 * Tracks operation latency and alerts on slow performance
 */
class PerformanceMonitorService {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;
  private thresholds = DEFAULT_THRESHOLDS;
  private alertCallbacks: Set<(metric: PerformanceMetric) => void> = new Set();

  /**
   * Track an operation
   */
  track(
    operation: string,
    duration: number,
    success: boolean = true,
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      success,
      metadata,
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Check threshold
    const threshold = this.thresholds[operation];
    if (threshold && duration > threshold) {
      logger.warn('Performance', `${operation} is slow: ${duration}ms (threshold: ${threshold}ms)`);
      this.alertCallbacks.forEach(cb => cb(metric));
    }

    // Log in development
    logger.debug('Performance', `${operation}: ${duration}ms`);
  }

  /**
   * Start timing an operation
   */
  startTimer(operation: string): () => void {
    const start = Date.now();
    
    return (success: boolean = true, metadata?: Record<string, any>) => {
      const duration = Date.now() - start;
      this.track(operation, duration, success, metadata);
    };
  }

  /**
   * Get average duration for operation
   */
  getAverage(operation: string, last: number = 10): number {
    const relevant = this.metrics
      .filter(m => m.operation === operation && m.success)
      .slice(-last);

    if (relevant.length === 0) return 0;

    const sum = relevant.reduce((acc, m) => acc + m.duration, 0);
    return sum / relevant.length;
  }

  /**
   * Get percentile
   */
  getPercentile(operation: string, percentile: number = 95): number {
    const relevant = this.metrics
      .filter(m => m.operation === operation && m.success)
      .map(m => m.duration)
      .sort((a, b) => a - b);

    if (relevant.length === 0) return 0;

    const index = Math.ceil((percentile / 100) * relevant.length) - 1;
    return relevant[index];
  }

  /**
   * Get all metrics for operation
   */
  getMetrics(operation: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
    successRate: number;
  } {
    const relevant = this.metrics.filter(m => m.operation === operation);
    
    if (relevant.length === 0) {
      return {
        count: 0,
        avg: 0,
        min: 0,
        max: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        successRate: 0,
      };
    }

    const durations = relevant.map(m => m.duration).sort((a, b) => a - b);
    const successful = relevant.filter(m => m.success).length;

    return {
      count: relevant.length,
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: durations[0],
      max: durations[durations.length - 1],
      p50: durations[Math.floor(durations.length * 0.5)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
      successRate: (successful / relevant.length) * 100,
    };
  }

  /**
   * Get overall performance summary
   */
  getSummary(): {
    operations: Record<string, ReturnType<typeof this.getMetrics>>;
    totalOperations: number;
    avgLatency: number;
  } {
    const operations: Record<string, ReturnType<typeof this.getMetrics>> = {};
    const uniqueOps = new Set(this.metrics.map(m => m.operation));

    uniqueOps.forEach(op => {
      operations[op] = this.getMetrics(op);
    });

    const avgLatency = this.metrics.length > 0
      ? this.metrics.reduce((acc, m) => acc + m.duration, 0) / this.metrics.length
      : 0;

    return {
      operations,
      totalOperations: this.metrics.length,
      avgLatency,
    };
  }

  /**
   * Subscribe to performance alerts
   */
  onAlert(callback: (metric: PerformanceMetric) => void): () => void {
    this.alertCallbacks.add(callback);
    return () => this.alertCallbacks.delete(callback);
  }

  /**
   * Update thresholds
   */
  setThreshold(operation: string, threshold: number): void {
    this.thresholds[operation] = threshold;
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitorService();