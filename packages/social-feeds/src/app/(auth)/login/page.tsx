"use client";
export const dynamic = 'force-dynamic';

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                toast.error("Invalid credentials");
            } else {
                toast.success("Logged in successfully");

                try {
                    const onboardingRes = await fetch("/api/onboarding/status", {
                        cache: "no-store",
                    });

                    if (onboardingRes.ok) {
                        const onboarding = await onboardingRes.json();
                        if (onboarding?.needsOnboarding) {
                            router.push("/onboarding");
                            router.refresh();
                            return;
                        }
                    } else if (onboardingRes.status !== 401) {
                        throw new Error("Failed to check onboarding status");
                    }
                } catch {
                    toast.error("Logged in, but we couldn't check onboarding status.");
                }

                router.push("/");
                router.refresh();
            }
        } catch {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-5xl space-y-6">
            {/* Security & Compliance Features */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Enterprise Security</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="flex flex-col gap-2 rounded-lg border border-border/50 bg-card/50 p-3">
                            <div className="text-lg">🔐</div>
                            <div>
                                <p className="text-xs font-semibold">Bcrypt Encryption</p>
                                <p className="text-xs text-muted-foreground">12-round password hashing</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 rounded-lg border border-border/50 bg-card/50 p-3">
                            <div className="text-lg">🔑</div>
                            <div>
                                <p className="text-xs font-semibold">JWT Tokens</p>
                                <p className="text-xs text-muted-foreground">7-day secure access tokens</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 rounded-lg border border-border/50 bg-card/50 p-3">
                            <div className="text-lg">📋</div>
                            <div>
                                <p className="text-xs font-semibold">Audit Logging</p>
                                <p className="text-xs text-muted-foreground">Full activity tracking</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 rounded-lg border border-border/50 bg-card/50 p-3">
                            <div className="text-lg">⚡</div>
                            <div>
                                <p className="text-xs font-semibold">Rate Limiting</p>
                                <p className="text-xs text-muted-foreground">DDoS & brute force protection</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compliance Badges */}
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Compliance</p>
                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full border border-green-400/30 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-300">
                            <span>✓</span> GDPR
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-green-400/30 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-300">
                            <span>✓</span> CCPA
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-green-400/30 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-300">
                            <span>✓</span> SOC 2
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
                            <span>🔒</span> Encrypted
                        </span>
                    </div>
                </div>
            </div>

            <Card className="mx-auto w-full overflow-hidden border-border/80 bg-card/94">
                <CardHeader>
                    <div className="page-kicker w-fit">Welcome Back</div>
                    <CardTitle className="text-4xl">Sign in</CardTitle>
                    <CardDescription>
                        Enter your email and password to get back into your workflows, channels, and publishing queue.
                    </CardDescription>
                </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <Link
                                href="/forgot-password"
                                className="text-sm underline underline-offset-4 hover:text-primary"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button className="w-full" type="submit" disabled={isLoading}>
                        {isLoading ? "Logging in..." : "Continue to app"}
                        {!isLoading && <ArrowRight className="h-4 w-4" />}
                    </Button>
                    <div className="text-sm text-center text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
                            Sign up
                        </Link>
                    </div>
                </CardFooter>
            </form>
            </Card>
        </div>
    );
}
