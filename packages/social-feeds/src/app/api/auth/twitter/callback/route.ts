import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl } from "@/lib/appUrl";
import { verifyOAuthState } from "@/lib/oauth-state";
export async function GET(req: Request) {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    const baseUrl = getAppBaseUrl(req.url) || 'http://localhost:3000';

    if (error) {
        return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
        return NextResponse.redirect(`${baseUrl}/connections?error=missing_params`);
    }

    const session = await getServerSession(authOptions);
    const verifiedState = verifyOAuthState(state, "twitter");
    if (!verifiedState || !session?.user?.id || session.user.id !== verifiedState.userId || !verifiedState.codeVerifier) {
        return NextResponse.redirect(`${baseUrl}/connections?error=invalid_state`);
    }
    const userId = verifiedState.userId;
    const codeVerifier = verifiedState.codeVerifier;

    // Read user's Twitter credentials
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { twitterClientId: true, twitterClientSecret: true },
    });

    if (!user?.twitterClientId || !user?.twitterClientSecret) {
        return NextResponse.redirect(`${baseUrl}/connections?error=missing_twitter_config`);
    }

    const redirectUri = `${baseUrl}/api/auth/twitter/callback`;

    try {
        // Exchange code for access token
        const tokenRes = await fetch('https://twitter.com/2/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                client_id: user.twitterClientId,
                client_secret: user.twitterClientSecret,
                code_verifier: codeVerifier,
            }),
        });

        const tokenData = await tokenRes.json();
        if (!tokenRes.ok || !tokenData.access_token) {
            console.error('Twitter token exchange failed');
            return NextResponse.redirect(`${baseUrl}/connections?error=token_failed`);
        }

        // Get user profile
        const profileRes = await fetch('https://api.twitter.com/2/users/me', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
        });
        const profileData = await profileRes.json();

        if (!profileRes.ok || !profileData.data?.id) {
            console.error('Twitter profile fetch failed');
            return NextResponse.redirect(`${baseUrl}/connections?error=twitter_profile_failed`);
        }

        const twitterId = profileData.data.id;
        const twitterHandle = profileData.data.username;

        // Keep one active Twitter connection per user
        await prisma.externalConnection.deleteMany({
            where: { userId, provider: 'twitter' },
        });

        // Save connection
        await prisma.externalConnection.create({
            data: {
                userId,
                provider: 'twitter',
                name: `@${twitterHandle}`,
                credentials: JSON.stringify({
                    accessToken: tokenData.access_token,
                    refreshToken: tokenData.refresh_token || null,
                    expiresIn: tokenData.expires_in,
                    username: twitterHandle,
                    twitterId,
                    connectedAt: new Date().toISOString(),
                }),
            },
        });

        return NextResponse.redirect(`${baseUrl}/connections?success=twitter`);
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'twitter_callback_failed';
        console.error('Twitter callback error:', err);
        return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(errorMessage)}`);
    }
}
