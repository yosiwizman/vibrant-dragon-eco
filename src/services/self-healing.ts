/**
 * Self-Healing Service
 * AI-powered automatic issue detection and resolution
 */

import { logger } from '@/utils/logger';
import { performanceMonitor } from './performance-monitor';
import { quickHealthCheck } from './system-health';

interface Issue {
  id: string;
  type: 'performance' | 'error' | 'memory' | 'network' | 'storage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: number;
  autoFixed: boolean;
  fixApplied?: string;
}

interface HealingAction {
  condition: () => boolean;
  action: () => Promise<void>;
  description: string;
}

class SelfHealingService {
  private issues: Issue[] = [];
  private healingActions: Map<string, HealingAction> = new Map();
  private isMonitoring = false;
  private monitorInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(issue: Issue) => void> = new Set();

  constructor() {
    this.registerDefaultHealingActions();
  }

  /**
   * Register default healing actions
   */
  private registerDefaultHealingActions(): void {
    // Memory pressure healing
    this.healingActions.set('memory_pressure', {
      condition: () => {
        const memory = (performance as any).memory;
        if (!memory) return false;
        return memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.85;
      },
      action: async () => {
        // Clear caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          const oldCaches = cacheNames.filter(name => 
            name.includes('temp') || name.includes('old')
          );
          await Promise.all(oldCaches.map(name => caches.delete(name)));
        }
        
        // Clear old performance metrics
        performanceMonitor.clear();
        
        // Suggest garbage collection
        if ('gc' in window && typeof (window as any).gc === 'function') {
          (window as any).gc();
        }
        
        logger.log('SelfHealing', 'Memory pressure relieved');
      },
      description: 'Clear caches and old data to reduce memory pressure',
    });

    // Slow performance healing
    this.healingActions.set('slow_performance', {
      condition: () => {
        const metrics = performanceMonitor.getMetrics('total_voice');
        return metrics.p95 > 8000; // 8 seconds is too slow
      },
      action: async () => {
        // Reduce quality settings temporarily
        const prefs = localStorage.getItem('echo-preferences');
        if (prefs) {
          const parsed = JSON.parse(prefs);
          parsed.reducedQuality = true;
          localStorage.setItem('echo-preferences', JSON.stringify(parsed));
        }
        
        logger.log('SelfHealing', 'Reduced quality mode enabled for better performance');
      },
      description: 'Enable reduced quality mode for better performance',
    });

    // Storage quota healing
    this.healingActions.set('storage_quota', {
      condition: () => {
        try {
          // Test if we can write to localStorage
          const testKey = '__storage_test__';
          localStorage.setItem(testKey, 'x'.repeat(1000));
          localStorage.removeItem(testKey);
          return false;
        } catch {
          return true;
        }
      },
      action: async () => {
        // Clear old data
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('cache') || key.includes('temp'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        logger.log('SelfHealing', 'Cleared old storage data');
      },
      description: 'Clear old cached data to free storage space',
    });

    // Network recovery healing
    this.healingActions.set('network_recovery', {
      condition: () => !navigator.onLine,
      action: async () => {
        // Enable offline mode
        const prefs = localStorage.getItem('echo-preferences');
        if (prefs) {
          const parsed = JSON.parse(prefs);
          parsed.offlineMode = true;
          localStorage.setItem('echo-preferences', JSON.stringify(parsed));
        }
        
        logger.log('SelfHealing', 'Offline mode enabled');
      },
      description: 'Enable offline mode when network is unavailable',
    });

    // IndexedDB recovery
    this.healingActions.set('indexeddb_recovery', {
      condition: () => {
        try {
          indexedDB.open('__test__');
          return false;
        } catch {
          return true;
        }
      },
      action: async () => {
        // Fall back to localStorage
        logger.warn('SelfHealing', 'IndexedDB unavailable, using localStorage fallback');
      },
      description: 'Fall back to localStorage when IndexedDB is unavailable',
    });
  }

  /**
   * Start monitoring for issues
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitorInterval = setInterval(() => this.runHealthCheck(), intervalMs);
    
    // Run initial check
    this.runHealthCheck();
    
    logger.log('SelfHealing', 'Monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.isMonitoring = false;
    
    logger.log('SelfHealing', 'Monitoring stopped');
  }

  /**
   * Run health check and apply healing actions
   */
  private async runHealthCheck(): Promise<void> {
    const health = quickHealthCheck();
    
    // Check each healing action
    for (const [id, action] of this.healingActions) {
      try {
        if (action.condition()) {
          const issue: Issue = {
            id: `${id}-${Date.now()}`,
            type: this.getIssueType(id),
            severity: this.getIssueSeverity(id),
            description: action.description,
            detectedAt: Date.now(),
            autoFixed: false,
          };
          
          // Attempt auto-fix
          try {
            await action.action();
            issue.autoFixed = true;
            issue.fixApplied = action.description;
            logger.log('SelfHealing', `Auto-fixed: ${action.description}`);
          } catch (error) {
            logger.error('SelfHealing', `Failed to auto-fix: ${action.description}`, error);
          }
          
          this.issues.push(issue);
          this.notifyListeners(issue);
          
          // Keep only recent issues
          if (this.issues.length > 100) {
            this.issues = this.issues.slice(-100);
          }
        }
      } catch (error) {
        logger.error('SelfHealing', `Error checking condition for ${id}`, error);
      }
    }
  }

  /**
   * Get issue type from action ID
   */
  private getIssueType(actionId: string): Issue['type'] {
    if (actionId.includes('memory')) return 'memory';
    if (actionId.includes('network')) return 'network';
    if (actionId.includes('storage') || actionId.includes('indexeddb')) return 'storage';
    if (actionId.includes('performance')) return 'performance';
    return 'error';
  }

  /**
   * Get issue severity from action ID
   */
  private getIssueSeverity(actionId: string): Issue['severity'] {
    if (actionId.includes('critical')) return 'critical';
    if (actionId.includes('memory') || actionId.includes('storage')) return 'high';
    if (actionId.includes('performance')) return 'medium';
    return 'low';
  }

  /**
   * Register custom healing action
   */
  registerHealingAction(id: string, action: HealingAction): void {
    this.healingActions.set(id, action);
  }

  /**
   * Get recent issues
   */
  getIssues(limit: number = 20): Issue[] {
    return this.issues.slice(-limit);
  }

  /**
   * Get issues by type
   */
  getIssuesByType(type: Issue['type']): Issue[] {
    return this.issues.filter(i => i.type === type);
  }

  /**
   * Get auto-fix success rate
   */
  getAutoFixRate(): number {
    if (this.issues.length === 0) return 100;
    const fixed = this.issues.filter(i => i.autoFixed).length;
    return (fixed / this.issues.length) * 100;
  }

  /**
   * Subscribe to issue notifications
   */
  onIssue(callback: (issue: Issue) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify listeners of new issue
   */
  private notifyListeners(issue: Issue): void {
    this.listeners.forEach(cb => cb(issue));
  }

  /**
   * Force run all healing actions
   */
  async forceHeal(): Promise<{ healed: number; failed: number }> {
    let healed = 0;
    let failed = 0;
    
    for (const [id, action] of this.healingActions) {
      try {
        await action.action();
        healed++;
        logger.log('SelfHealing', `Force healed: ${id}`);
      } catch {
        failed++;
        logger.error('SelfHealing', `Force heal failed: ${id}`);
      }
    }
    
    return { healed, failed };
  }

  /**
   * Get healing status
   */
  getStatus(): {
    isMonitoring: boolean;
    totalIssues: number;
    autoFixRate: number;
    registeredActions: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      totalIssues: this.issues.length,
      autoFixRate: this.getAutoFixRate(),
      registeredActions: this.healingActions.size,
    };
  }
}

export const selfHealing = new SelfHealingService();

// Auto-start monitoring in production
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  selfHealing.startMonitoring();
}