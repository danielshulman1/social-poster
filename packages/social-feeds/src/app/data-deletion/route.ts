import crypto from "crypto";
import { NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/appUrl";
import {
  createDeletionStatusToken,
  purgeMetaUserData,
  verifyDeletionStatusToken,
  verifySignedRequest,
} from "@/lib/meta-data-deletion";

export const dynamic = "force-dynamic";

const extractSignedRequest = async (req: Request) => {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const value = formData.get("signed_request");
    return typeof value === "string" ? value : "";
  }

  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    return typeof body?.signed_request === "string" ? body.signed_request : "";
  }

  const rawBody = await req.text();
  const params = new URLSearchParams(rawBody);
  return params.get("signed_request") || "";
};

export async function POST(req: Request) {
  try {
    const signedRequest = await extractSignedRequest(req);
    if (!signedRequest) {
      return NextResponse.json({ error: "Missing signed_request" }, { status: 400 });
    }

    const payload = await verifySignedRequest(signedRequest);
    if (!payload.user_id) {
      return NextResponse.json({ error: "Signed request payload did not include user_id" }, { status: 400 });
    }

    await purgeMetaUserData(payload.user_id);

    const confirmationCode = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
    const token = createDeletionStatusToken(confirmationCode, payload.user_id);
    const baseUrl = getAppBaseUrl(req.url) || "http://localhost:3000";
    const statusUrl = `${baseUrl}/data-deletion?code=${encodeURIComponent(confirmationCode)}&token=${encodeURIComponent(token)}`;

    return NextResponse.json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    console.error("Meta data deletion callback failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Data deletion callback failed" },
      { status: 400 }
    );
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const confirmationCode = url.searchParams.get("code");
  const token = url.searchParams.get("token");

  if (!confirmationCode || !token) {
    return NextResponse.json({
      status: "ready",
      message: "This endpoint is configured for Meta data deletion callbacks. Meta will POST a signed_request here, and returned status URLs can be checked with the code and token query parameters.",
    });
  }

  const verified = verifyDeletionStatusToken(token, confirmationCode);

  if (!verified) {
    return NextResponse.json(
      {
        status: "invalid",
        message: "Deletion request could not be verified.",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    status: "completed",
    confirmation_code: confirmationCode,
    message: "The deletion request was received and the associated Meta connection data has been removed.",
  });
}
