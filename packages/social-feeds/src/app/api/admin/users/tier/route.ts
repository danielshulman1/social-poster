import { NextResponse } from "next/server";
import { forbiddenText, getApiAuthContext, unauthorizedText } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { getTierOrNull, normalizeTier } from "@/lib/tiers";

export const dynamic = "force-dynamic";

function getNextBillingDate() {
  const nextBillingDate = new Date();
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  return nextBillingDate;
}

export async function GET(req: Request) {
  const auth = await getApiAuthContext(req);
  if (!auth?.userId) return unauthorizedText();
  if (auth.role !== "admin") return forbiddenText();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId")?.trim();

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      subscription: {
        select: {
          status: true,
          priceId: true,
          currentPeriodEnd: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    userId: user.id,
    tier: getTierOrNull(user.subscription?.priceId),
    subscription: user.subscription,
  });
}

export async function POST(req: Request) {
  const auth = await getApiAuthContext(req);
  if (!auth?.userId) return unauthorizedText();
  if (auth.role !== "admin") return forbiddenText();

  const { userId, tier } = await req.json();
  const normalizedTier = normalizeTier(tier);

  if (!userId || !normalizedTier) {
    return NextResponse.json(
      { error: "Valid userId and tier are required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const subscription = await prisma.subscription.upsert({
    where: { userId },
    update: {
      status: "active",
      priceId: normalizedTier,
      currentPeriodEnd: getNextBillingDate(),
    },
    create: {
      userId,
      status: "active",
      priceId: normalizedTier,
      currentPeriodEnd: getNextBillingDate(),
    },
  });

  return NextResponse.json({
    message: `User tier updated to ${normalizedTier}`,
    tier: normalizedTier,
    subscription,
  });
}
