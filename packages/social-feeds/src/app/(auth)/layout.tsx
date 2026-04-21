export const dynamic = 'force-dynamic';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="app-page-shell relative overflow-hidden px-4 py-0 sm:px-6 lg:px-0 min-h-screen">
            <div className="absolute inset-0 soft-grid opacity-30" />
            <div className="relative mx-auto grid min-h-screen max-w-full items-stretch gap-0 lg:gap-6 lg:grid-cols-[1fr_1.3fr] lg:px-8 lg:py-0">
                <section className="hidden overflow-hidden rounded-r-[2.5rem] border border-r-0 border-border/70 bg-[linear-gradient(155deg,rgba(25,34,51,0.96),rgba(33,47,70,0.9))] p-8 text-white shadow-[0_28px_90px_rgba(25,34,51,0.25)] lg:flex lg:flex-col lg:justify-between">
                    <div className="space-y-6 flex flex-col h-full">
                        <div className="space-y-6">
                            <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                                Social Poster
                            </span>
                            <div className="space-y-4">
                                <h1 className="max-w-lg text-5xl font-semibold leading-[1.02] tracking-[-0.05em]">
                                    Build a publishing engine that feels deliberate, not improvised.
                                </h1>
                                <p className="max-w-md text-sm leading-7 text-white/72">
                                    Pick a plan, lock in the right channels, and move from onboarding to live workflows without bouncing between tools.
                                </p>
                            </div>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                            <div className="w-full h-48 rounded-[1.6rem] border border-white/10 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-5xl mb-3">📱</div>
                                    <p className="text-white/60 text-sm">Manage all platforms from one dashboard</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3 mt-auto">
                            <div className="rounded-[1.2rem] border border-white/10 bg-white/6 p-3 backdrop-blur-sm">
                                <p className="text-xs uppercase tracking-[0.15em] text-white/55 font-medium">Why Choose Us</p>
                                <div className="mt-2 space-y-1.5">
                                    <div className="flex items-start gap-2">
                                        <span className="text-white/60">⚡</span>
                                        <span className="text-xs text-white/70">Fast setup, live in minutes</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-white/60">🎯</span>
                                        <span className="text-xs text-white/70">All 13+ platforms included</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-white/60">👥</span>
                                        <span className="text-xs text-white/70">Built for team collaboration</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-white/60">📊</span>
                                        <span className="text-xs text-white/70">Analytics & insights included</span>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-[1.2rem] border border-emerald-500/40 bg-emerald-500/15 p-3 backdrop-blur-sm">
                                <p className="text-xs uppercase tracking-[0.15em] text-emerald-300 font-bold">⚡ 7-Day Trial</p>
                                <p className="text-sm text-emerald-100 mt-2 font-medium">Free full access</p>
                                <p className="text-xs text-emerald-200/80 mt-1">Charges on day 8. Cancel anytime to avoid charges.</p>
                            </div>
                            <div className="rounded-[1.2rem] border border-white/10 bg-white/6 p-3 backdrop-blur-sm">
                                <p className="text-xs uppercase tracking-[0.15em] text-white/55 font-medium">Why Social Poster</p>
                                <div className="mt-2 space-y-1.5">
                                    <div className="flex items-start gap-2">
                                        <span className="text-blue-400 text-lg leading-none">→</span>
                                        <span className="text-xs text-white/70">Save hours scheduling across 13+ platforms</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-blue-400 text-lg leading-none">→</span>
                                        <span className="text-xs text-white/70">Maintain consistent brand voice everywhere</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-blue-400 text-lg leading-none">→</span>
                                        <span className="text-xs text-white/70">Collaborate seamlessly with your team</span>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-[1.2rem] border border-white/10 bg-white/6 p-3 backdrop-blur-sm">
                                <p className="text-xs uppercase tracking-[0.15em] text-white/55 font-medium">What You Get</p>
                                <div className="mt-2 space-y-1.5">
                                    <div className="flex items-start gap-2">
                                        <span className="text-green-400 text-sm">✓</span>
                                        <span className="text-xs text-white/70">Unified scheduling dashboard</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-green-400 text-sm">✓</span>
                                        <span className="text-xs text-white/70">AI-powered content assistance</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-green-400 text-sm">✓</span>
                                        <span className="text-xs text-white/70">Team workflows & permissions</span>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-[1.2rem] border border-white/10 bg-white/6 p-3 backdrop-blur-sm">
                                <p className="text-xs uppercase tracking-[0.15em] text-white/55 font-medium">Built For Teams</p>
                                <div className="mt-2 space-y-1.5">
                                    <div className="flex items-start gap-2">
                                        <span className="text-white/60">•</span>
                                        <span className="text-xs text-white/70">Manage all channels from one place</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-white/60">•</span>
                                        <span className="text-xs text-white/70">Enterprise-grade security & compliance</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-white/60">•</span>
                                        <span className="text-xs text-white/70">Built by social media professionals</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="flex items-center justify-center rounded-l-[2.5rem] border border-l-0 border-border/70 bg-background/40 lg:rounded-l-none lg:bg-background">
                    <div className="w-full max-w-3xl space-y-4 px-4 py-6 sm:px-6 lg:px-12">
                        {children}
                    </div>
                </section>
            </div>
        </div>
    );
}
