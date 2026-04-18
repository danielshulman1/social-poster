import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    // Adapter is not needed for credentials provider and can cause issues if not configured correctly for hybrid
    // adapter: PrismaAdapter(prisma), 
    session: {
        strategy: "jwt",
    },
    providers: [
        CredentialsProvider({
            name: "Sign in",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "hello@example.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    // Normalize email to avoid case/whitespace login failures.
                    const email = credentials.email.trim().toLowerCase();

                    const user = await prisma.user.findFirst({
                        where: {
                            email: {
                                equals: email,
                                mode: "insensitive",
                            },
                        },
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            role: true,
                            password: true,
                            mfaEnabled: true,
                        },
                    });

                    if (!user || !user.password) {
                        return null;
                    }

                    const isPasswordValid = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );

                    if (!isPasswordValid) {
                        return null;
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        mfaEnabled: false,
                        mfaRequired: false,
                        mfaVerified: true,
                        mfaEnrollmentRequired: false,
                    };
                } catch (error) {
                    console.error("Authorize error:", error);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        session: ({ session, token }) => {
            if (session?.user) {
                session.user.id = typeof token.id === "string" ? token.id : "";
                session.user.role = typeof token.role === "string" ? token.role : undefined;
                session.user.mfaEnabled = token.mfaEnabled === true;
                session.user.mfaRequired = token.mfaRequired === true;
                session.user.mfaVerified = token.mfaVerified === true;
                session.user.mfaEnrollmentRequired = token.mfaEnrollmentRequired === true;
            }
            return session;
        },
        jwt: ({ token, user, trigger, session }) => {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.mfaEnabled = user.mfaEnabled === true;
                token.mfaRequired = user.mfaRequired === true;
                token.mfaVerified = user.mfaVerified === true;
                token.mfaEnrollmentRequired = user.mfaEnrollmentRequired === true;
            }

            if (trigger === "update") {
                if (typeof session?.mfaVerified === "boolean") {
                    token.mfaVerified = session.mfaVerified;
                }
                if (typeof session?.mfaEnrollmentRequired === "boolean") {
                    token.mfaEnrollmentRequired = session.mfaEnrollmentRequired;
                }
                if (typeof session?.mfaEnabled === "boolean") {
                    token.mfaEnabled = session.mfaEnabled;
                    token.mfaRequired = session.mfaEnabled;
                }
            }
            return token;
        },
    },
    pages: {
        signIn: '/login',
    },
    debug: process.env.NODE_ENV === 'development',
};
