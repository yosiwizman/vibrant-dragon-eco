"use client";

import { logger } from "@/utils/logger";

export type UserTier = 'free' | 'premium' | 'enterprise';

interface TierLimits {
  voiceCommands: number; // per hour
  apiCalls: number; // per hour
  maxCost: number; // per hour in USD
  widgets: number;
  offlineAI: boolean;
  alwaysOn: boolean;
  factChecking: boolean;
  multiLanguage: boolean;
}

const TIER_LIMITS: Record<UserTier, TierLimits> = {
  free: {
    voiceCommands: 30,
    apiCalls: 60,
    maxCost: 1.0,
    widgets: 14,
    offlineAI: true,
    alwaysOn: false,
    factChecking: false,
    multiLanguage: false,
  },
  premium: {
    voiceCommands: 300,
    apiCalls: 600,
    maxCost: 10.0,
    widgets: 14,
    offlineAI: true,
    alwaysOn: true,
    factChecking: true,
    multiLanguage: true,
  },
  enterprise: {
    voiceCommands: Infinity,
    apiCalls: Infinity,
    maxCost: Infinity,
    widgets: 14,
    offlineAI: true,
    alwaysOn: true,
    factChecking: true,
    multiLanguage: true,
  },
};

/**
 * Tier Management Service
 */
class TierManagementService {
  /**
   * Get user tier
   */
  getUserTier(userId: string): UserTier {
    // Check localStorage for tier
    const stored = localStorage.getItem(`echo:tier:${userId}`);
    return (stored as UserTier) || 'free';
  }

  /**
   * Set user tier
   */
  setUserTier(userId: string, tier: UserTier): void {
    localStorage.setItem(`echo:tier:${userId}`, tier);
    logger.log('TierManagement', `User ${userId} tier set to ${tier}`);
  }

  /**
   * Get tier limits
   */
  getTierLimits(tier: UserTier): TierLimits {
    return TIER_LIMITS[tier];
  }

  /**
   * Check if feature is available for tier
   */
  hasFeature(userId: string, feature: keyof TierLimits): boolean {
    const tier = this.getUserTier(userId);
    const limits = this.getTierLimits(tier);
    return !!limits[feature];
  }

  /**
   * Check if usage is within limits
   */
  checkLimit(
    userId: string,
    limitType: 'voiceCommands' | 'apiCalls',
    currentUsage: number
  ): { allowed: boolean; limit: number; remaining: number } {
    const tier = this.getUserTier(userId);
    const limits = this.getTierLimits(tier);
    const limit = limits[limitType];

    if (limit === Infinity) {
      return { allowed: true, limit: Infinity, remaining: Infinity };
    }

    const allowed = currentUsage < limit;
    const remaining = Math.max(0, limit - currentUsage);

    return { allowed, limit, remaining };
  }

  /**
   * Get upgrade message
   */
  getUpgradeMessage(feature: string): string {
    return `${feature} is a premium feature. Upgrade to unlock it!`;
  }
}

export const tierManagement = new TierManagementService();