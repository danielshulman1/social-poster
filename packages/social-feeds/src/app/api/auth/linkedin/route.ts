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

    // Read user's LinkedIn credentials from DB
    const user = decryptUserSecretFields(await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { linkedinClientId: true, linkedinClientSecret: true },
    }));

    if (!user?.linkedinClientId || !user?.linkedinClientSecret) {
        return NextResponse.json({ error: "LinkedIn credentials not configured. Go to Settings → API Keys to add your LinkedIn Client ID and Secret." }, { status: 400 });
    }

    const redirectUri = `${baseUrl}/api/auth/linkedin/callback`;
    const state = createOAuthState({ userId: session.user.id, provider: "linkedin" });
    const scope = 'openid profile w_member_social w_organization_social';

    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', user.linkedinClientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', scope);

    return NextResponse.redirect(authUrl.toString());
}
