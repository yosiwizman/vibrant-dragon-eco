"use client";

// ML-based Error Prediction Service
// Predicts and prevents errors before they occur

interface ErrorPattern {
  id: string;
  signature: string;
  frequency: number;
  lastOccurrence: number;
  context: ErrorContext[];
  preventionStrategy?: string;
}

interface ErrorContext {
  timestamp: number;
  url: string;
  userAction: string;
  systemState: Record<string, any>;
}

interface PredictionResult {
  errorType: string;
  probability: number;
  preventionAction: string;
  confidence: number;
}

interface SystemState {
  memoryUsage: number;
  apiLatency: number;
  errorRate: number;
  activeConnections: number;
  lastUserAction: string;
  sessionDuration: number;
}

class MLErrorPredictorService {
  private errorPatterns: Map<string, ErrorPattern> = new Map();
  private recentErrors: { timestamp: number; type: string; context: ErrorContext }[] = [];
  private systemStateHistory: SystemState[] = [];
  private predictionCallbacks: Set<(prediction: PredictionResult) => void> = new Set();
  private monitoringInterval: NodeJS.Timeout | null = null;

  initialize(): void {
    this.loadPatterns();
    this.startMonitoring();
    this.attachErrorListener();
    console.log('[ml-error-predictor] Initialized with', this.errorPatterns.size, 'known patterns');
  }

  private loadPatterns(): void {
    try {
      const stored = localStorage.getItem('error_patterns');
      if (stored) {
        const patterns = JSON.parse(stored);
        patterns.forEach((p: ErrorPattern) => this.errorPatterns.set(p.id, p));
      }
    } catch (error) {
      console.error('[ml-error-predictor] Failed to load patterns:', error);
    }
    
    // Add known patterns
    this.addKnownPatterns();
  }

  private addKnownPatterns(): void {
    // Memory exhaustion pattern
    this.errorPatterns.set('memory_exhaustion', {
      id: 'memory_exhaustion',
      signature: 'out of memory|heap|allocation failed',
      frequency: 0,
      lastOccurrence: 0,
      context: [],
      preventionStrategy: 'Clear caches and reduce memory usage'
    });
    
    // Network timeout pattern
    this.errorPatterns.set('network_timeout', {
      id: 'network_timeout',
      signature: 'timeout|network error|failed to fetch',
      frequency: 0,
      lastOccurrence: 0,
      context: [],
      preventionStrategy: 'Retry with exponential backoff'
    });
    
    // Rate limiting pattern
    this.errorPatterns.set('rate_limit', {
      id: 'rate_limit',
      signature: '429|rate limit|too many requests',
      frequency: 0,
      lastOccurrence: 0,
      context: [],
      preventionStrategy: 'Implement request queuing'
    });
    
    // Authentication failure pattern
    this.errorPatterns.set('auth_failure', {
      id: 'auth_failure',
      signature: '401|unauthorized|token expired',
      frequency: 0,
      lastOccurrence: 0,
      context: [],
      preventionStrategy: 'Refresh authentication token'
    });
    
    // Voice recognition failure pattern
    this.errorPatterns.set('voice_failure', {
      id: 'voice_failure',
      signature: 'speech recognition|microphone|audio',
      frequency: 0,
      lastOccurrence: 0,
      context: [],
      preventionStrategy: 'Check microphone permissions and audio settings'
    });
  }

  private savePatterns(): void {
    try {
      const patterns = Array.from(this.errorPatterns.values());
      localStorage.setItem('error_patterns', JSON.stringify(patterns));
    } catch (error) {
      console.error('[ml-error-predictor] Failed to save patterns:', error);
    }
  }

  private startMonitoring(): void {
    // Monitor system state every 5 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectSystemState();
      this.analyzeAndPredict();
    }, 5000);
  }

  private collectSystemState(): void {
    const state: SystemState = {
      memoryUsage: this.getMemoryUsage(),
      apiLatency: this.getAverageApiLatency(),
      errorRate: this.getRecentErrorRate(),
      activeConnections: this.getActiveConnections(),
      lastUserAction: this.getLastUserAction(),
      sessionDuration: this.getSessionDuration()
    };
    
    this.systemStateHistory.push(state);
    
    // Keep only last 100 states
    if (this.systemStateHistory.length > 100) {
      this.systemStateHistory.shift();
    }
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    }
    return 0;
  }

  private getAverageApiLatency(): number {
    const resources = performance.getEntriesByType('resource');
    const apiCalls = resources.filter(r => 
      r.name.includes('/api/') || r.name.includes('supabase')
    ).slice(-10);
    
    if (apiCalls.length === 0) return 0;
    return apiCalls.reduce((sum, r) => sum + r.duration, 0) / apiCalls.length;
  }

  private getRecentErrorRate(): number {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentErrors = this.recentErrors.filter(e => e.timestamp > fiveMinutesAgo);
    return recentErrors.length;
  }

  private getActiveConnections(): number {
    // Estimate based on performance entries
    const resources = performance.getEntriesByType('resource');
    const recent = resources.filter(r => 
      r.startTime > performance.now() - 10000
    );
    return recent.length;
  }

  private getLastUserAction(): string {
    // This would be populated by session recording
    return 'unknown';
  }

  private getSessionDuration(): number {
    return performance.now();
  }

  private attachErrorListener(): void {
    window.addEventListener('error', (e) => {
      this.recordError(e.message, {
        timestamp: Date.now(),
        url: window.location.href,
        userAction: this.getLastUserAction(),
        systemState: this.systemStateHistory[this.systemStateHistory.length - 1] || {}
      });
    });
    
    window.addEventListener('unhandledrejection', (e) => {
      this.recordError(String(e.reason), {
        timestamp: Date.now(),
        url: window.location.href,
        userAction: this.getLastUserAction(),
        systemState: this.systemStateHistory[this.systemStateHistory.length - 1] || {}
      });
    });
  }

  recordError(message: string, context: ErrorContext): void {
    // Find matching pattern
    let matchedPattern: ErrorPattern | null = null;
    
    this.errorPatterns.forEach(pattern => {
      const regex = new RegExp(pattern.signature, 'i');
      if (regex.test(message)) {
        matchedPattern = pattern;
      }
    });
    
    if (matchedPattern) {
      matchedPattern.frequency++;
      matchedPattern.lastOccurrence = Date.now();
      matchedPattern.context.push(context);
      
      // Keep only last 10 contexts
      if (matchedPattern.context.length > 10) {
        matchedPattern.context.shift();
      }
      
      this.savePatterns();
    } else {
      // Create new pattern
      const newPattern: ErrorPattern = {
        id: `pattern_${Date.now()}`,
        signature: this.extractSignature(message),
        frequency: 1,
        lastOccurrence: Date.now(),
        context: [context]
      };
      this.errorPatterns.set(newPattern.id, newPattern);
    }
    
    this.recentErrors.push({
      timestamp: Date.now(),
      type: matchedPattern?.id || 'unknown',
      context
    });
    
    // Keep only last 100 errors
    if (this.recentErrors.length > 100) {
      this.recentErrors.shift();
    }
  }

  private extractSignature(message: string): string {
    // Extract key words from error message
    return message
      .toLowerCase()
      .replace(/[0-9]+/g, '')
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5)
      .join('|');
  }

  private analyzeAndPredict(): void {
    const currentState = this.systemStateHistory[this.systemStateHistory.length - 1];
    if (!currentState) return;
    
    const predictions: PredictionResult[] = [];
    
    // Memory exhaustion prediction
    if (currentState.memoryUsage > 70) {
      const trend = this.calculateTrend('memoryUsage');
      if (trend > 0) {
        predictions.push({
          errorType: 'memory_exhaustion',
          probability: Math.min(currentState.memoryUsage + trend * 10, 100),
          preventionAction: 'Clear caches and unused data',
          confidence: 85
        });
      }
    }
    
    // Network issues prediction
    if (currentState.apiLatency > 1000) {
      predictions.push({
        errorType: 'network_timeout',
        probability: Math.min(currentState.apiLatency / 20, 100),
        preventionAction: 'Switch to offline mode or retry',
        confidence: 75
      });
    }
    
    // Rate limiting prediction
    if (currentState.activeConnections > 10) {
      predictions.push({
        errorType: 'rate_limit',
        probability: Math.min(currentState.activeConnections * 5, 100),
        preventionAction: 'Queue requests and reduce frequency',
        confidence: 70
      });
    }
    
    // Error cascade prediction
    if (currentState.errorRate > 3) {
      predictions.push({
        errorType: 'error_cascade',
        probability: Math.min(currentState.errorRate * 15, 100),
        preventionAction: 'Enable circuit breaker and fallback mode',
        confidence: 80
      });
    }
    
    // Notify subscribers of high-probability predictions
    predictions
      .filter(p => p.probability > 50)
      .forEach(prediction => {
        console.log('[ml-error-predictor] High probability prediction:', prediction);
        this.predictionCallbacks.forEach(cb => cb(prediction));
      });
  }

  private calculateTrend(metric: keyof SystemState): number {
    if (this.systemStateHistory.length < 5) return 0;
    
    const recent = this.systemStateHistory.slice(-5);
    const values = recent.map(s => s[metric] as number);
    
    // Simple linear regression
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  onPrediction(callback: (prediction: PredictionResult) => void): () => void {
    this.predictionCallbacks.add(callback);
    return () => this.predictionCallbacks.delete(callback);
  }

  getPatterns(): ErrorPattern[] {
    return Array.from(this.errorPatterns.values());
  }

  getRecentPredictions(): PredictionResult[] {
    const currentState = this.systemStateHistory[this.systemStateHistory.length - 1];
    if (!currentState) return [];
    
    const predictions: PredictionResult[] = [];
    
    // Generate current predictions
    if (currentState.memoryUsage > 50) {
      predictions.push({
        errorType: 'memory_exhaustion',
        probability: currentState.memoryUsage,
        preventionAction: 'Clear caches',
        confidence: 80
      });
    }
    
    if (currentState.apiLatency > 500) {
      predictions.push({
        errorType: 'network_timeout',
        probability: Math.min(currentState.apiLatency / 20, 100),
        preventionAction: 'Enable offline mode',
        confidence: 75
      });
    }
    
    return predictions;
  }

  getSystemHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    issues: string[];
  } {
    const currentState = this.systemStateHistory[this.systemStateHistory.length - 1];
    if (!currentState) {
      return { status: 'healthy', score: 100, issues: [] };
    }
    
    const issues: string[] = [];
    let score = 100;
    
    if (currentState.memoryUsage > 80) {
      issues.push('High memory usage');
      score -= 20;
    } else if (currentState.memoryUsage > 60) {
      issues.push('Elevated memory usage');
      score -= 10;
    }
    
    if (currentState.apiLatency > 2000) {
      issues.push('Slow API responses');
      score -= 20;
    } else if (currentState.apiLatency > 1000) {
      issues.push('Elevated API latency');
      score -= 10;
    }
    
    if (currentState.errorRate > 5) {
      issues.push('High error rate');
      score -= 30;
    } else if (currentState.errorRate > 2) {
      issues.push('Elevated error rate');
      score -= 15;
    }
    
    const status = score >= 80 ? 'healthy' : score >= 50 ? 'warning' : 'critical';
    
    return { status, score: Math.max(0, score), issues };
  }

  cleanup(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.predictionCallbacks.clear();
  }
}

export const mlErrorPredictor = new MLErrorPredictorService();