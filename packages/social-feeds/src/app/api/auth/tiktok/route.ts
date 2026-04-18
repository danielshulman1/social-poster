import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl } from "@/lib/appUrl";
import { createOAuthState } from "@/lib/oauth-state";
import { decryptUserSecretFields } from "@/lib/user-secrets";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const baseUrl = getAppBaseUrl(req.url) || 'http://localhost:3000';
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.redirect(new URL('/login', baseUrl));
    }

    // Read user's TikTok credentials from DB
    const user = decryptUserSecretFields(await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { tiktokClientId: true, tiktokClientSecret: true },
    }));

    if (!user?.tiktokClientId || !user?.tiktokClientSecret) {
        return NextResponse.json(
            { error: "TikTok credentials not configured. Go to Settings → API Keys to add your TikTok Client ID and Secret." },
            { status: 400 }
        );
    }

    const redirectUri = `${baseUrl}/api/auth/tiktok/callback`;
    const state = createOAuthState({ userId: session.user.id, provider: "tiktok" });

    const authUrl = new URL('https://www.tiktok.com/v1/oauth/authorize');
    authUrl.searchParams.set('client_key', user.tiktokClientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', 'user.info.basic video.list video.upload');

    return NextResponse.redirect(authUrl.toString());
}
