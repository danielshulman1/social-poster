export const dynamic = 'force-dynamic';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
            <div className="absolute inset-0 soft-grid opacity-30" />
            <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-stretch gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <section className="hidden overflow-hidden rounded-[2.5rem] border border-border/70 bg-[linear-gradient(155deg,rgba(25,34,51,0.96),rgba(33,47,70,0.9))] p-8 text-white shadow-[0_28px_90px_rgba(25,34,51,0.25)] lg:flex lg:flex-col lg:justify-between">
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
                    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                        <div className="rounded-[1.8rem] border border-white/10 bg-white/6 p-4">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Plans</p>
                            <p className="mt-3 text-2xl font-semibold">Starter to Premium</p>
                            <p className="mt-1 text-sm text-white/65">Access stays aligned to what each user has actually bought.</p>
                        </div>
                        <div className="rounded-[1.8rem] border border-white/10 bg-white/6 p-4">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Channels</p>
                            <p className="mt-3 text-2xl font-semibold">Connected once</p>
                            <p className="mt-1 text-sm text-white/65">OAuth, workflows, and publishing settings live in one surface.</p>
                        </div>
                        <div className="rounded-[1.8rem] border border-white/10 bg-white/6 p-4">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Voice</p>
                            <p className="mt-3 text-2xl font-semibold">Persona-driven</p>
                            <p className="mt-1 text-sm text-white/65">Keep outputs consistent with the tone your audience already knows.</p>
                        </div>
                    </div>
                </section>
                <section className="flex items-center justify-center">
                    <div className="w-full max-w-5xl space-y-6">
                        {children}
                    </div>
                </section>
            </div>
        </div>
    );
}
