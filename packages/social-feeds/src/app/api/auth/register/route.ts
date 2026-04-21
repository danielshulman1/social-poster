import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeTier } from "@/lib/tiers";
import bcrypt from "bcryptjs";
import {
    buildRateLimitHeaders,
    consumeRateLimit,
    getRequestClientIp,
} from "@/lib/rate-limit";

export async function POST(req: Request) {
    try {
        const { email, password, name, tier, selectedTier, acceptedTerms } = await req.json();
        const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
        const normalizedName = typeof name === "string" ? name.trim() : "";
        const requestedTier = selectedTier ?? tier;
        const chosenTier = normalizeTier(requestedTier);
        const hasAcceptedTerms = acceptedTerms === true;

        console.log("[register] Input:", { email, name, tier, selectedTier, acceptedTerms, requestedTier, chosenTier });

        if (!normalizedEmail || !password) {
            return NextResponse.json(
                { message: "Missing email or password" },
                { status: 400 }
            );
        }

        const rateLimit = await consumeRateLimit({
            key: `auth:register:${getRequestClientIp(req)}:${normalizedEmail || "unknown"}`,
            limit: 5,
            windowMs: 10 * 60 * 1000,
        });
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { message: "Too many signup attempts. Try again shortly." },
                { status: 429, headers: buildRateLimitHeaders(rateLimit) }
            );
        }

        if (!chosenTier) {
            return NextResponse.json(
                { message: "Select a valid tier before creating an account" },
                { status: 400 }
            );
        }

        if (!hasAcceptedTerms) {
            return NextResponse.json(
                { message: "You must agree to the terms before creating an account" },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: { id: true },
        });

        if (existingUser) {
            return NextResponse.json(
                { message: "User already exists" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.$transaction(async (tx) => {
            const createdUser = await tx.user.create({
                data: {
                    email: normalizedEmail,
                    name: normalizedName || null,
                    password: hashedPassword,
                },
                select: {
                    id: true,
                    email: true,
                },
            });

            await tx.subscription.upsert({
                where: { userId: createdUser.id },
                update: {
                    status: "incomplete",
                    priceId: chosenTier,
                    currentPeriodEnd: null,
                },
                create: {
                    userId: createdUser.id,
                    status: "incomplete",
                    priceId: chosenTier,
                    currentPeriodEnd: null,
                },
            });

            return createdUser;
        });

        return NextResponse.json(
            {
                message: "User created",
                tier: chosenTier,
                user: { id: user.id, email: user.email },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
