import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl, normalizeEnv } from "@/lib/appUrl";
import { verifyOAuthState } from "@/lib/oauth-state";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const baseUrl = getAppBaseUrl(req.url) || "http://localhost:3000";

    if (error) {
        return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(error)}`);
    }
    if (!code || !state) {
        return NextResponse.redirect(`${baseUrl}/connections?error=missing_params`);
    }

    const clientId = normalizeEnv(process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_SHEETS_CLIENT_ID);
    const clientSecret = normalizeEnv(process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_SHEETS_CLIENT_SECRET);
    if (!clientId || !clientSecret) {
        return NextResponse.redirect(`${baseUrl}/connections?error=missing_google_oauth_config`);
    }

    const session = await getServerSession(authOptions);
    const verifiedState = verifyOAuthState(state, "google");
    if (!verifiedState || !session?.user?.id || session.user.id !== verifiedState.userId) {
        return NextResponse.redirect(`${baseUrl}/connections?error=invalid_state`);
    }
    const userId = verifiedState.userId;
    if (!userId) {
        return NextResponse.redirect(`${baseUrl}/connections?error=invalid_user`);
    }

    try {
        const redirectUri = `${baseUrl}/api/auth/google/callback`;
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }),
        });

        const tokenData = await tokenRes.json().catch(() => ({}));
        if (!tokenRes.ok || !tokenData.access_token) {
            return NextResponse.redirect(`${baseUrl}/connections?error=google_token_exchange_failed`);
        }

        const grantedScope = typeof tokenData.scope === "string" ? tokenData.scope : "";
        const hasSheetsScope = grantedScope.includes("https://www.googleapis.com/auth/spreadsheets")
            || grantedScope.includes("https://www.googleapis.com/auth/spreadsheets.readonly");
        if (!hasSheetsScope) {
            return NextResponse.redirect(`${baseUrl}/connections?error=google_missing_sheets_scope`);
        }

        let accountEmail: string | null = null;
        let accountName = "Google Sheets";
        try {
            const meRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });
            const me = await meRes.json().catch(() => ({}));
            accountEmail = me.email || null;
            accountName = me.email || me.name || "Google Sheets";
        } catch {
            // Optional profile lookup only.
        }

        const creds = {
            accessToken: tokenData.access_token as string,
            refreshToken: (tokenData.refresh_token as string | undefined) || null,
            expiresAt: Date.now() + ((tokenData.expires_in || 3600) * 1000),
            scope: grantedScope,
            tokenType: tokenData.token_type || "Bearer",
            email: accountEmail,
            connectedAt: new Date().toISOString(),
        };

        const existing = await prisma.externalConnection.findFirst({
            where: { userId, provider: "google" },
            orderBy: { updatedAt: "desc" },
        });

        if (existing) {
            const prev = JSON.parse(existing.credentials || "{}");
            const prevScope = typeof prev.scope === "string" ? prev.scope : "";
            const prevHasSheetsScope = prevScope.includes("https://www.googleapis.com/auth/spreadsheets")
                || prevScope.includes("https://www.googleapis.com/auth/spreadsheets.readonly");
            const preservedRefreshToken = creds.refreshToken
                || (prevHasSheetsScope ? (prev.refreshToken || null) : null);
            const merged = {
                ...prev,
                ...creds,
                // Preserve prior refresh token only if it already had Sheets scopes.
                refreshToken: preservedRefreshToken,
            };
            await prisma.externalConnection.update({
                where: { id: existing.id },
                data: { name: accountName, credentials: JSON.stringify(merged) },
            });
        } else {
            await prisma.externalConnection.create({
                data: {
                    userId,
                    provider: "google",
                    name: accountName,
                    credentials: JSON.stringify(creds),
                },
            });
        }

        return NextResponse.redirect(`${baseUrl}/connections?success=google`);
    } catch {
        return NextResponse.redirect(`${baseUrl}/connections?error=google_callback_failed`);
    }
}
