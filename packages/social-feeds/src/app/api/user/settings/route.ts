import { NextResponse } from "next/server";
import { getApiAuthContext, unauthorizedJson } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { parseConnectionCredentials } from "@/lib/connection-credentials";
import {
    decryptUserSecretFields,
    encryptUserSecretUpdate,
    getSecretPreview,
} from "@/lib/user-secrets";

export const dynamic = 'force-dynamic';

// GET user settings (including masked API key)
export async function GET(req: Request) {
    const auth = await getApiAuthContext(req);
    if (!auth?.userId) return unauthorizedJson();

    const user = decryptUserSecretFields(await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { name: true, email: true, openaiApiKey: true, googleApiKey: true, linkedinClientId: true, linkedinClientSecret: true, facebookAppId: true, facebookAppSecret: true },
    }));

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
        name: user.name,
        email: user.email,
        hasOpenaiKey: !!user.openaiApiKey,
        openaiKeyPreview: getSecretPreview(user.openaiApiKey, "sk-..."),
        hasGoogleApiKey: !!user.googleApiKey,
        googleApiKeyPreview: getSecretPreview(user.googleApiKey),
        hasLinkedinCredentials: !!(user.linkedinClientId && user.linkedinClientSecret),
        linkedinClientId: user.linkedinClientId || '',
        hasFacebookAppCredentials: !!(user.facebookAppId && user.facebookAppSecret),
        facebookAppId: user.facebookAppId || '',
    });
}

// PUT update user settings
export async function PUT(req: Request) {
    const auth = await getApiAuthContext(req);
    if (!auth?.userId) return unauthorizedJson();

    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.openaiApiKey !== undefined) updateData.openaiApiKey = body.openaiApiKey;
    if (body.googleApiKey !== undefined) updateData.googleApiKey = body.googleApiKey;
    if (body.linkedinClientId !== undefined) updateData.linkedinClientId = body.linkedinClientId;
    if (body.linkedinClientSecret !== undefined) updateData.linkedinClientSecret = body.linkedinClientSecret;
    if (body.facebookAppId !== undefined) updateData.facebookAppId = body.facebookAppId;
    if (body.facebookAppSecret !== undefined) updateData.facebookAppSecret = body.facebookAppSecret;

    const user = decryptUserSecretFields(await prisma.user.update({
        where: { id: auth.userId },
        data: encryptUserSecretUpdate(updateData),
    }));

    return NextResponse.json({
        success: true,
        name: user.name,
        hasOpenaiKey: !!user.openaiApiKey,
    });
}

// POST test LinkedIn connections
export async function POST(req: Request) {
    const auth = await getApiAuthContext(req);
    if (!auth?.userId) return unauthorizedJson();

    const body = await req.json().catch(() => ({}));

    if (body.action === 'test-linkedin') {
        const connections = await prisma.externalConnection.findMany({
            where: { userId: auth.userId, provider: 'linkedin' }
        });

        const results = [];
        for (const conn of connections) {
            const creds = parseConnectionCredentials(conn.credentials);

            const accessToken = typeof creds.accessToken === "string" ? creds.accessToken : "";
            const connectedAt = typeof creds.connectedAt === "string" ? creds.connectedAt : "unknown";
            const expiresIn = typeof creds.expiresIn === "number" || typeof creds.expiresIn === "string"
                ? creds.expiresIn
                : "unknown";

            const result: Record<string, unknown> = {
                connectionId: conn.id,
                name: conn.name,
                createdAt: conn.createdAt,
                connectedAt,
                expiresIn,
                hasAccessToken: Boolean(accessToken),
            };

            if (accessToken) {
                try {
                    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
                        headers: { 'Authorization': `Bearer ${accessToken}` },
                    });
                    result.userinfoTest = {
                        status: profileRes.status,
                        data: await profileRes.json(),
                    };
                } catch (err: any) {
                    result.userinfoTest = { error: err.message };
                }

                try {
                    const meRes = await fetch('https://api.linkedin.com/v2/me', {
                        headers: { 'Authorization': `Bearer ${accessToken}` },
                    });
                    result.meTest = {
                        status: meRes.status,
                        data: await meRes.json(),
                    };
                } catch (err: any) {
                    result.meTest = { error: err.message };
                }
            }
            results.push(result);
        }

        return NextResponse.json({
            totalConnections: connections.length,
            results
        });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
