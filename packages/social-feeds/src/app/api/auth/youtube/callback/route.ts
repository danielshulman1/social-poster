import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl } from "@/lib/appUrl";
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

    let userId: string;
    try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
        userId = decoded.userId;
    } catch {
        return NextResponse.redirect(`${baseUrl}/connections?error=invalid_state`);
    }

    // Read user's YouTube credentials
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { youtubeClientId: true, youtubeClientSecret: true },
    });

    if (!user?.youtubeClientId || !user?.youtubeClientSecret) {
        return NextResponse.redirect(`${baseUrl}/connections?error=missing_youtube_config`);
    }

    const redirectUri = `${baseUrl}/api/auth/youtube/callback`;

    try {
        // Exchange code for access token
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: user.youtubeClientId,
                client_secret: user.youtubeClientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            }),
        });

        const tokenData = await tokenRes.json();
        if (!tokenRes.ok || !tokenData.access_token) {
            console.error('YouTube token error:', tokenData);
            return NextResponse.redirect(`${baseUrl}/connections?error=token_failed`);
        }

        // Get user profile
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
            },
        });
        const profileData = await profileRes.json();

        if (!profileRes.ok || !profileData.id) {
            console.error('YouTube profile error:', profileData);
            return NextResponse.redirect(`${baseUrl}/connections?error=youtube_profile_failed`);
        }

        const displayName = profileData.name || profileData.email || 'YouTube Account';

        // Keep one active YouTube connection per user
        await prisma.externalConnection.deleteMany({
            where: { userId, provider: 'youtube' },
        });

        // Save connection
        await prisma.externalConnection.create({
            data: {
                userId,
                provider: 'youtube',
                name: displayName,
                credentials: JSON.stringify({
                    accessToken: tokenData.access_token,
                    refreshToken: tokenData.refresh_token || null,
                    expiresIn: tokenData.expires_in,
                    username: displayName,
                    googleId: profileData.id,
                    email: profileData.email,
                    connectedAt: new Date().toISOString(),
                }),
            },
        });

        return NextResponse.redirect(`${baseUrl}/connections?success=youtube`);
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'youtube_callback_failed';
        console.error('YouTube callback error:', err);
        return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(errorMessage)}`);
    }
}
