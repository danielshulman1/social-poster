import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";
import {
    buildRateLimitHeaders,
    consumeRateLimit,
    getRequestClientIp,
} from "@/lib/rate-limit";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email || typeof email !== "string") {
            return NextResponse.json({ message: "Email is required" }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const rateLimit = await consumeRateLimit({
            key: `auth:forgot-password:${getRequestClientIp(req)}:${normalizedEmail}`,
            limit: 5,
            windowMs: 15 * 60 * 1000,
        });
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { message: "Too many reset requests. Try again later." },
                { status: 429, headers: buildRateLimitHeaders(rateLimit) }
            );
        }

        // Always return success even if user not found - prevents email enumeration
        const user = await prisma.user.findFirst({
            where: { email: { equals: normalizedEmail, mode: "insensitive" } },
        });

        if (user) {
            const resetToken = crypto.randomBytes(32).toString("hex");
            const hashedResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
            const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            await prisma.user.update({
                where: { id: user.id },
                data: { resetToken: hashedResetToken, resetTokenExpiry },
            });

            await sendPasswordResetEmail(user.email!, resetToken);
        }

        // Always respond with the same message
        return NextResponse.json(
            { message: "If an account with that email exists, a reset link has been sent." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
