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

        // 3. First, check user info to verify token is valid
        const userUrl = new URL('https://graph.facebook.com/v18.0/me');
        userUrl.searchParams.set('access_token', finalUserToken);
        userUrl.searchParams.set('fields', 'id,name,email');
        const userRes = await fetch(userUrl.toString());
        const userData = await userRes.json();
        console.log('=== USER INFO ===');
        console.log('User info:', JSON.stringify(userData, null, 2));

        // 4. Fetch user's pages using the correct endpoint that works with user tokens
        // Use /me/owned_businesses or /me/adaccounts instead of /me/accounts for newer API
        const pagesUrl = new URL('https://graph.facebook.com/v18.0/me/businesses');
        pagesUrl.searchParams.set('access_token', finalUserToken);
        pagesUrl.searchParams.set('fields', 'id,name');
        let pagesRes = await fetch(pagesUrl.toString());
        let pagesData = await pagesRes.json();

        console.log('=== TRY BUSINESSES ENDPOINT ===');
        console.log('Response:', JSON.stringify(pagesData, null, 2));

        // If businesses endpoint doesn't work, try the accounts endpoint with a different approach
        if (!pagesData.data || pagesData.data.length === 0) {
            console.log('=== FALLBACK: TRY ACCOUNTS ENDPOINT ===');
            const accountsUrl = new URL('https://graph.facebook.com/v18.0/me/accounts');
            accountsUrl.searchParams.set('access_token', finalUserToken);
            accountsUrl.searchParams.set('fields', 'id,name,access_token,instagram_business_account,roles,picture');
            pagesRes = await fetch(accountsUrl.toString());
            pagesData = await pagesRes.json();
            console.log('Accounts endpoint response:', JSON.stringify(pagesData, null, 2));
        }

        console.log('=== FACEBOOK PAGES REQUEST ===');
        console.log('Access token used (first 20 chars):', finalUserToken.substring(0, 20) + '...');
        console.log('Pages endpoint response status:', pagesRes.status);
        console.log('Pages endpoint response:', JSON.stringify(pagesData, null, 2));

        if (pagesData?.error) {
            console.error('Facebook API Error:', pagesData.error);
        }

        if (pagesData?.data?.length > 0) {
            console.log('✓ Found', pagesData.data.length, 'pages');
            console.log('First page:', JSON.stringify(pagesData.data[0], null, 2));
        } else {
            console.log('✗ No pages found. Pages data:', pagesData?.data);
        }

        // If pages endpoint fails, it's likely due to missing pages_show_list permission
        // In that case, we still consider it a successful OAuth (user authenticated)
        let addedCount = 0;
        let igAddedCount = 0;

        // 4. Save each page to database (if available)
        const pages = (pagesRes.ok && pagesData.data) ? pagesData.data : [];
        console.log('Pages to save:', pages.length, pages);
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

                // 5. If it has a linked Instagram Business Account, save that too
                if (page.instagram_business_account && page.instagram_business_account.id) {
                    const igName = `IG linked to ${page.name}`;

                    // Delete existing IG connection to avoid duplicates
                    await prisma.externalConnection.deleteMany({
                        where: {
                            userId,
                            provider: 'instagram',
                            name: igName
                        }
                    });

                    const savedIgConnection = await prisma.externalConnection.create({
                        data: {
                            userId,
                            provider: 'instagram',
                            name: igName,
                            credentials: JSON.stringify({
                                accessToken: page.access_token, // IG Graph uses the FB Page Access Token
                                username: page.instagram_business_account.id, // Using the IG ID as username
                                connectedAt: new Date().toISOString()
                            }),
                        },
                    });
                    console.log('Saved Instagram connection:', { id: savedIgConnection.id, name: savedIgConnection.name });
                    igAddedCount++;
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
