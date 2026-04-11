/**
 * Tier Access Control Utilities
 * Reusable functions for checking tier access and restrictions
 */

import { getUserTier, isSubscriptionActive } from './tier-db';
import {
  getTierLimit,
  canAccessFeature,
  TIERS,
} from './tier-config';

/**
 * Check if user has access to a feature
 * Returns { allowed: boolean, reason?: string }
 */
export async function checkFeatureAccess(userId, featureName) {
  try {
    // Check subscription status
    const isActive = await isSubscriptionActive(userId);
    if (!isActive) {
      return {
        allowed: false,
        reason: 'Subscription is inactive or expired',
        code: 'SUBSCRIPTION_INACTIVE',
      };
    }

    const tierInfo = await getUserTier(userId);
    const { current_tier } = tierInfo;

    // Check if tier has this feature
    if (!canAccessFeature(current_tier, featureName)) {
      return {
        allowed: false,
        reason: `This feature requires a higher tier`,
        code: 'FEATURE_NOT_AVAILABLE',
        requiredTier: getMinimumTierFor(featureName),
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('[checkFeatureAccess] Error:', error.message);
    return {
      allowed: false,
      reason: 'Error checking access',
      code: 'ACCESS_CHECK_ERROR',
    };
  }
}

/**
 * Check if user can add more platforms
 * Returns { allowed: boolean, current: number, limit: number, reason?: string }
 */
export async function checkPlatformLimit(userId, currentPlatformCount = 0) {
  try {
    const tierInfo = await getUserTier(userId);
    const { current_tier } = tierInfo;
    const limit = getTierLimit(current_tier, 'maxPlatforms');

    return {
      allowed: currentPlatformCount < limit,
      current: currentPlatformCount,
      limit,
      reason:
        currentPlatformCount >= limit
          ? `${current_tier} tier allows up to ${limit} platform(s)`
          : undefined,
    };
  } catch (error) {
    console.error('[checkPlatformLimit] Error:', error.message);
    return {
      allowed: false,
      current: currentPlatformCount,
      limit: 0,
      reason: 'Error checking platform limit',
    };
  }
}

/**
 * Check if user can post more content this week
 * Returns { allowed: boolean, current: number, limit: number, reason?: string }
 */
export async function checkPostLimit(userId, currentWeeklyCount = 0) {
  try {
    const tierInfo = await getUserTier(userId);
    const { current_tier } = tierInfo;
    const limit = getTierLimit(current_tier, 'postsPerWeek');

    return {
      allowed: currentWeeklyCount < limit,
      current: currentWeeklyCount,
      limit,
      reason:
        currentWeeklyCount >= limit
          ? `${current_tier} tier allows ${limit} posts per week`
          : undefined,
    };
  } catch (error) {
    console.error('[checkPostLimit] Error:', error.message);
    return {
      allowed: false,
      current: currentWeeklyCount,
      limit: 0,
      reason: 'Error checking post limit',
    };
  }
}

/**
 * Get user's current tier information with feature access
 */
export async function getUserTierInfo(userId) {
  try {
    const tierInfo = await getUserTier(userId);
    const isActive = await isSubscriptionActive(userId);

    return {
      ...tierInfo,
      isActive,
      features: getTierFeaturesForDisplay(tierInfo.current_tier),
    };
  } catch (error) {
    console.error('[getUserTierInfo] Error:', error.message);
    throw error;
  }
}

/**
 * Check if user should be redirected to upgrade page
 * Used by middleware to protect premium-only routes
 */
export async function needsUpgrade(userId, requiredTier) {
  try {
    const tierInfo = await getUserTier(userId);
    const isActive = await isSubscriptionActive(userId);

    const tierOrder = {
      [TIERS.FREE]: 0,
      [TIERS.STARTER]: 1,
      [TIERS.CORE]: 2,
      [TIERS.PREMIUM]: 3,
    };

    const userTierLevel = tierOrder[tierInfo.current_tier] || 0;
    const requiredLevel = tierOrder[requiredTier] || 0;

    return !isActive || userTierLevel < requiredLevel;
  } catch (error) {
    console.error('[needsUpgrade] Error:', error.message);
    return true; // Default to redirect if error
  }
}

/**
 * Get features for a tier (formatted for display)
 */
export function getTierFeaturesForDisplay(tier) {
  const featureMap = {
    [TIERS.FREE]: {
      platforms: 1,
      postsPerWeek: 1,
      voiceTraining: false,
      onboarding: false,
      support: 'None',
      calls: 'None',
    },
    [TIERS.STARTER]: {
      platforms: '3 (Facebook, Instagram, LinkedIn)',
      postsPerWeek: 3,
      voiceTraining: true,
      onboarding: true,
      support: 'Self-serve',
      calls: 'None',
    },
    [TIERS.CORE]: {
      platforms: '3 (Facebook, Instagram, LinkedIn)',
      postsPerWeek: 5,
      voiceTraining: true,
      onboarding: true,
      support: 'Self-serve',
      calls: 'Monthly check-in',
    },
    [TIERS.PREMIUM]: {
      platforms: '5 (Facebook, Instagram, LinkedIn, TikTok, Twitter)',
      postsPerWeek: 'Daily (7)',
      voiceTraining: true,
      onboarding: true,
      support: 'Priority',
      calls: 'Weekly check-ins + Monthly strategy',
    },
  };

  return featureMap[tier] || featureMap[TIERS.FREE];
}

/**
 * Get minimum tier required for a feature
 */
function getMinimumTierFor(featureName) {
  const featureTierMap = {
    voiceTraining: TIERS.STARTER,
    onboardingSession: TIERS.STARTER,
    checkInCalls: TIERS.CORE,
    prioritySupport: TIERS.PREMIUM,
    strategyCalls: TIERS.PREMIUM,
  };

  return featureTierMap[featureName] || TIERS.PREMIUM;
}
