"use client";

import { logger } from "@/utils/logger";

interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  rolloutPercentage?: number;
}

const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    key: 'always-on-assistant',
    enabled: true,
    description: 'Always-on wake word detection',
  },
  {
    key: 'fact-checking',
    enabled: true,
    description: 'Real-time fact checking',
  },
  {
    key: 'voice-macros',
    enabled: true,
    description: 'Voice shortcuts and macros',
  },
  {
    key: 'multi-language',
    enabled: true,
    description: 'Multi-language translation',
  },
  {
    key: 'habit-learning',
    enabled: true,
    description: 'Habit tracking and learning',
  },
  {
    key: 'traffic-alerts',
    enabled: true,
    description: 'Traffic-aware departure alerts',
  },
  {
    key: 'streaming-tts',
    enabled: true,
    description: 'Streaming text-to-speech',
  },
  {
    key: 'smart-notifications',
    enabled: true,
    description: 'Context-aware notifications',
  },
];

/**
 * Feature Flags Service
 * Enable/disable features remotely
 */
class FeatureFlagsService {
  private flags = new Map<string, FeatureFlag>();

  constructor() {
    this.loadFlags();
  }

  /**
   * Load flags from storage
   */
  private loadFlags(): void {
    try {
      const stored = localStorage.getItem('echo:feature-flags');
      if (stored) {
        const flags: FeatureFlag[] = JSON.parse(stored);
        flags.forEach(f => this.flags.set(f.key, f));
      } else {
        // Load defaults
        DEFAULT_FLAGS.forEach(f => this.flags.set(f.key, f));
        this.saveFlags();
      }

      logger.log('FeatureFlags', `Loaded ${this.flags.size} flags`);
    } catch (error) {
      logger.error('FeatureFlags', 'Failed to load flags:', error);
      DEFAULT_FLAGS.forEach(f => this.flags.set(f.key, f));
    }
  }

  /**
   * Save flags to storage
   */
  private saveFlags(): void {
    try {
      const flags = Array.from(this.flags.values());
      localStorage.setItem('echo:feature-flags', JSON.stringify(flags));
    } catch (error) {
      logger.error('FeatureFlags', 'Failed to save flags:', error);
    }
  }

  /**
   * Check if feature is enabled
   */
  isEnabled(key: string, userId?: string): boolean {
    const flag = this.flags.get(key);
    
    if (!flag) {
      logger.warn('FeatureFlags', `Flag not found: ${key}`);
      return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && userId) {
      const hash = this.hashUserId(userId);
      const userPercentage = hash % 100;
      return flag.enabled && userPercentage < flag.rolloutPercentage;
    }

    return flag.enabled;
  }

  /**
   * Enable feature
   */
  enable(key: string): void {
    const flag = this.flags.get(key);
    if (flag) {
      flag.enabled = true;
      this.saveFlags();
      logger.log('FeatureFlags', `Enabled: ${key}`);
    }
  }

  /**
   * Disable feature
   */
  disable(key: string): void {
    const flag = this.flags.get(key);
    if (flag) {
      flag.enabled = false;
      this.saveFlags();
      logger.log('FeatureFlags', `Disabled: ${key}`);
    }
  }

  /**
   * Set rollout percentage
   */
  setRollout(key: string, percentage: number): void {
    const flag = this.flags.get(key);
    if (flag) {
      flag.rolloutPercentage = Math.max(0, Math.min(100, percentage));
      this.saveFlags();
      logger.log('FeatureFlags', `Set rollout for ${key}: ${percentage}%`);
    }
  }

  /**
   * Get all flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Hash user ID for consistent rollout
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

export const featureFlags = new FeatureFlagsService();