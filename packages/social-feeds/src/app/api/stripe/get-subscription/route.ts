import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext, unauthorizedText } from "@/lib/apiAuth";
import { getUserSubscription } from "@/lib/subscription";

export async function GET(request: NextRequest) {
  try {
    const auth = await getApiAuthContext(request);
    if (!auth?.userId) return unauthorizedText();

    const requestedUserId = request.nextUrl.searchParams.get("userId");
    const userId =
      auth.role === "admin" && requestedUserId ? requestedUserId : auth.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "userId required" },
        { status: 400 }
      );
    }

    const subscription = await getUserSubscription(userId);

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("[get-subscription]", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
