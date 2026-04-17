export default function TermsPage() {
    return (
        <div className="page-shell">
            <div className="surface-panel p-8 sm:p-10">
                <div className="max-w-4xl space-y-8">
                    <div className="space-y-3">
                        <div className="page-kicker">Terms and Conditions</div>
                        <h1 className="text-4xl font-semibold tracking-[-0.04em]">Rules for using Social Poster</h1>
                        <p className="text-sm leading-7 text-muted-foreground">
                            These terms govern access to Social Poster and related services. Last updated: April 16, 2026.
                        </p>
                    </div>
                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold">Use of the service</h2>
                        <p className="leading-7 text-muted-foreground">
                            You may use Social Poster only for lawful business or personal publishing activities and in accordance with
                            your subscription tier and connected platform policies.
                        </p>
                    </section>
                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold">Account responsibilities</h2>
                        <p className="leading-7 text-muted-foreground">
                            You are responsible for keeping account credentials secure, maintaining accurate billing details, and ensuring
                            that connected social accounts and published content are authorized and compliant.
                        </p>
                    </section>
                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold">Restrictions</h2>
                        <p className="leading-7 text-muted-foreground">
                            You may not misuse the service, interfere with platform operations, attempt unauthorized access, reverse engineer
                            protected systems, or use the product to distribute unlawful, infringing, or harmful content.
                        </p>
                    </section>
                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold">Warranty and liability</h2>
                        <p className="leading-7 text-muted-foreground">
                            Social Poster is provided on an as-available basis. To the fullest extent permitted by law, the service is
                            provided without warranties of uninterrupted availability, and liability is limited for indirect or consequential damages.
                        </p>
                    </section>
                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold">Changes</h2>
                        <p className="leading-7 text-muted-foreground">
                            We may update these terms from time to time. Continued use of the service after updates take effect means
                            you accept the revised terms.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
