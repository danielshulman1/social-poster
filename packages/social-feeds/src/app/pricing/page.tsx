"use client";
export const dynamic = 'force-dynamic';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { TIER_CONFIG, TIER_ORDER } from "@/lib/tiers";

export default function PricingPage() {
    return (
        <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
            <header className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-full border border-border/80 bg-card/85 px-4 py-3 shadow-[0_18px_40px_rgba(25,34,51,0.06)] backdrop-blur">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-background/70">
                        <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Social Poster</div>
                        <div className="text-sm text-foreground">Tiered publishing for service businesses</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/login"><Button variant="ghost">Login</Button></Link>
                    <Link href="/signup"><Button>Sign Up</Button></Link>
                </div>
            </header>

            <main className="page-shell flex flex-col items-center gap-10">
                <section className="page-hero w-full">
                    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
                        <div className="space-y-5">
                            <span className="page-kicker">Subscription Tiers</span>
                            <div className="space-y-3">
                                <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-foreground sm:text-6xl">
                                    Choose the level of publishing support you actually want to run.
                                </h1>
                                <p className="max-w-2xl text-base leading-8 text-muted-foreground">
                                    Every plan controls access inside the app. Users can only connect the platforms, book the support, and publish at the volume their tier allows.
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                            <div className="metric-panel">
                                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Starter</p>
                                <p className="mt-3 text-2xl font-semibold text-foreground">3 platforms</p>
                                <p className="mt-1 text-sm text-muted-foreground">Facebook, Instagram, LinkedIn</p>
                            </div>
                            <div className="metric-panel">
                                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Core</p>
                                <p className="mt-3 text-2xl font-semibold text-foreground">5 posts/week</p>
                                <p className="mt-1 text-sm text-muted-foreground">More weekly volume on the same core channels</p>
                            </div>
                            <div className="metric-panel">
                                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Premium</p>
                                <p className="mt-3 text-2xl font-semibold text-foreground">Daily output</p>
                                <p className="mt-1 text-sm text-muted-foreground">Priority support with wider platform access</p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-8 w-full max-w-6xl md:grid-cols-3">
                    {TIER_ORDER.map((tierId, index) => {
                        const tier = TIER_CONFIG[tierId];
                        const isFeatured = tierId === "core";

                        return (
                            <Card key={tierId} className={isFeatured ? "relative overflow-hidden border-primary/45 bg-[linear-gradient(180deg,rgba(188,92,58,0.08),rgba(255,250,243,0.92))]" : "relative overflow-hidden"}>
                                {isFeatured ? (
                                    <div className="absolute right-5 top-5 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground">
                                        POPULAR
                                    </div>
                                ) : null}
                                <CardHeader>
                                    <CardTitle className="text-3xl">{tier.name}</CardTitle>
                                    <CardDescription>{tier.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-4xl font-semibold tracking-[-0.04em]">{tier.priceLabel}</div>
                                    <ul className="space-y-3 text-sm">
                                        {tier.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-3">
                                                <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                                                    <Check className="h-3.5 w-3.5" />
                                                </span>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Link href={`/signup?plan=${tierId}`} className="w-full">
                                        <Button className="w-full" variant={index === 0 ? "outline" : "default"}>
                                            Choose {tier.name}
                                        </Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
