import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl } from "@/lib/appUrl";
import crypto from "crypto";
import { createOAuthState } from "@/lib/oauth-state";
import { decryptUserSecretFields } from "@/lib/user-secrets";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const baseUrl = getAppBaseUrl(req.url) || 'http://localhost:3000';
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.redirect(new URL('/login', baseUrl));
    }

    // Read user's Twitter credentials from DB
    const user = decryptUserSecretFields(await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { twitterClientId: true, twitterClientSecret: true },
    }));

    if (!user?.twitterClientId || !user?.twitterClientSecret) {
        return NextResponse.json(
            { error: "Twitter credentials not configured. Go to Settings → API Keys to add your Twitter Client ID and Secret." },
            { status: 400 }
        );
    }

    const redirectUri = `${baseUrl}/api/auth/twitter/callback`;

    // Generate PKCE challenge
    const codeVerifier = crypto.randomBytes(32).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    const state = createOAuthState({ userId: session.user.id, provider: "twitter", codeVerifier });

    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', user.twitterClientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'tweet.read tweet.write users.read follows.read follows.write offline.access');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeVerifier);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    return NextResponse.redirect(authUrl.toString());
}
