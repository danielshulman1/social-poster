export const TIER_OPTIONS = {
  STARTER: "starter",
  CORE: "core",
  PREMIUM: "premium",
} as const;

export type TierId = (typeof TIER_OPTIONS)[keyof typeof TIER_OPTIONS];

export const TIER_ORDER: TierId[] = [
  TIER_OPTIONS.STARTER,
  TIER_OPTIONS.CORE,
  TIER_OPTIONS.PREMIUM,
];

export const RESTRICTED_SOCIAL_PROVIDERS = [
  "facebook",
  "instagram",
  "linkedin",
  "tiktok",
  "twitter",
  "threads",
  "youtube",
  "pinterest",
] as const;

export type RestrictedSocialProvider =
  (typeof RESTRICTED_SOCIAL_PROVIDERS)[number];

export const CONNECTABLE_PROVIDERS = [
  "facebook",
  "instagram",
  "linkedin",
  "tiktok",
  "twitter",
  "threads",
  "youtube",
  "pinterest",
  "wordpress",
  "wix",
  "squarespace",
  "google",
  "rss",
] as const;

export type ConnectableProvider = (typeof CONNECTABLE_PROVIDERS)[number];

export const PROVIDER_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  twitter: "Twitter/X",
  threads: "Threads",
  youtube: "YouTube",
  pinterest: "Pinterest",
  wordpress: "WordPress",
  wix: "Wix",
  squarespace: "Squarespace",
  google: "Google Sheets",
  rss: "RSS Feeds",
};

export const CONNECTABLE_PROVIDER_LABELS = CONNECTABLE_PROVIDERS.map(
  (provider) => PROVIDER_LABELS[provider]
);

export const CONNECTABLE_PROVIDER_SUMMARY = CONNECTABLE_PROVIDER_LABELS.join(", ");

export type TierConfig = {
  name: string;
  description: string;
  priceLabel: string;
  allowedPlatforms: RestrictedSocialProvider[];
  postsPerWeekPerPlatform: number;
  supportLabel: string;
  hasMonthlyCheckInCall: boolean;
  hasWeeklyCheckInCall: boolean;
  hasPrioritySupport: boolean;
  hasStrategyCall: boolean;
  features: string[];
};

export const TIER_CONFIG: Record<TierId, TierConfig> = {
  [TIER_OPTIONS.STARTER]: {
    name: "Starter",
    description: "Connect to Facebook, Instagram, LinkedIn, TikTok, Twitter/X, Threads, YouTube, Pinterest, WordPress, Wix, Squarespace, Google Sheets, RSS Feeds.",
    priceLabel: "£27.99/mo",
    allowedPlatforms: ["facebook", "instagram", "linkedin"],
    postsPerWeekPerPlatform: 3,
    supportLabel: "Self-serve support only",
    hasMonthlyCheckInCall: false,
    hasWeeklyCheckInCall: false,
    hasPrioritySupport: false,
    hasStrategyCall: false,
    features: [
      "3 posts per week per platform",
      "Self-serve support",
    ],
  },
  [TIER_OPTIONS.CORE]: {
    name: "Core",
    description: "Connect to Facebook, Instagram, LinkedIn, TikTok, Twitter/X, Threads, YouTube, Pinterest, WordPress, Wix, Squarespace, Google Sheets, RSS Feeds.",
    priceLabel: "£47/mo",
    allowedPlatforms: ["facebook", "instagram", "linkedin"],
    postsPerWeekPerPlatform: 5,
    supportLabel: "Standard support",
    hasMonthlyCheckInCall: false,
    hasWeeklyCheckInCall: false,
    hasPrioritySupport: false,
    hasStrategyCall: false,
    features: [
      "5 posts per week per platform",
      "Standard support",
    ],
  },
  [TIER_OPTIONS.PREMIUM]: {
    name: "Premium",
    description: "Connect to Facebook, Instagram, LinkedIn, TikTok, Twitter/X, Threads, YouTube, Pinterest, WordPress, Wix, Squarespace, Google Sheets, RSS Feeds.",
    priceLabel: "£97/mo",
    allowedPlatforms: ["facebook", "instagram", "linkedin", "tiktok", "twitter"],
    postsPerWeekPerPlatform: 7,
    supportLabel: "Priority support",
    hasMonthlyCheckInCall: false,
    hasWeeklyCheckInCall: false,
    hasPrioritySupport: true,
    hasStrategyCall: false,
    features: [
      "Daily posts per platform",
      "Priority support",
    ],
  },
};

export function normalizeTier(value: unknown): TierId | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return TIER_ORDER.includes(normalized as TierId)
    ? (normalized as TierId)
    : null;
}

export function getTierConfig(tier: unknown): TierConfig | null {
  const normalizedTier = normalizeTier(tier);
  return normalizedTier ? TIER_CONFIG[normalizedTier] : null;
}

export function getTierOrNull(value: unknown): TierId | null {
  return normalizeTier(value);
}

export function isRestrictedSocialProvider(
  provider: string
): provider is RestrictedSocialProvider {
  return RESTRICTED_SOCIAL_PROVIDERS.includes(
    provider as RestrictedSocialProvider
  );
}

export function isPlatformAllowedForTier(
  tier: TierId,
  provider: string
): boolean {
  if (!isRestrictedSocialProvider(provider)) {
    return true;
  }

  return TIER_CONFIG[tier].allowedPlatforms.includes(provider);
}

export function getProviderLabel(provider: string): string {
  return PROVIDER_LABELS[provider] || provider;
}
