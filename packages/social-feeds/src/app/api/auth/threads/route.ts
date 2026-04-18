import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl, normalizeEnv } from "@/lib/appUrl";
import { createOAuthState } from "@/lib/oauth-state";
import { getSensitiveActionRedirectPath } from "@/lib/session-security";

export const dynamic = 'force-dynamic';

const isPlaceholder = (value: string) => {
    const normalized = value.toLowerCase();
    return normalized.includes("your_threads_app_id_here")
        || normalized.includes("your_threads_app_secret_here")
        || normalized.includes("your_threads_client_id")
        || normalized.includes("your_threads_client_secret");
};

export async function GET(req: Request) {
    const baseUrl = getAppBaseUrl(req.url) || "http://localhost:3000";

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.redirect(new URL('/login', baseUrl));
    }
    const securityRedirect = getSensitiveActionRedirectPath(session);
    if (securityRedirect) {
        return NextResponse.redirect(new URL(securityRedirect, baseUrl));
    }

    const prismaUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { threadsClientId: true }
    });

    const userClientId = normalizeEnv(prismaUser?.threadsClientId);
    const envClientId = normalizeEnv(process.env.NEXT_PUBLIC_THREADS_CLIENT_ID) || normalizeEnv(process.env.THREADS_CLIENT_ID);
    // User's own client ID takes priority, falls back to environment variable
    const clientId = userClientId || envClientId;

    if (!clientId || isPlaceholder(clientId)) {
        return NextResponse.redirect(`${baseUrl}/settings?error=missing_threads_config`);
    }

    const redirectUri = `${baseUrl}/api/auth/threads/callback`;
    const state = createOAuthState({ userId: session.user.id, provider: "threads" });

    // Threads uses Instagram Graph API OAuth
    // Scopes for Threads: threads_basic, threads_content_publish
    const scope = 'threads_basic,threads_content_publish';

    const authUrl = new URL('https://graph.instagram.com/oauth/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('response_type', 'code');

    const response = NextResponse.redirect(authUrl.toString());
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
}
