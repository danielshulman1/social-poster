import { NextResponse } from "next/server";
import { getApiAuthContext, unauthorizedText } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { assertUserCanConnectProvider, isTierAccessError } from "@/lib/tier-access";

const normalizeAccessToken = (raw: unknown): string => {
    if (typeof raw !== 'string') return '';
    let token = raw.trim();
    if (
        (token.startsWith('"') && token.endsWith('"')) ||
        (token.startsWith("'") && token.endsWith("'"))
    ) {
        token = token.slice(1, -1).trim();
    }
    return token;
};

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const auth = await getApiAuthContext(req);
    if (!auth?.userId) return unauthorizedText();

    const connections = await prisma.externalConnection.findMany({
        where: { userId: auth.userId }
    });

    // Map to store format if needed, or update store to match DB
    // Store expects: { id, platform, name, status, username, accessToken }
    // DB has: { id, provider, name, credentials }

    const formatted = connections.map(c => {
        let details: Record<string, any> = {};
        try {
            details = JSON.parse(c.credentials);
        } catch (e) { }

        return {
            id: c.id,
            platform: c.provider,
            name: c.name,
            status: 'active', // TODO: check token expiry
            username: typeof details.username === "string" ? details.username : undefined,
            pageId: typeof details.pageId === "string" ? details.pageId : undefined,
            connectedAt: typeof details.connectedAt === "string" ? details.connectedAt : undefined,
        };
    });

    return NextResponse.json(formatted);
}

export async function POST(req: Request) {
    try {
        const auth = await getApiAuthContext(req);
        if (!auth?.userId) {
            return unauthorizedText();
        }

        const body = await req.json();
        const { platform, name, accessToken, ...other } = body;
        const normalizedAccessToken = normalizeAccessToken(accessToken);

        if (platform === 'linkedin') {
            return new NextResponse(
                JSON.stringify({
                    error: "LinkedIn connections must be created with 'Connect with LinkedIn'. Manual token entry is not supported.",
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (!platform || !name || !normalizedAccessToken) {
            return new NextResponse("Missing fields", { status: 400 });
        }

        await assertUserCanConnectProvider(auth.userId, platform);

        // --- STRICT INSTAGRAM TOKEN VALIDATION ---
        // Prevent users from manually pasting their IG Business Account ID instead of a Page Access Token
        if (platform === 'instagram') {
            if (normalizedAccessToken.length < 50 || /^\d+$/.test(normalizedAccessToken)) {
                return new NextResponse(
                    JSON.stringify({
                        error: "Invalid token format. Do not paste your Instagram User ID here. " +
                            "Please close this and use the 'Connect with Facebook' button to get a proper Page Access Token."
                    }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
            }

            // IG publishing requires the IG Business Account ID (stored in `username` in this app).
            if (typeof other.username !== 'string' || !/^\d+$/.test(other.username)) {
                return new NextResponse(
                    JSON.stringify({
                        error: "Missing Instagram Business Account ID. Please reconnect using 'Connect with Facebook' so the linked Instagram account is selected automatically."
                    }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }

        const connection = await prisma.externalConnection.create({
            data: {
                userId: auth.userId,
                provider: platform,
                name: name,
                credentials: JSON.stringify({ accessToken: normalizedAccessToken, ...other })
            }
        });

        return NextResponse.json({
            id: connection.id,
            userId: connection.userId,
            provider: connection.provider,
            name: connection.name,
            createdAt: connection.createdAt,
            updatedAt: connection.updatedAt,
        });
    } catch (error: any) {
        if (isTierAccessError(error)) {
            return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
        }
        console.error("Error in POST /api/connections:", error);
        return new NextResponse(error.message || "Internal Server Error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const auth = await getApiAuthContext(req);
    if (!auth?.userId) return unauthorizedText();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return new NextResponse("Missing id", { status: 400 });

    await prisma.externalConnection.delete({
        where: { id, userId: auth.userId }
    });

    return NextResponse.json({ success: true });
}
