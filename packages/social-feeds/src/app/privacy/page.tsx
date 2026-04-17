export default function PrivacyPage() {
    return (
        <div className="page-shell">
            <div className="surface-panel p-8 sm:p-10">
                <div className="max-w-4xl space-y-8">
                    <div className="space-y-3">
                        <div className="page-kicker">Privacy Policy</div>
                        <h1 className="text-4xl font-semibold tracking-[-0.04em]">How Social Poster handles your data</h1>
                        <p className="text-sm leading-7 text-muted-foreground">
                            This policy explains what information we collect, how we use it, and how we protect it when you use Social Poster.
                            Last updated: April 16, 2026.
                        </p>
                    </div>
                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold">Information we collect</h2>
                        <p className="leading-7 text-muted-foreground">
                            We may collect account details, subscription information, workflow settings, connected social platform data,
                            usage analytics, and support communications needed to operate the service.
                        </p>
                    </section>
                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold">How we use information</h2>
                        <p className="leading-7 text-muted-foreground">
                            We use collected information to provide publishing features, manage subscriptions, secure accounts,
                            improve product performance, and respond to support requests.
                        </p>
                    </section>
                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold">Sharing and security</h2>
                        <p className="leading-7 text-muted-foreground">
                            We do not sell personal information. Data may be shared with infrastructure, payment, analytics, or
                            integration providers only where needed to deliver the product. We apply reasonable technical and
                            organizational safeguards, but no online system can guarantee absolute security.
                        </p>
                    </section>
                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold">Cookies and retention</h2>
                        <p className="leading-7 text-muted-foreground">
                            Social Poster may use cookies or similar technologies for authentication, preferences, and product analytics.
                            We retain information only as long as necessary for service delivery, compliance, and legitimate business needs.
                        </p>
                    </section>
                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold">Contact</h2>
                        <p className="leading-7 text-muted-foreground">
                            For privacy questions, contact the Social Poster support team through your account support channel.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
