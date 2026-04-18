import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl, normalizeEnv } from "@/lib/appUrl";
import { verifyOAuthState } from "@/lib/oauth-state";
import { serializeConnectionCredentials } from "@/lib/connection-credentials";
import { getSensitiveActionRedirectPath } from "@/lib/session-security";
import { decryptUserSecretFields } from "@/lib/user-secrets";

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
        return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(errorDescription || error)}`);
    }

    if (!code || !state) {
        return NextResponse.redirect(`${baseUrl}/connections?error=missing_params`);
    }

    const session = await getServerSession(authOptions);
    const securityRedirect = getSensitiveActionRedirectPath(session);
    if (securityRedirect) {
        return NextResponse.redirect(`${baseUrl}${securityRedirect}`);
    }
    const verifiedState = verifyOAuthState(state, "facebook");
    if (!verifiedState || !session?.user?.id || session.user.id !== verifiedState.userId) {
        return NextResponse.redirect(`${baseUrl}/connections?error=invalid_state`);
    }
    const userId = verifiedState.userId;

    const prismaUser = decryptUserSecretFields(await prisma.user.findUnique({
        where: { id: userId },
        select: { facebookAppId: true, facebookAppSecret: true }
    }));

    const userAppId = normalizeEnv(prismaUser?.facebookAppId);
    const userAppSecret = normalizeEnv(prismaUser?.facebookAppSecret);
    const envAppId = normalizeEnv(process.env.NEXT_PUBLIC_FACEBOOK_APP_ID) || normalizeEnv(process.env.FACEBOOK_APP_ID);
    const envAppSecret = normalizeEnv(process.env.FACEBOOK_APP_SECRET) || normalizeEnv(process.env.FACEBOOK_PAGE_SECRET);

    // User's own credentials take priority, fallback to environment variables
    const appId = userAppId || envAppId;
    const appSecret = userAppSecret || envAppSecret;

    if (!appId || !appSecret || isPlaceholder(appId) || isPlaceholder(appSecret)) {
        return NextResponse.redirect(`${baseUrl}/settings?error=missing_facebook_config`);
    }

    const redirectUri = `${baseUrl}/api/auth/facebook/callback`;

    try {
        // 1. Exchange code for access token
        const tokenUrl = new URL('https://graph.facebook.com/oauth/access_token');
        tokenUrl.searchParams.set('client_id', appId);
        tokenUrl.searchParams.set('redirect_uri', redirectUri);
        tokenUrl.searchParams.set('client_secret', appSecret);
        tokenUrl.searchParams.set('code', code);
        const tokenRes = await fetch(tokenUrl.toString());

        const tokenData = await tokenRes.json();
        if (!tokenRes.ok || !tokenData.access_token) {
            console.error('Facebook token exchange failed');
            const detail = tokenData?.error?.message || tokenData?.error_description || '';
            return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(`token_failed:${detail}`)}`);
        }

        const userAccessToken = tokenData.access_token;

        // 2. Exchange for a long-lived user token
        const longTokenUrl = new URL('https://graph.facebook.com/oauth/access_token');
        longTokenUrl.searchParams.set('grant_type', 'fb_exchange_token');
        longTokenUrl.searchParams.set('client_id', appId);
        longTokenUrl.searchParams.set('client_secret', appSecret);
        longTokenUrl.searchParams.set('fb_exchange_token', userAccessToken);
        const longTokenRes = await fetch(longTokenUrl.toString());
        const longTokenData = await longTokenRes.json();
        const finalUserToken = longTokenData.access_token || userAccessToken;

        // 3. Fetch user's pages - use /me/accounts which should return pages with access tokens
        const pagesUrl = new URL('https://graph.facebook.com/v19.0/me/accounts');
        pagesUrl.searchParams.set('access_token', finalUserToken);
        pagesUrl.searchParams.set('fields', 'id,name,access_token,instagram_business_account');
        const pagesRes = await fetch(pagesUrl.toString());
        const pagesData = await pagesRes.json();

        if (pagesData?.error) {
            console.error('Facebook pages fetch failed');
        }

        let addedCount = 0;
        let igAddedCount = 0;

        // Extract pages from response
        const pages = (pagesRes.ok && pagesData.data) ? pagesData.data : [];

        for (const page of pages) {
            if (page.id && page.name && page.access_token) {
                // Delete existing FB page connection if it exists to avoid duplicates
                await prisma.externalConnection.deleteMany({
                    where: {
                        userId,
                        provider: 'facebook',
                        name: page.name
                    }
                });

                // Save Facebook Page Connection using the long-lived Page Access Token
                const savedConnection = await prisma.externalConnection.create({
                    data: {
                        userId,
                        provider: 'facebook',
                        name: page.name,
                        credentials: serializeConnectionCredentials({
                            accessToken: page.access_token,
                            pageId: page.id,
                            connectedAt: new Date().toISOString()
                        }),
                    },
                });
                addedCount++;

                // 5. Try to fetch Instagram accounts linked to this page
                // IMPORTANT: Use the USER access token (finalUserToken), not the page token.
                // The instagram_business_basic permission is granted on the user token.
                let igId: string | undefined;
                let igUsername: string | undefined;
                let igName: string | undefined;
                try {
                    const igPageUrl = new URL(`https://graph.facebook.com/v19.0/${page.id}`);
                    igPageUrl.searchParams.set('access_token', finalUserToken);
                    igPageUrl.searchParams.set('fields', 'instagram_business_account');
                    const igPageRes = await fetch(igPageUrl.toString());
                    const igPageData = await igPageRes.json();

                    if (igPageData.instagram_business_account?.id) {
                        igId = igPageData.instagram_business_account.id;

                        // Fetch the actual Instagram username and profile info
                        try {
                            const igProfileUrl = new URL(`https://graph.facebook.com/v19.0/${igId}`);
                            igProfileUrl.searchParams.set('access_token', finalUserToken);
                            igProfileUrl.searchParams.set('fields', 'username,name,profile_picture_url');
                            const igProfileRes = await fetch(igProfileUrl.toString());
                            const igProfileData = await igProfileRes.json();
                            
                            if (igProfileData.username) {
                                igUsername = igProfileData.username;
                                igName = igProfileData.name || igUsername;
                            }
                        } catch (profileErr) {
                            console.error('Failed to fetch Instagram profile');
                        }
                    }
                } catch (e) {
                    console.error('Failed to fetch Instagram account');
                }

                // If we found an Instagram account, save it
                if (igId) {
                    const displayName = igUsername ? `@${igUsername}` : `IG linked to ${page.name}`;

                    // Delete existing IG connection to avoid duplicates
                    await prisma.externalConnection.deleteMany({
                        where: {
                            userId,
                            provider: 'instagram',
                        }
                    });

                    const savedIgConnection = await prisma.externalConnection.create({
                        data: {
                            userId,
                            provider: 'instagram',
                            name: displayName,
                            credentials: serializeConnectionCredentials({
                                accessToken: page.access_token, // IG Graph API uses the FB Page Access Token for publishing
                                username: igUsername || igId,
                                userId: igId,
                                pageId: page.id,
                                connectedAt: new Date().toISOString()
                            }),
                        },
                    });
                    igAddedCount++;
                }
            }
        }

        // Always succeed if we got a valid access token, even if pages are empty
        // (pages might not be accessible due to permission requirements)
        const redirectUrl = `${baseUrl}/connections?success=facebook&added=${addedCount}&igAdded=${igAddedCount}`;
        return NextResponse.redirect(redirectUrl);
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'facebook_callback_failed';
        console.error('Facebook callback error:', err);
        return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(errorMessage)}`);
    }
}
