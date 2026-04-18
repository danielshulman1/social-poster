"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeTier, TIER_CONFIG, TIER_ORDER } from "@/lib/tiers";

export default function SignupPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
    const [selectedTier, setSelectedTier] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const tierFromQuery = normalizeTier(searchParams.get("plan"));
        if (tierFromQuery) {
            setSelectedTier(tierFromQuery);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTier) {
            toast.error("Choose a plan before creating the account.");
            return;
        }
        if (!hasAcceptedTerms) {
            toast.error("You must agree to the terms before creating an account.");
            return;
        }
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, tier: selectedTier, acceptedTerms: hasAcceptedTerms }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Registration failed");
            }

            toast.success("Account created. Sign in to start onboarding.");
            router.push("/login");
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="mx-auto w-full max-w-5xl overflow-hidden border-border/80 bg-card/94">
            <CardHeader>
                <div className="page-kicker w-fit">Plan Selection</div>
                <CardTitle className="text-4xl">Create your account</CardTitle>
                <CardDescription>
                    Pick a subscription first. Account creation stays locked until one tier is selected.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="grid gap-6">
                    <div className="grid gap-3">
                        <Label>Choose your tier</Label>
                        <div className="grid gap-4 lg:grid-cols-3">
                            {TIER_ORDER.map((tierId) => {
                                const tier = TIER_CONFIG[tierId];
                                const isSelected = selectedTier === tierId;

                                return (
                                    <button
                                        key={tierId}
                                        type="button"
                                        onClick={() => setSelectedTier(tierId)}
                                        className={cn(
                                            "flex h-full flex-col rounded-[1.6rem] border p-5 text-left transition",
                                            isSelected
                                                ? "border-primary/45 bg-[linear-gradient(180deg,rgba(188,92,58,0.08),rgba(255,250,243,0.95))] shadow-[0_18px_40px_rgba(188,92,58,0.12)]"
                                                : "border-border/80 bg-background/60 hover:border-primary/30 hover:bg-accent/35"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="text-2xl font-semibold tracking-[-0.03em]">{tier.name}</div>
                                                <div className="mt-1 text-base font-medium text-foreground">{tier.priceLabel}</div>
                                            </div>
                                            {isSelected ? (
                                                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                                                    Selected
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">
                                            {tier.description}
                                        </p>
                                        <ul className="mt-5 grid gap-3 text-sm text-muted-foreground">
                                            {tier.features.map((feature) => (
                                                <li key={feature} className="flex items-start gap-3">
                                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                                                        <Check className="h-3 w-3" />
                                                    </span>
                                                    <span className="leading-6">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
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
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label
                                htmlFor="accepted-terms"
                                className="flex cursor-pointer items-start gap-3 rounded-[1.4rem] border border-border/75 bg-background/70 px-4 py-3 text-sm leading-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
                            >
                                <input
                                    id="accepted-terms"
                                    type="checkbox"
                                    checked={hasAcceptedTerms}
                                    onChange={(e) => setHasAcceptedTerms(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-ring"
                                    required
                                />
                                <span className="text-muted-foreground">
                                    I agree to the{" "}
                                    <Link href="/terms" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
                                        Terms
                                    </Link>{" "}
                                    and{" "}
                                    <Link href="/privacy" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
                                        Privacy Policy
                                    </Link>
                                    .
                                </span>
                            </label>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button className="w-full" type="submit" disabled={isLoading || !selectedTier || !hasAcceptedTerms}>
                        {isLoading ? "Creating account..." : "Sign Up"}
                    </Button>
                    <div className="text-sm text-center text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                            Login
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}
