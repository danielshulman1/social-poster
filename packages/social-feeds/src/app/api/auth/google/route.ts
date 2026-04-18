import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAppBaseUrl, normalizeEnv } from "@/lib/appUrl";
import { createOAuthState } from "@/lib/oauth-state";
import { getSensitiveActionRedirectPath } from "@/lib/session-security";

export async function GET(req: Request) {
    const baseUrl = getAppBaseUrl(req.url) || "http://localhost:3000";
    const clientId = normalizeEnv(process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_SHEETS_CLIENT_ID);
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.redirect(`${baseUrl}/connections?error=unauthorized`);
    }
    const securityRedirect = getSensitiveActionRedirectPath(session);
    if (securityRedirect) {
        return NextResponse.redirect(`${baseUrl}${securityRedirect}`);
    }

    if (!clientId) {
        return NextResponse.redirect(`${baseUrl}/connections?error=missing_google_oauth_config`);
    }

    const state = createOAuthState({ userId: session.user.id, provider: "google" });
    const scope = [
        "https://www.googleapis.com/auth/spreadsheets",
    ].join(" ");

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", scope);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("include_granted_scopes", "true");
    url.searchParams.set("state", state);

    return NextResponse.redirect(url.toString());
}
