'use client';

export default function PrivacyPage() {
    return (
        <div className="app-page-shell bg-[#050c1b] text-white py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-12">Privacy Policy</h1>

                <div className="space-y-8 text-white/80 leading-relaxed">
                    <section>
                        <p className="text-sm text-white/60">
                            <strong>Effective date:</strong> 30 April 2026
                            <br />
                            <strong>Last updated:</strong> 30 April 2026
                        </p>
                        <p className="mt-6">
                            This Privacy Policy explains how Social Poster ("Social Poster", "we", "us", or "our") collects, uses, stores,
                            shares, retains, and deletes information when you use our application available at{' '}
                            <a
                                href="https://socialposter.easy-ai.co.uk"
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-4"
                            >
                                https://socialposter.easy-ai.co.uk
                            </a>{' '}
                            (the "Service"). It also explains how Social Poster&apos;s use and transfer of information received from Google APIs
                            adheres to the{' '}
                            <a
                                href="https://developers.google.com/terms/api-services-user-data-policy"
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-4"
                            >
                                Google API Services User Data Policy
                            </a>
                            , including the Limited Use requirements.
                        </p>
                        <p>
                            If you have any questions about this policy, contact us at{' '}
                            <a href="mailto:daniel.shulman@gmail.com" className="underline underline-offset-4">
                                daniel.shulman@gmail.com
                            </a>
                            .
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>

                        <h3 className="text-lg font-semibold text-white mb-2">1.1 Account information</h3>
                        <p>
                            When you sign in to Social Poster using Google Sign-In, we receive from Google your basic profile information:
                        </p>
                        <ul className="list-disc list-inside mt-4 space-y-2">
                            <li>Your Google account email address</li>
                            <li>Your name (display name)</li>
                            <li>Your Google account profile picture URL</li>
                            <li>A unique Google account identifier (sub claim)</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-white mt-8 mb-2">1.2 Google user data accessed via Google APIs</h3>
                        <p>
                            With your explicit consent during the Google OAuth consent flow, Social Poster requests access to the following Google
                            scopes:
                        </p>
                        <ul className="list-disc list-inside mt-4 space-y-2">
                            <li>
                                <code className="text-white">https://www.googleapis.com/auth/spreadsheets.readonly</code> — read-only access to
                                Google Sheets you choose to connect.
                            </li>
                            <li>
                                <code className="text-white">https://www.googleapis.com/auth/userinfo.email</code> and{' '}
                                <code className="text-white">https://www.googleapis.com/auth/userinfo.profile</code> — to identify you in our
                                system.
                            </li>
                        </ul>
                        <p className="mt-4">When you connect a specific Google Sheets spreadsheet, we read:</p>
                        <ul className="list-disc list-inside mt-4 space-y-2">
                            <li>The spreadsheet&apos;s metadata (title, sheet/tab names, sharing state).</li>
                            <li>Cell values from the rows and columns you have configured Social Poster to use as content for scheduled social media posts.</li>
                        </ul>
                        <p className="mt-4">
                            We only read spreadsheets you have explicitly selected and connected within Social Poster. We do not list, scan, or
                            read any other files in your Google Drive, and we do not request Google Drive scopes.
                        </p>

                        <h3 className="text-lg font-semibold text-white mt-8 mb-2">1.3 Information you provide directly</h3>
                        <p>You may provide the following information when configuring Social Poster:</p>
                        <ul className="list-disc list-inside mt-4 space-y-2">
                            <li>
                                Connection credentials and metadata for third-party social media platforms you choose to connect (for example,
                                account IDs and OAuth tokens for X/Twitter, LinkedIn, Facebook, Instagram, etc.).
                            </li>
                            <li>Scheduling rules, post templates, and any text or media you create within the app.</li>
                            <li>Support requests, feedback, and other communications you send us.</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-white mt-8 mb-2">1.4 Automatically collected information</h3>
                        <p>When you use the Service we automatically collect a limited set of operational information:</p>
                        <ul className="list-disc list-inside mt-4 space-y-2">
                            <li>Log data (IP address, user agent, request timestamps, and error traces) used for debugging and abuse prevention.</li>
                            <li>Authentication tokens (Google OAuth refresh and access tokens) needed to call Google APIs on your behalf.</li>
                            <li>Cookies or similar local-storage tokens that keep you signed in.</li>
                        </ul>
                        <p className="mt-4">
                            We do <strong>not</strong> use third-party advertising trackers and we do <strong>not</strong> sell personal information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
                        <p>We use the information described above strictly for the following purposes:</p>
                        <ul className="list-disc list-inside mt-4 space-y-2">
                            <li><strong>Authenticate you</strong> and maintain your session within Social Poster.</li>
                            <li>
                                <strong>Read content from spreadsheets you have connected</strong> so that you can schedule and publish that
                                content to social media platforms you have separately authorized.
                            </li>
                            <li><strong>Schedule and publish posts</strong> on your behalf to the social media accounts you have connected.</li>
                            <li>
                                <strong>Operate, maintain, and secure the Service</strong>, including diagnosing errors, preventing abuse, and
                                protecting against unauthorized access.
                            </li>
                            <li>
                                <strong>Communicate with you</strong> about service-related matters (for example, OAuth re-authentication prompts,
                                scheduling failures, and important account notices).
                            </li>
                        </ul>
                        <p className="mt-4">
                            We do <strong>not</strong> use Google user data for advertising, profiling unrelated to the Service, or any purpose outside
                            the features described here.
                        </p>
                        <p className="mt-4">
                            We do <strong>not</strong> use Google user data to develop, improve, or train generalized or non-personalized AI/ML
                            models. Any automated processing of your spreadsheet content (for example, formatting a row into a post draft) happens
                            only in the context of fulfilling your direct, in-app request.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">3. How We Share Information</h2>
                        <p>Social Poster shares information only as described below. We do not sell personal information to third parties.</p>

                        <h3 className="text-lg font-semibold text-white mt-6 mb-2">3.1 Social media platforms you connect</h3>
                        <p>
                            When you instruct Social Poster to publish a post, the post content (and any media you have included) is transmitted
                            to the social media platform you selected (for example, X/Twitter, LinkedIn, Facebook, Instagram). Their use of that
                            content is governed by their own terms and privacy policies.
                        </p>

                        <h3 className="text-lg font-semibold text-white mt-6 mb-2">3.2 Service providers (sub-processors)</h3>
                        <p>
                            We rely on the following categories of trusted service providers to operate Social Poster. These providers process
                            information only on our behalf and under contractual confidentiality and security obligations:
                        </p>
                        <ul className="list-disc list-inside mt-4 space-y-2">
                            <li><strong>Hosting and edge delivery</strong> — Vercel Inc. (application hosting and CDN).</li>
                            <li><strong>Database and authentication infrastructure</strong> — Supabase Inc. (managed PostgreSQL hosting and auth).</li>
                            <li><strong>Email delivery</strong> — transactional email providers used to send service notifications.</li>
                            <li><strong>Error monitoring and logging</strong> — error-tracking and log-aggregation providers used to diagnose issues.</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-white mt-6 mb-2">3.3 Legal and safety</h3>
                        <p>
                            We may disclose information if we are required to do so by law, valid legal process, or to protect the rights,
                            property, or safety of Social Poster, our users, or the public.
                        </p>

                        <h3 className="text-lg font-semibold text-white mt-6 mb-2">3.4 Business transfers</h3>
                        <p>
                            If Social Poster is involved in a merger, acquisition, or sale of assets, your information may be transferred as
                            part of that transaction. We will notify users before any such transfer takes effect.
                        </p>

                        <h3 className="text-lg font-semibold text-white mt-6 mb-2">3.5 Limited Use disclosure (Google API Services)</h3>
                        <p>
                            Social Poster&apos;s use and transfer of information received from Google APIs to any other app will adhere to the{' '}
                            <a
                                href="https://developers.google.com/terms/api-services-user-data-policy"
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-4"
                            >
                                Google API Services User Data Policy
                            </a>
                            , including the <strong>Limited Use</strong> requirements. Specifically, Google user data accessed via Google APIs:
                        </p>
                        <ul className="list-disc list-inside mt-4 space-y-2">
                            <li>Is used <strong>only</strong> to provide or improve user-facing features of Social Poster that are prominent in the application&apos;s user interface.</li>
                            <li>
                                Is <strong>not</strong> transferred to third parties except as necessary to provide or improve those features, to comply with applicable law, or as part of a merger, acquisition, or sale of assets.
                            </li>
                            <li>Is <strong>not</strong> used for serving advertisements.</li>
                            <li>
                                Is <strong>not</strong> read by humans except (a) with your explicit consent for specific messages, (b) when necessary for security purposes such as investigating abuse, (c) to comply with applicable law, or (d) when the data has been aggregated and anonymized for internal operational reporting.
                            </li>
                            <li>Is <strong>not</strong> used to develop, improve, or train generalized or non-personalized AI/ML models.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">4. How We Store and Protect Your Information</h2>
                        <ul className="list-disc list-inside space-y-2">
                            <li>
                                <strong>Encryption in transit.</strong> All traffic between your browser and Social Poster is served over HTTPS/TLS.
                                All calls to Google APIs and to social media platform APIs are made over TLS.
                            </li>
                            <li>
                                <strong>Encryption at rest.</strong> Data stored in our managed database is encrypted at rest by our infrastructure providers (Supabase / underlying cloud provider).
                            </li>
                            <li>
                                <strong>Access controls.</strong> Production database access is restricted to a small number of named administrators using strong authentication. OAuth tokens are stored in restricted-access tables and are never exposed to the client-side application.
                            </li>
                            <li>
                                <strong>Token handling.</strong> Google OAuth refresh and access tokens are stored encrypted in our database and are used only by server-side processes to call Google APIs on your behalf. Access tokens are short-lived and refreshed only when needed to fulfill your scheduled actions.
                            </li>
                            <li>
                                <strong>Network controls.</strong> Database connections require authenticated, TLS-protected sessions. Row-level security is enabled on user-scoped tables so that one user&apos;s data cannot be queried by another.
                            </li>
                            <li>
                                <strong>Operational security.</strong> We monitor application logs for anomalies and errors. We promptly patch and update dependencies.
                            </li>
                        </ul>
                        <p className="mt-4">
                            No system can be 100% secure. If we become aware of a security incident affecting your data, we will notify you and,
                            where required, the relevant data protection authority without undue delay.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">5. Data Retention and Deletion</h2>

                        <h3 className="text-lg font-semibold text-white mb-2">5.1 Retention</h3>
                        <p>
                            We retain your information for as long as your Social Poster account is active and for as long as needed to provide the
                            Service. Specifically:
                        </p>
                        <ul className="list-disc list-inside mt-4 space-y-2">
                            <li>Account profile information and OAuth tokens are retained while your account exists.</li>
                            <li>Scheduled posts and post history are retained until you delete them or your account is deleted.</li>
                            <li>Application logs are retained for up to 90 days for debugging and abuse-prevention purposes.</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-white mt-8 mb-2">5.2 Disconnecting Google Sheets</h3>
                        <p>
                            You can disconnect Google Sheets access at any time from within Social Poster&apos;s Settings page. Disconnecting revokes our
                            stored OAuth tokens for your Google account and immediately stops all further reads of your spreadsheet data. You can
                            additionally revoke Social Poster&apos;s access from your Google Account at{' '}
                            <a
                                href="https://myaccount.google.com/permissions"
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-4"
                            >
                                https://myaccount.google.com/permissions
                            </a>
                            .
                        </p>

                        <h3 className="text-lg font-semibold text-white mt-8 mb-2">5.3 Account deletion and data deletion requests</h3>
                        <p>You can request deletion of your Social Poster account and all associated data at any time by:</p>
                        <ul className="list-disc list-inside mt-4 space-y-2">
                            <li>Using the <strong>Delete my account</strong> option in the in-app Settings page; <strong>or</strong></li>
                            <li>
                                Emailing{' '}
                                <a href="mailto:daniel.shulman@gmail.com" className="underline underline-offset-4">
                                    daniel.shulman@gmail.com
                                </a>{' '}
                                from the email address associated with your account with the subject &quot;Delete my account&quot;.
                            </li>
                        </ul>
                        <p className="mt-4">When you delete your account, we will:</p>
                        <ul className="list-disc list-inside mt-4 space-y-2">
                            <li>Delete your profile information, OAuth tokens, scheduled posts, post history, and any spreadsheet content cached for the purpose of scheduling.</li>
                            <li>
                                Complete deletion within 30 days of the request, except where retention is required by law (for example, audit logs of authentication events may be retained for a limited period for security and legal-compliance purposes).
                            </li>
                        </ul>

                        <h3 className="text-lg font-semibold text-white mt-8 mb-2">5.4 Backups</h3>
                        <p>
                            Routine encrypted backups may temporarily contain a copy of your data after deletion from primary storage. Backup copies are overwritten on a rolling schedule and are not used for any purpose other than disaster recovery.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights</h2>
                        <p>
                            Depending on where you live, you may have the right to:
                        </p>
                        <ul className="list-disc list-inside mt-4 space-y-2">
                            <li>Access the personal information we hold about you.</li>
                            <li>Correct or update inaccurate information.</li>
                            <li>Request deletion of your information (see Section 5.3).</li>
                            <li>Object to or restrict certain processing.</li>
                            <li>Receive a portable copy of your information.</li>
                            <li>Lodge a complaint with a data protection authority.</li>
                        </ul>
                        <p className="mt-4">
                            To exercise any of these rights, email{' '}
                            <a href="mailto:daniel.shulman@gmail.com" className="underline underline-offset-4">
                                daniel.shulman@gmail.com
                            </a>
                            . We will respond within 30 days.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">7. International Data Transfers</h2>
                        <p>
                            Social Poster is operated from the United Kingdom and uses infrastructure providers that may process data in the European
                            Union, United Kingdom, and United States. Where personal data is transferred outside your jurisdiction, we rely on
                            appropriate safeguards (for example, Standard Contractual Clauses) put in place by our service providers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">8. Children</h2>
                        <p>
                            Social Poster is not directed to children under 13, and we do not knowingly collect personal information from children
                            under 13. If you believe a child has provided us with personal information, please contact us and we will delete it.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">9. Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. When we make material changes we will update the &quot;Last updated&quot;
                            date at the top of this page and, where appropriate, notify you in the application or by email. Your continued use of Social
                            Poster after the updated policy takes effect constitutes acceptance of the changes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">10. Contact</h2>
                        <p>If you have any questions, concerns, or requests regarding this Privacy Policy or your data, contact us at:</p>
                        <p className="mt-4">
                            <strong>Email:</strong>{' '}
                            <a href="mailto:daniel.shulman@gmail.com" className="underline underline-offset-4">
                                daniel.shulman@gmail.com
                            </a>
                            <br />
                            <strong>Application:</strong>{' '}
                            <a
                                href="https://socialposter.easy-ai.co.uk"
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-4"
                            >
                                https://socialposter.easy-ai.co.uk
                            </a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
