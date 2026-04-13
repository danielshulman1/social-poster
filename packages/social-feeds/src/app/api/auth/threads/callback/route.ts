import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl, normalizeEnv } from "@/lib/appUrl";

export const dynamic = 'force-dynamic';

const isPlaceholder = (value: string) => {
    const normalized = value.toLowerCase();
    return normalized.includes("your_threads_app_id_here")
        || normalized.includes("your_threads_app_secret_here")
        || normalized.includes("your_threads_client_id")
        || normalized.includes("your_threads_client_secret");
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
        select: { threadsClientId: true, threadsClientSecret: true }
    });

    const userClientId = normalizeEnv(prismaUser?.threadsClientId);
    const userClientSecret = normalizeEnv(prismaUser?.threadsClientSecret);
    const envClientId = normalizeEnv(process.env.NEXT_PUBLIC_THREADS_CLIENT_ID) || normalizeEnv(process.env.THREADS_CLIENT_ID);
    const envClientSecret = normalizeEnv(process.env.THREADS_CLIENT_SECRET);

    // User's own credentials take priority, fallback to environment variables
    const clientId = userClientId || envClientId;
    const clientSecret = userClientSecret || envClientSecret;

    if (!clientId || !clientSecret || isPlaceholder(clientId) || isPlaceholder(clientSecret)) {
        return NextResponse.redirect(`${baseUrl}/settings?error=missing_threads_config`);
    }

    const redirectUri = `${baseUrl}/api/auth/threads/callback`;

    try {
        // 1. Exchange code for access token
        const tokenUrl = new URL('https://graph.instagram.com/oauth/access_token');
        tokenUrl.searchParams.set('client_id', clientId);
        tokenUrl.searchParams.set('client_secret', clientSecret);
        tokenUrl.searchParams.set('code', code);
        tokenUrl.searchParams.set('redirect_uri', redirectUri);

        const tokenRes = await fetch(tokenUrl.toString());
        const tokenData = await tokenRes.json();

        if (!tokenRes.ok || !tokenData.access_token) {
            console.error('Threads token error:', tokenData);
            const detail = tokenData?.error?.message || tokenData?.error_description || '';
            return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(`token_failed:${detail}`)}`);
        }

        const accessToken = tokenData.access_token;
        const userId_ig = tokenData.user_id;

        // 2. Get user info (username and Threads profile)
        const userInfoUrl = new URL('https://graph.instagram.com/me');
        userInfoUrl.searchParams.set('fields', 'id,username,name');
        userInfoUrl.searchParams.set('access_token', accessToken);

        const userInfoRes = await fetch(userInfoUrl.toString());
        const userInfo = await userInfoRes.json();

        if (!userInfoRes.ok || !userInfo.id) {
            console.error('Failed to fetch user info:', userInfo);
            return NextResponse.redirect(`${baseUrl}/connections?error=failed_to_fetch_user_info`);
        }

        const displayName = userInfo.username ? `@${userInfo.username} (Threads)` : `Threads Account`;

        // Delete existing Threads connection if it exists to avoid duplicates
        await prisma.externalConnection.deleteMany({
            where: {
                userId,
                provider: 'threads'
            }
        });

        // Save Threads connection
        const savedConnection = await prisma.externalConnection.create({
            data: {
                userId,
                provider: 'threads',
                name: displayName,
                credentials: JSON.stringify({
                    accessToken: accessToken,
                    userId: userInfo.id,
                    username: userInfo.username,
                    displayName: userInfo.name,
                    connectedAt: new Date().toISOString()
                }),
            },
        });

        console.log('Saved Threads connection:', { id: savedConnection.id, name: savedConnection.name });

        const redirectUrl = `${baseUrl}/connections?success=threads&added=1`;
        return NextResponse.redirect(redirectUrl);
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'threads_callback_failed';
        console.error('Threads callback error:', err);
        return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(errorMessage)}`);
    }
}
