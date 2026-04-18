import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl } from "@/lib/appUrl";
import { verifyOAuthState } from "@/lib/oauth-state";
import { serializeConnectionCredentials } from "@/lib/connection-credentials";
import { decryptUserSecretFields } from "@/lib/user-secrets";
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
    const verifiedState = verifyOAuthState(state, "pinterest");
    if (!verifiedState || !session?.user?.id || session.user.id !== verifiedState.userId) {
        return NextResponse.redirect(`${baseUrl}/connections?error=invalid_state`);
    }
    const userId = verifiedState.userId;

    // Read user's Pinterest credentials
    const user = decryptUserSecretFields(await prisma.user.findUnique({
        where: { id: userId },
        select: { pinterestClientId: true, pinterestClientSecret: true },
    }));

    if (!user?.pinterestClientId || !user?.pinterestClientSecret) {
        return NextResponse.redirect(`${baseUrl}/connections?error=missing_pinterest_config`);
    }

    const redirectUri = `${baseUrl}/api/auth/pinterest/callback`;

    try {
        // Exchange code for access token
        const tokenRes = await fetch('https://api.pinterest.com/v1/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                client_id: user.pinterestClientId,
                client_secret: user.pinterestClientSecret,
            }),
        });

        const tokenData = await tokenRes.json();
        if (!tokenRes.ok || !tokenData.access_token) {
            console.error('Pinterest token exchange failed');
            return NextResponse.redirect(`${baseUrl}/connections?error=token_failed`);
        }

        // Get user profile
        const profileRes = await fetch('https://api.pinterest.com/v1/user/account/?fields=username,first_name,last_name', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
            },
        });
        const profileData = await profileRes.json();

        if (!profileRes.ok || !profileData.username) {
            console.error('Pinterest profile fetch failed');
            return NextResponse.redirect(`${baseUrl}/connections?error=pinterest_profile_failed`);
        }

        const displayName = profileData.first_name && profileData.last_name
            ? `${profileData.first_name} ${profileData.last_name}`
            : profileData.username;

        // Keep one active Pinterest connection per user
        await prisma.externalConnection.deleteMany({
            where: { userId, provider: 'pinterest' },
        });

        // Save connection
        await prisma.externalConnection.create({
            data: {
                userId,
                provider: 'pinterest',
                name: displayName,
                credentials: serializeConnectionCredentials({
                    accessToken: tokenData.access_token,
                    expiresIn: tokenData.expires_in,
                    username: profileData.username,
                    connectedAt: new Date().toISOString(),
                }),
            },
        });

        return NextResponse.redirect(`${baseUrl}/connections?success=pinterest`);
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'pinterest_callback_failed';
        console.error('Pinterest callback error:', err);
        return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(errorMessage)}`);
    }
}
