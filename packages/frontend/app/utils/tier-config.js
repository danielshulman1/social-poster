/**
 * Tier Configuration
 * Central definition of all tier information and restrictions
 * Easy to maintain and extend for future payment integration
 */

export const TIERS = {
  FREE: 'free',
  STARTER: 'starter',
  CORE: 'core',
  PREMIUM: 'premium',
};

export const CONNECTABLE_SERVICE_LABELS = [
  'Facebook',
  'Instagram',
  'LinkedIn',
  'TikTok',
  'Twitter/X',
  'Threads',
  'YouTube',
  'Pinterest',
  'WordPress',
  'Wix',
  'Squarespace',
  'Google Sheets',
  'RSS Feeds',
];

export const CONNECTABLE_SERVICE_COUNT = CONNECTABLE_SERVICE_LABELS.length;
export const CONNECTABLE_SERVICE_SUMMARY = CONNECTABLE_SERVICE_LABELS.join(', ');

export const TIER_CONFIG = {
  [TIERS.FREE]: {
    name: 'Free',
    description: 'Basic tier for getting started',
    monthlyPrice: 0,
    features: {
      maxPlatforms: 1,
      postsPerWeek: 1,
      voiceTraining: false,
      onboardingSession: false,
      checkInCalls: false,
      prioritySupport: false,
      strategyCalls: false,
    },
  },
  [TIERS.STARTER]: {
    name: 'Starter',
    description: 'Perfect for getting started',
    monthlyPrice: 4700, // £47 in pence
    features: {
      maxPlatforms: 3,
      platforms: ['facebook', 'instagram', 'linkedin'],
      postsPerWeek: 3,
      voiceTraining: true,
      onboardingSession: true,
      checkInCalls: false,
      prioritySupport: false,
      strategyCalls: false,
    },
  },
  [TIERS.CORE]: {
    name: 'Core',
    description: 'For growing businesses',
    monthlyPrice: 9700, // £97 in pence
    features: {
      maxPlatforms: 3,
      platforms: ['facebook', 'instagram', 'linkedin'],
      postsPerWeek: 5,
      voiceTraining: true,
      onboardingSession: true,
      checkInCalls: true,
      checkInCallsPerMonth: 1,
      prioritySupport: false,
      strategyCalls: false,
    },
  },
  [TIERS.PREMIUM]: {
    name: 'Premium',
    description: 'For serious entrepreneurs',
    monthlyPrice: 19700, // £197 in pence
    features: {
      maxPlatforms: 5,
      platforms: ['facebook', 'instagram', 'linkedin', 'tiktok', 'twitter'],
      postsPerWeek: 7, // Daily = 7 per week
      voiceTraining: true,
      onboardingSession: true,
      checkInCalls: true,
      checkInCallsPerMonth: 4, // Weekly
      prioritySupport: true,
      strategyCalls: true,
      strategyCallsPerMonth: 1,
    },
  },
};

/**
 * Get tier configuration by tier name
 */
export function getTierConfig(tier) {
  return TIER_CONFIG[tier] || TIER_CONFIG[TIERS.FREE];
}

/**
 * Check if user's tier has a feature
 */
export function hasTierFeature(tier, featureName) {
  const config = getTierConfig(tier);
  return config.features[featureName] === true;
}

/**
 * Get numeric tier limit (e.g., maxPlatforms, postsPerWeek)
 */
export function getTierLimit(tier, limitName) {
  const config = getTierConfig(tier);
  return config.features[limitName] ?? 0;
}

/**
 * Check if user can access a feature
 */
export function canAccessFeature(tier, featureName) {
  if (!tier || tier === TIERS.FREE) {
    return false;
  }
  return hasTierFeature(tier, featureName);
}

/**
 * Get all available tiers (for display, excluding free)
 */
export function getUpgradeTiers() {
  return [TIERS.STARTER, TIERS.CORE, TIERS.PREMIUM];
}

/**
 * Format price for display (pence to GBP)
 */
export function formatPrice(penceAmount) {
  return (penceAmount / 100).toFixed(2);
}
