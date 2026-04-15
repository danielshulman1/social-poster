"use client";
export const dynamic = "force-dynamic";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!token) {
        return (
            <Card className="mx-auto w-full max-w-xl overflow-hidden border-border/80 bg-card/94">
                <CardHeader>
                    <div className="page-kicker w-fit">Reset Error</div>
                    <CardTitle className="text-4xl">Invalid link</CardTitle>
                    <CardDescription>
                        This password reset link is invalid or has expired.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <div className="text-sm text-center text-muted-foreground w-full">
                        <Link
                            href="/forgot-password"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Request a new reset link
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Something went wrong");
            }

            toast.success("Password reset successfully. Please log in.");
            router.push("/login");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="mx-auto w-full max-w-xl overflow-hidden border-border/80 bg-card/94">
            <CardHeader>
                <div className="page-kicker w-fit">Password Recovery</div>
                <CardTitle className="text-4xl">Choose a new password</CardTitle>
                <CardDescription>Enter your new password below</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="password">New password</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">Confirm new password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button className="w-full" type="submit" disabled={isLoading}>
                        {isLoading ? "Resetting..." : "Reset password"}
                    </Button>
                    <div className="text-sm text-center text-muted-foreground">
                        <Link
                            href="/login"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Back to login
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <Card className="mx-auto w-full max-w-xl overflow-hidden border-border/80 bg-card/94">
                    <CardContent className="p-6">Loading...</CardContent>
                </Card>
            }
        >
            <ResetPasswordForm />
        </Suspense>
    );
}
