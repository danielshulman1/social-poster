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
            console.error('Facebook token error:', tokenData);
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

        console.log('=== FACEBOOK PAGES REQUEST ===');
        console.log('Pages endpoint response status:', pagesRes.status);
        console.log('Full response:', JSON.stringify(pagesData, null, 2));

        if (pagesData?.error) {
            console.error('Facebook API Error:', pagesData.error);
        }

        let addedCount = 0;
        let igAddedCount = 0;

        // Extract pages from response
        const pages = (pagesRes.ok && pagesData.data) ? pagesData.data : [];
        console.log('Pages found:', pages.length);
        if (pages.length > 0) {
            console.log('First page:', JSON.stringify(pages[0], null, 2));
        }

        for (const page of pages) {
            console.log('Processing page:', { id: page.id, name: page.name, hasToken: !!page.access_token });
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
                        credentials: JSON.stringify({
                            accessToken: page.access_token,
                            pageId: page.id,
                            connectedAt: new Date().toISOString()
                        }),
                    },
                });
                console.log('Saved Facebook connection:', { id: savedConnection.id, name: savedConnection.name });
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
                    console.log('Fetching Instagram account for page:', { pageId: page.id, response: JSON.stringify(igPageData) });

                    if (igPageData.instagram_business_account?.id) {
                        igId = igPageData.instagram_business_account.id;
                        console.log('Found Instagram ID:', { pageId: page.id, igId });

                        // Fetch the actual Instagram username and profile info
                        try {
                            const igProfileUrl = new URL(`https://graph.facebook.com/v19.0/${igId}`);
                            igProfileUrl.searchParams.set('access_token', finalUserToken);
                            igProfileUrl.searchParams.set('fields', 'username,name,profile_picture_url');
                            const igProfileRes = await fetch(igProfileUrl.toString());
                            const igProfileData = await igProfileRes.json();
                            console.log('Instagram profile data:', JSON.stringify(igProfileData));
                            
                            if (igProfileData.username) {
                                igUsername = igProfileData.username;
                                igName = igProfileData.name || igUsername;
                            }
                        } catch (profileErr) {
                            console.log('Failed to fetch Instagram profile:', profileErr);
                        }
                    } else {
                        console.log('No Instagram account linked to page:', { pageId: page.id, responseKeys: Object.keys(igPageData) });
                    }
                } catch (e) {
                    console.log('Failed to fetch Instagram account:', e);
                }

                // If we found an Instagram account, save it
                if (igId) {
                    const displayName = igUsername ? `@${igUsername}` : `IG linked to ${page.name}`;

                    console.log('Found linked Instagram account:', { igId, igUsername, displayName, pageId: page.id });

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
                            credentials: JSON.stringify({
                                accessToken: page.access_token, // IG Graph API uses the FB Page Access Token for publishing
                                username: igUsername || igId,
                                userId: igId,
                                pageId: page.id,
                                connectedAt: new Date().toISOString()
                            }),
                        },
                    });
                    console.log('Saved Instagram connection:', { id: savedIgConnection.id, name: savedIgConnection.name });
                    igAddedCount++;
                } else {
                    console.log('No linked Instagram account found for page:', page.name);
                }
            }
        }

        // Always succeed if we got a valid access token, even if pages are empty
        // (pages might not be accessible due to permission requirements)
        const redirectUrl = `${baseUrl}/connections?success=facebook&added=${addedCount}&igAdded=${igAddedCount}`;
        console.log('Facebook callback success, redirecting to:', redirectUrl);
        return NextResponse.redirect(redirectUrl);
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'facebook_callback_failed';
        console.error('Facebook callback error:', err);
        return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(errorMessage)}`);
    }
}
