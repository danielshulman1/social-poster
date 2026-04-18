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

    // Read user's Pinterest credentials from DB
    const user = decryptUserSecretFields(await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { pinterestClientId: true, pinterestClientSecret: true },
    }));

    if (!user?.pinterestClientId || !user?.pinterestClientSecret) {
        return NextResponse.json(
            { error: "Pinterest credentials not configured. Go to Settings → API Keys to add your Pinterest Client ID and Secret." },
            { status: 400 }
        );
    }

    const redirectUri = `${baseUrl}/api/auth/pinterest/callback`;
    const state = createOAuthState({ userId: session.user.id, provider: "pinterest" });

    const authUrl = new URL('https://api.pinterest.com/oauth/');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', user.pinterestClientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'boards:read user_accounts:read pins:create pins:read');
    authUrl.searchParams.set('state', state);

    return NextResponse.redirect(authUrl.toString());
}
