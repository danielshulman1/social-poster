import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl } from "@/lib/appUrl";
import { verifyOAuthState } from "@/lib/oauth-state";
export async function GET(req: Request) {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    const baseUrl = getAppBaseUrl(req.url) || 'http://localhost:3000';

    if (error) {
        return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
        return NextResponse.redirect(`${baseUrl}/connections?error=missing_params`);
    }

    const session = await getServerSession(authOptions);
    const verifiedState = verifyOAuthState(state, "linkedin");
    if (!verifiedState || !session?.user?.id || session.user.id !== verifiedState.userId) {
        return NextResponse.redirect(`${baseUrl}/connections?error=invalid_state`);
    }
    const userId = verifiedState.userId;

    // Read user's LinkedIn credentials from DB
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { linkedinClientId: true, linkedinClientSecret: true },
    });

    if (!user?.linkedinClientId || !user?.linkedinClientSecret) {
        return NextResponse.redirect(`${baseUrl}/connections?error=missing_linkedin_config`);
    }

    const redirectUri = `${baseUrl}/api/auth/linkedin/callback`;

    try {
        // Exchange code for access token
        const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                client_id: user.linkedinClientId,
                client_secret: user.linkedinClientSecret,
            }),
        });

        const tokenData = await tokenRes.json();
        if (!tokenRes.ok || !tokenData.access_token) {
            console.error('LinkedIn token exchange failed');
            return NextResponse.redirect(`${baseUrl}/connections?error=token_failed`);
        }

        // Get user profile
        const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
        });
        const profileData = await profileRes.json();

        if (!profileRes.ok || !profileData.sub) {
            console.error('LinkedIn profile fetch failed');
            return NextResponse.redirect(`${baseUrl}/connections?error=linkedin_profile_failed`);
        }

        const displayName = profileData.name || profileData.email || 'LinkedIn Profile';
        const linkedinSub = profileData.sub;

        // Keep a single active LinkedIn connection per user so reconnect replaces stale tokens.
        await prisma.externalConnection.deleteMany({
            where: { userId, provider: 'linkedin' },
        });

        // Add personal profile
        await prisma.externalConnection.create({
            data: {
                userId,
                provider: 'linkedin',
                name: displayName,
                credentials: JSON.stringify({
                    accessToken: tokenData.access_token,
                    expiresIn: tokenData.expires_in,
                    username: `urn:li:person:${linkedinSub}`,
                    connectedAt: new Date().toISOString(),
                }),
            },
        });

        // Try to fetch organization pages the user manages
        try {
            const orgsRes = await fetch('https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&state=APPROVED', {
                headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
            });
            if (orgsRes.ok) {
                const orgsData = await orgsRes.json();
                const elements = orgsData.elements || [];
                
                for (const org of elements) {
                    const orgUrn = org.organization;
                    const orgId = orgUrn.split(':').pop();
                    
                    let orgName = `[Page] ${orgId}`;
                    try {
                        const orgDetailRes = await fetch(`https://api.linkedin.com/v2/organizations/${orgId}`, {
                            headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
                        });
                        if (orgDetailRes.ok) {
                            const orgDetail = await orgDetailRes.json();
                            if (orgDetail.localizedName) {
                                orgName = `[Page] ${orgDetail.localizedName}`;
                            }
                        }
                    } catch {
                        // ignore error fetching organization details
                    }

                    await prisma.externalConnection.create({
                        data: {
                            userId,
                            provider: 'linkedin',
                            name: orgName,
                            credentials: JSON.stringify({
                                accessToken: tokenData.access_token,
                                expiresIn: tokenData.expires_in,
                                username: orgUrn,
                                connectedAt: new Date().toISOString(),
                            }),
                        },
                    });
            }
            }
        } catch (e) {
            console.error('Error processing LinkedIn organizations');
        }

        return NextResponse.redirect(`${baseUrl}/connections?success=linkedin`);
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'linkedin_callback_failed';
        console.error('LinkedIn callback error:', err);
        return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(errorMessage)}`);
    }
}
