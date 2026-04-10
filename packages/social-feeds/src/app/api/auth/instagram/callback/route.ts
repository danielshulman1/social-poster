import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl, normalizeEnv } from "@/lib/appUrl";

export const dynamic = 'force-dynamic';

const isPlaceholder = (value: string) => {
    const normalized = value.toLowerCase();
    return normalized.includes("your_fb_app_id_here")
        || normalized.includes("your_fb_app_secret_here")
        || normalized.includes("your_facebook_app_id")
        || normalized.includes("your_facebook_app_secret");
};

export async function GET(req: Request) {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');
    const baseUrl = getAppBaseUrl(req.url) || "http://localhost:3000";

    if (error) {
        console.error('Instagram OAuth error:', error, errorDescription);
        return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(errorDescription || error)}`);
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

    const prismaUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { facebookAppId: true, facebookAppSecret: true }
    });

    const userAppId = normalizeEnv(prismaUser?.facebookAppId);
    const userAppSecret = normalizeEnv(prismaUser?.facebookAppSecret);
    const envAppId = normalizeEnv(process.env.NEXT_PUBLIC_FACEBOOK_APP_ID) || normalizeEnv(process.env.FACEBOOK_APP_ID);
    const envAppSecret = normalizeEnv(process.env.FACEBOOK_APP_SECRET) || normalizeEnv(process.env.FACEBOOK_PAGE_SECRET);

    const appId = userAppId || envAppId;
    const appSecret = userAppSecret || envAppSecret;

    if (!appId || !appSecret || isPlaceholder(appId) || isPlaceholder(appSecret)) {
        return NextResponse.redirect(`${baseUrl}/settings?error=missing_facebook_config`);
    }

    const redirectUri = `${baseUrl}/api/auth/instagram/callback`;

    try {
        // 1. Exchange code for short-lived token via Instagram API
        // Instagram requires form-urlencoded POST, NOT URL params
        console.log('=== INSTAGRAM CALLBACK ===');
        console.log('Exchanging code for token...');

        const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: appId,
                client_secret: appSecret,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                code: code,
            }).toString(),
        });

        const tokenData = await tokenRes.json();
        console.log('Token exchange response status:', tokenRes.status);
        console.log('Token exchange response:', JSON.stringify(tokenData, null, 2));

        if (!tokenRes.ok || !tokenData.access_token) {
            console.error('Instagram token error:', tokenData);
            const detail = tokenData?.error_message || tokenData?.error?.message || '';
            return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(`instagram_token_failed:${detail}`)}`);
        }

        const shortLivedToken = tokenData.access_token;
        const igUserId = tokenData.user_id;

        // 2. Exchange for a long-lived token
        console.log('Exchanging for long-lived token...');
        const longTokenUrl = new URL('https://graph.instagram.com/access_token');
        longTokenUrl.searchParams.set('grant_type', 'ig_exchange_token');
        longTokenUrl.searchParams.set('client_secret', appSecret);
        longTokenUrl.searchParams.set('access_token', shortLivedToken);

        const longTokenRes = await fetch(longTokenUrl.toString());
        const longTokenData = await longTokenRes.json();
        console.log('Long-lived token response:', JSON.stringify(longTokenData, null, 2));

        const finalToken = longTokenData.access_token || shortLivedToken;

        // 3. Fetch user profile (username, name)
        console.log('Fetching Instagram profile...');
        const profileUrl = new URL(`https://graph.instagram.com/v19.0/me`);
        profileUrl.searchParams.set('fields', 'user_id,username,name,profile_picture_url,account_type');
        profileUrl.searchParams.set('access_token', finalToken);

        const profileRes = await fetch(profileUrl.toString());
        const profileData = await profileRes.json();
        console.log('Profile data:', JSON.stringify(profileData, null, 2));

        const igUsername = profileData.username || `ig_${igUserId}`;
        const displayName = `@${igUsername}`;

        // 4. Delete existing Instagram connections for this user to avoid duplicates
        await prisma.externalConnection.deleteMany({
            where: {
                userId,
                provider: 'instagram',
            }
        });

        // 5. Save the Instagram connection
        const savedConnection = await prisma.externalConnection.create({
            data: {
                userId,
                provider: 'instagram',
                name: displayName,
                credentials: JSON.stringify({
                    accessToken: finalToken,
                    username: igUsername,
                    userId: igUserId?.toString() || profileData.user_id?.toString(),
                    accountType: profileData.account_type,
                    connectedAt: new Date().toISOString(),
                    tokenType: 'instagram_login', // Distinguish from Facebook Login tokens
                }),
            },
        });

        console.log('Saved Instagram connection:', { id: savedConnection.id, name: savedConnection.name });

        const redirectUrl = `${baseUrl}/connections?success=instagram&igAdded=1&igName=${encodeURIComponent(displayName)}`;
        console.log('Instagram callback success, redirecting to:', redirectUrl);
        return NextResponse.redirect(redirectUrl);
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'instagram_callback_failed';
        console.error('Instagram callback error:', err);
        return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(errorMessage)}`);
    }
}
