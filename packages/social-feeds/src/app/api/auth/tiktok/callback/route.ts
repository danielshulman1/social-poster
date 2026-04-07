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

    // Read user's TikTok credentials
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tiktokClientId: true, tiktokClientSecret: true },
    });

    if (!user?.tiktokClientId || !user?.tiktokClientSecret) {
        return NextResponse.redirect(`${baseUrl}/connections?error=missing_tiktok_config`);
    }

    const redirectUri = `${baseUrl}/api/auth/tiktok/callback`;

    try {
        // Exchange code for access token
        const tokenRes = await fetch('https://open.tiktokapis.com/v1/oauth/token/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_key: user.tiktokClientId,
                client_secret: user.tiktokClientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            }),
        });

        const tokenData = await tokenRes.json();
        if (!tokenRes.ok || !tokenData.data?.access_token) {
            console.error('TikTok token error:', tokenData);
            return NextResponse.redirect(`${baseUrl}/connections?error=token_failed`);
        }

        // Get user profile
        const profileRes = await fetch('https://open.tiktokapis.com/v1/user/info/?fields=open_id,display_name,avatar_large_url', {
            headers: {
                'Authorization': `Bearer ${tokenData.data.access_token}`,
            },
        });
        const profileData = await profileRes.json();

        if (!profileRes.ok || !profileData.data?.user?.open_id) {
            console.error('TikTok profile error:', profileData);
            return NextResponse.redirect(`${baseUrl}/connections?error=tiktok_profile_failed`);
        }

        const displayName = profileData.data.user.display_name || 'TikTok Account';
        const tiktokId = profileData.data.user.open_id;

        // Keep one active TikTok connection per user
        await prisma.externalConnection.deleteMany({
            where: { userId, provider: 'tiktok' },
        });

        // Save connection
        await prisma.externalConnection.create({
            data: {
                userId,
                provider: 'tiktok',
                name: displayName,
                credentials: JSON.stringify({
                    accessToken: tokenData.data.access_token,
                    refreshToken: tokenData.data.refresh_token || null,
                    expiresIn: tokenData.data.expires_in,
                    username: displayName,
                    tiktokId,
                    connectedAt: new Date().toISOString(),
                }),
            },
        });

        return NextResponse.redirect(`${baseUrl}/connections?success=tiktok`);
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'tiktok_callback_failed';
        console.error('TikTok callback error:', err);
        return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(errorMessage)}`);
    }
}
