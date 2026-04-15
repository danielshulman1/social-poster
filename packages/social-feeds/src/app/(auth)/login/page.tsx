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
        <Card className="mx-auto w-full max-w-xl overflow-hidden border-border/80 bg-card/94">
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
    );
}
