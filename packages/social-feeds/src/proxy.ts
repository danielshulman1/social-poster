import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";
import {
    sessionNeedsMfaEnrollment,
    sessionNeedsMfaVerification,
} from "@/lib/session-security";

export default withAuth(
    function proxy(req) {
        const token = req.nextauth.token;
        const pathname = req.nextUrl.pathname;
        const isMfaPath = pathname === "/mfa";
        const isSettingsPath = pathname === "/settings";

        if (sessionNeedsMfaEnrollment(token)) {
            if (!isSettingsPath) {
                const target = new URL("/settings", req.url);
                target.searchParams.set("security", "mfa-required");
                return NextResponse.redirect(target);
            }

            return NextResponse.next();
        }

        if (sessionNeedsMfaVerification(token)) {
            if (!isMfaPath) {
                return NextResponse.redirect(new URL("/mfa", req.url));
            }

            return NextResponse.next();
        }

        if (isMfaPath) {
            return NextResponse.redirect(new URL("/", req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|login|signup|pricing|forgot-password|reset-password).*)",
    ],
};
