import Link from "next/link";

export function AppFooter() {
    return (
        <footer className="border-t border-border/70 bg-[linear-gradient(180deg,rgba(255,250,243,0.78),rgba(246,241,232,0.96))]">
            <div className="mx-auto flex min-h-[88px] w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 text-sm text-muted-foreground sm:px-6 lg:px-8">
                <p>(c) 2026 Social Poster. All rights reserved.</p>
                <div className="flex items-center gap-5">
                    <Link href="/privacy" className="transition hover:text-foreground">
                        Privacy Policy
                    </Link>
                    <Link href="/terms" className="transition hover:text-foreground">
                        Terms and Conditions
                    </Link>
                </div>
            </div>
        </footer>
    );
}
