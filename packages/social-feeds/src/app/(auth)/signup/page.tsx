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
import { Check, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeTier, TIER_CONFIG, TIER_ORDER, CONNECTABLE_PROVIDER_SUMMARY } from "@/lib/tiers";

const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z\d]/.test(pwd)) score++;

    const strengths = [
        { score: 0, label: "", color: "" },
        { score: 1, label: "Weak", color: "bg-red-500/20 text-red-400" },
        { score: 2, label: "Fair", color: "bg-orange-500/20 text-orange-400" },
        { score: 3, label: "Good", color: "bg-yellow-500/20 text-yellow-400" },
        { score: 4, label: "Strong", color: "bg-green-500/20 text-green-400" },
        { score: 5, label: "Very Strong", color: "bg-green-500/20 text-green-400" },
    ];
    return strengths[Math.min(score, 5)];
};

export default function SignupPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
    const [selectedTier, setSelectedTier] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    const passwordStrength = getPasswordStrength(password);

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
            const payload = { name, email, password, tier: selectedTier, acceptedTerms: hasAcceptedTerms };
            console.log("[signup] Sending payload:", payload);

            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Registration failed");
            }

            const data = await res.json();

            // Create Stripe checkout session
            const checkoutRes = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: data.user.email,
                    userId: data.user.id,
                    tier: selectedTier
                }),
            });

            if (!checkoutRes.ok) {
                throw new Error("Failed to create checkout session");
            }

            const checkoutData = await checkoutRes.json();

            // Redirect to Stripe checkout
            if (checkoutData.url) {
                window.location.href = checkoutData.url;
            } else {
                throw new Error("No checkout URL received");
            }
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to proceed to payment");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full space-y-3">
            {/* Trial Banner */}
            <div className="rounded-[1.4rem] border border-emerald-500/50 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                    <span className="text-xl">✨</span>
                    <div>
                        <p className="text-sm font-bold text-emerald-900">7-day free trial</p>
                        <p className="text-xs text-emerald-700 mt-1">Full access for 7 days. We'll charge on day 8 unless you cancel.</p>
                    </div>
                </div>
            </div>
            {/* Security & Compliance Features */}
            <div className="space-y-4 rounded-[1.2rem] border border-border/40 bg-card/50 p-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-foreground mb-3">Security & Compliance</p>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-start gap-2">
                            <span className="text-sm">🔐</span>
                            <div>
                                <p className="text-xs font-semibold text-foreground">Bcrypt Encryption</p>
                                <p className="text-xs text-muted-foreground">12-round hashing</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-sm">🔑</span>
                            <div>
                                <p className="text-xs font-semibold text-foreground">JWT Tokens</p>
                                <p className="text-xs text-muted-foreground">7-day secure tokens</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-sm">📋</span>
                            <div>
                                <p className="text-xs font-semibold text-foreground">Audit Logging</p>
                                <p className="text-xs text-muted-foreground">Activity tracking</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-sm">⚡</span>
                            <div>
                                <p className="text-xs font-semibold text-foreground">Rate Limiting</p>
                                <p className="text-xs text-muted-foreground">DDoS protection</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="border-t border-border/30 pt-3">
                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full border border-green-400/30 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-700">
                            ✓ GDPR
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-green-400/30 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-700">
                            ✓ CCPA
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-green-400/30 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-700">
                            ✓ SOC 2
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/30 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-700">
                            🔒 Encrypted
                        </span>
                    </div>
                </div>
            </div>

            <Card className="mx-auto w-full overflow-hidden border-border/80 bg-card/94">
                <CardHeader>
                    <div className="page-kicker w-fit">Plan Selection</div>
                    <CardTitle className="text-4xl">Create your account</CardTitle>
                    <CardDescription>
                        Connect to {CONNECTABLE_PROVIDER_SUMMARY}. Pick a subscription first to unlock account creation.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Choose your tier</Label>
                        <div className="grid gap-3 lg:grid-cols-3">
                            {TIER_ORDER.map((tierId) => {
                                const tier = TIER_CONFIG[tierId];
                                const isSelected = selectedTier === tierId;
                                const isRecommended = tierId === "core";

                                return (
                                    <div key={tierId} className="relative">
                                        {isRecommended && !isSelected && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                                                <span className="inline-block rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-3 py-1 text-xs font-semibold text-white">
                                                    Recommended
                                                </span>
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedTier(tierId)}
                                            className={cn(
                                                "flex h-full w-full flex-col rounded-[1.6rem] border p-5 text-left transition",
                                                isSelected
                                                    ? isRecommended
                                                        ? "border-blue-500/45 bg-[linear-gradient(180deg,rgba(59,130,246,0.08),rgba(240,249,255,0.95))] shadow-[0_18px_40px_rgba(59,130,246,0.15)]"
                                                        : "border-primary/45 bg-[linear-gradient(180deg,rgba(188,92,58,0.08),rgba(255,250,243,0.95))] shadow-[0_18px_40px_rgba(188,92,58,0.12)]"
                                                    : isRecommended
                                                        ? "border-blue-500/20 bg-gradient-to-b from-blue-500/5 to-background/60 hover:border-blue-500/30 hover:shadow-[0_12px_32px_rgba(59,130,246,0.1)]"
                                                        : "border-border/80 bg-background/60 hover:border-primary/30 hover:bg-accent/35"
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="text-2xl font-semibold tracking-[-0.03em]">{tier.name}</div>
                                                    <div className="mt-1 text-base font-medium text-foreground">{tier.priceLabel}</div>
                                                </div>
                                                {isSelected ? (
                                                    <span className={cn(
                                                        "rounded-full px-2 py-1 text-xs font-medium",
                                                        isRecommended
                                                            ? "bg-blue-500/10 text-blue-600"
                                                            : "bg-primary/10 text-primary"
                                                    )}>
                                                        Selected
                                                    </span>
                                                ) : isRecommended ? (
                                                    <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-600">
                                                        Recommended
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">
                                                {tier.description}
                                            </p>
                                            <ul className="mt-5 grid gap-3 text-sm text-muted-foreground">
                                                {tier.features.map((feature) => (
                                                    <li key={feature} className="flex items-start gap-3">
                                                        <span className={cn(
                                                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                                                            isRecommended
                                                                ? "bg-blue-500/20 text-blue-600"
                                                                : "bg-secondary text-secondary-foreground"
                                                        )}>
                                                            <Check className="h-3 w-3" />
                                                        </span>
                                                        <span className="leading-6">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </button>
                                    </div>
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
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {password && (
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${
                                                passwordStrength.score === 1 ? "w-1/5 bg-red-500" :
                                                passwordStrength.score === 2 ? "w-2/5 bg-orange-500" :
                                                passwordStrength.score === 3 ? "w-3/5 bg-yellow-500" :
                                                "w-full bg-green-500"
                                            }`}
                                        />
                                    </div>
                                    <span className={`font-medium ${passwordStrength.color} px-2 py-0.5 rounded`}>
                                        {passwordStrength.label}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <label
                                htmlFor="accepted-terms"
                                className={cn(
                                    "flex cursor-pointer items-start gap-3 rounded-[1.4rem] border px-4 py-3 text-sm leading-6 transition-all",
                                    hasAcceptedTerms
                                        ? "border-green-500/30 bg-green-500/8 shadow-[inset_0_1px_0_rgba(74,222,128,0.2)]"
                                        : "border-border/75 bg-background/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] hover:border-border"
                                )}
                            >
                                <input
                                    id="accepted-terms"
                                    type="checkbox"
                                    checked={hasAcceptedTerms}
                                    onChange={(e) => setHasAcceptedTerms(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-border text-green-600 focus:ring-2 focus:ring-green-500"
                                    required
                                />
                                <span className={cn(
                                    "transition-colors",
                                    hasAcceptedTerms ? "text-foreground" : "text-muted-foreground"
                                )}>
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
                        <Button
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3 text-base shadow-lg"
                            type="submit"
                            disabled={isLoading || !selectedTier || !hasAcceptedTerms}
                        >
                            {isLoading ? "Setting up payment..." : "Start Free Trial (Payment Required)"}
                        </Button>
                        <div className="text-xs text-center text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/login" className="underline underline-offset-4 hover:text-primary font-medium">
                                Login
                            </Link>
                        </div>
                        <div className="text-xs text-center text-muted-foreground/70 pt-1 border-t border-border/30">
                            Payment required • Charged on day 8 • Cancel anytime to avoid charges
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
