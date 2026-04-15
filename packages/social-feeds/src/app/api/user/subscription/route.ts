import { NextResponse } from "next/server";
import { getApiAuthContext, unauthorizedText } from "@/lib/apiAuth";
import { getUserSubscription } from "@/lib/subscription";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const auth = await getApiAuthContext(req);
    if (!auth?.userId) return unauthorizedText();

    const subscription = await getUserSubscription(auth.userId);

    return NextResponse.json({
        isActive: !!subscription?.isValid,
        tier: subscription?.tier ?? null,
        status: subscription?.status ?? "inactive",
        allowedPlatforms: subscription?.allowedPlatforms ?? [],
        postsPerWeekPerPlatform: subscription?.postsPerWeekPerPlatform ?? 0,
        maxPlatforms: subscription?.maxPlatforms ?? 0,
        canAccessCheckInCall: subscription?.canAccessCheckInCall ?? false,
        canAccessPrioritySupport: subscription?.canAccessPrioritySupport ?? false,
        canAccessStrategyCall: subscription?.canAccessStrategyCall ?? false,
        supportLabel: subscription?.supportLabel ?? "No active support tier",
    });
}
