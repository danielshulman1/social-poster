import { prisma } from "@/lib/prisma";
import { getUserSubscription } from "@/lib/subscription";
import {
  getProviderLabel,
  isPlatformAllowedForTier,
  isRestrictedSocialProvider,
  type RestrictedSocialProvider,
  type TierId,
} from "@/lib/tiers";

export class TierAccessError extends Error {
  status: number;
  code: string;

  constructor(message: string, code = "TIER_ACCESS_DENIED", status = 403) {
    super(message);
    this.name = "TierAccessError";
    this.code = code;
    this.status = status;
  }
}

function getStartOfWeekUtc(date = new Date()) {
  const start = new Date(date);
  const weekday = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - weekday);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function getEndOfWeekUtc(date = new Date()) {
  const end = getStartOfWeekUtc(date);
  end.setUTCDate(end.getUTCDate() + 7);
  return end;
}

async function requireActiveTier(userId: string) {
  const subscription = await getUserSubscription(userId);

  if (!subscription?.tier || !subscription.isValid) {
    throw new TierAccessError(
      "An active subscription is required to use this feature.",
      "SUBSCRIPTION_REQUIRED"
    );
  }

  return subscription;
}

export async function assertUserCanConnectProvider(
  userId: string,
  provider: string
) {
  const subscription = await requireActiveTier(userId);

  if (!isPlatformAllowedForTier(subscription.tier, provider)) {
    throw new TierAccessError(
      `${getProviderLabel(provider)} is not available on the ${subscription.config.name} tier.`,
      "PLATFORM_NOT_INCLUDED"
    );
  }

  return subscription;
}

export async function assertUserCanPublishPlatform(
  userId: string,
  platform: RestrictedSocialProvider
) {
  const subscription = await requireActiveTier(userId);

  if (!isPlatformAllowedForTier(subscription.tier, platform)) {
    throw new TierAccessError(
      `${getProviderLabel(platform)} is not available on the ${subscription.config.name} tier.`,
      "PLATFORM_NOT_INCLUDED"
    );
  }

  const workflowIds = await prisma.workflow.findMany({
    where: { userId },
    select: { id: true },
  });

  if (workflowIds.length === 0) {
    return subscription;
  }

  const weeklyPublishedCount = await prisma.publishResult.count({
    where: {
      platform,
      status: "success",
      publishedAt: {
        gte: getStartOfWeekUtc(),
        lt: getEndOfWeekUtc(),
      },
      workflowId: {
        in: workflowIds.map((workflow) => workflow.id),
      },
    },
  });

  if (weeklyPublishedCount >= subscription.config.postsPerWeekPerPlatform) {
    throw new TierAccessError(
      `${subscription.config.name} allows ${subscription.config.postsPerWeekPerPlatform} posts per week on ${getProviderLabel(platform)}.`,
      "POST_LIMIT_REACHED"
    );
  }

  return subscription;
}

type WorkflowLikeDefinition = {
  nodes?: Array<{ type?: string | null }>;
};

const NODE_TYPE_TO_PROVIDER: Record<string, RestrictedSocialProvider> = {
  "facebook-publisher": "facebook",
  "instagram-publisher": "instagram",
  "linkedin-publisher": "linkedin",
  "threads-publisher": "threads",
};

export function extractRestrictedPlatformsFromDefinition(
  definition: string | WorkflowLikeDefinition | null | undefined
) {
  if (!definition) return [] as RestrictedSocialProvider[];

  let parsed: WorkflowLikeDefinition;
  if (typeof definition === "string") {
    try {
      parsed = JSON.parse(definition) as WorkflowLikeDefinition;
    } catch {
      return [];
    }
  } else {
    parsed = definition;
  }

  const platforms = new Set<RestrictedSocialProvider>();

  for (const node of parsed.nodes || []) {
    const provider = node?.type ? NODE_TYPE_TO_PROVIDER[node.type] : null;
    if (provider) {
      platforms.add(provider);
    }
  }

  return Array.from(platforms);
}

export async function assertWorkflowDefinitionAllowed(
  userId: string,
  definition: string | WorkflowLikeDefinition | null | undefined
) {
  const subscription = await requireActiveTier(userId);
  const restrictedPlatforms = extractRestrictedPlatformsFromDefinition(definition);

  const blockedPlatforms = restrictedPlatforms.filter(
    (platform) => !isPlatformAllowedForTier(subscription.tier, platform)
  );

  if (blockedPlatforms.length > 0) {
    throw new TierAccessError(
      `${subscription.config.name} does not include ${blockedPlatforms
        .map((platform) => getProviderLabel(platform))
        .join(", ")} publishing.`,
      "WORKFLOW_PLATFORM_NOT_INCLUDED"
    );
  }

  return subscription;
}

export function isTierAccessError(error: unknown): error is TierAccessError {
  return error instanceof TierAccessError;
}
