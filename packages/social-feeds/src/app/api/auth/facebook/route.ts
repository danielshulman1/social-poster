import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl, normalizeEnv } from "@/lib/appUrl";
import { createOAuthState } from "@/lib/oauth-state";

export const dynamic = 'force-dynamic';

const isPlaceholder = (value: string) => {
    const normalized = value.toLowerCase();
    return normalized.includes("your_fb_app_id_here")
        || normalized.includes("your_fb_app_secret_here")
        || normalized.includes("your_facebook_app_id")
        || normalized.includes("your_facebook_app_secret");
};

export async function GET(req: Request) {
    const baseUrl = getAppBaseUrl(req.url) || "http://localhost:3000";

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.redirect(new URL('/login', baseUrl));
    }

    const prismaUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { facebookAppId: true }
    });

    const userAppId = normalizeEnv(prismaUser?.facebookAppId);
    const envAppId = normalizeEnv(process.env.NEXT_PUBLIC_FACEBOOK_APP_ID) || normalizeEnv(process.env.FACEBOOK_APP_ID);
    // User's own app ID takes priority, falls back to environment variable
    const appId = userAppId || envAppId;

    if (!appId || isPlaceholder(appId)) {
        return NextResponse.redirect(`${baseUrl}/settings?error=missing_facebook_config`);
    }

    const redirectUri = `${baseUrl}/api/auth/facebook/callback`;
    const state = createOAuthState({ userId: session.user.id, provider: "facebook" });

    // Request permissions to view and manage pages
    // Note: instagram_business_account requires instagram_basic to be accessible
    // The instagram_business_* scopes are for Instagram Login flow, NOT Facebook Login
    const scope = 'pages_show_list,pages_manage_posts,pages_manage_metadata,pages_read_engagement,business_management,instagram_basic,instagram_content_publish';

    const authUrl = new URL('https://www.facebook.com/dialog/oauth');
    authUrl.searchParams.set('client_id', appId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('display', 'popup');
    authUrl.searchParams.set('auth_type', 'rerequest');

    const response = NextResponse.redirect(authUrl.toString());
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
}
