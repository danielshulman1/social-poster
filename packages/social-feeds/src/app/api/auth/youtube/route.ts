import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl } from "@/lib/appUrl";
import { createOAuthState } from "@/lib/oauth-state";
import { getSensitiveActionRedirectPath } from "@/lib/session-security";
import { decryptUserSecretFields } from "@/lib/user-secrets";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const baseUrl = getAppBaseUrl(req.url) || 'http://localhost:3000';
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.redirect(new URL('/login', baseUrl));
    }
    const securityRedirect = getSensitiveActionRedirectPath(session);
    if (securityRedirect) {
        return NextResponse.redirect(new URL(securityRedirect, baseUrl));
    }

    // Read user's YouTube credentials from DB
    const user = decryptUserSecretFields(await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { youtubeClientId: true, youtubeClientSecret: true },
    }));

    if (!user?.youtubeClientId || !user?.youtubeClientSecret) {
        return NextResponse.json(
            { error: "YouTube credentials not configured. Go to Settings → API Keys to add your YouTube Client ID and Secret." },
            { status: 400 }
        );
    }

    const redirectUri = `${baseUrl}/api/auth/youtube/callback`;
    const state = createOAuthState({ userId: session.user.id, provider: "youtube" });

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', user.youtubeClientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    return NextResponse.redirect(authUrl.toString());
}
