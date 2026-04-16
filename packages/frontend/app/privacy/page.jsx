'use client';

export default function PrivacyPage() {
    return (
        <div className="app-page-shell bg-[#050c1b] text-white py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-12">Privacy Policy</h1>

                <div className="space-y-8 text-white/80 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
                        <p>
                            Operon ("we" or "us" or "our") operates the Service. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">2. Information Collection and Use</h2>
                        <p className="mb-4">
                            We collect several different types of information for various purposes to provide and improve our Service to you.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Types of Data Collected:</h3>
                                <ul className="list-disc list-inside space-y-2">
                                    <li><strong>Personal Data:</strong> Email address, First and Last name, Phone number, Address, City, State, Postal code, Cookies and Usage Data</li>
                                    <li><strong>Usage Data:</strong> Browser type and version, IP address, Pages you visit, Time and date of your visit, Time spent on pages, and other diagnostic data</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">3. Use of Data</h2>
                        <p>Operon uses the collected data for various purposes:</p>
                        <ul className="list-disc list-inside mt-4 space-y-2">
                            <li>To provide and maintain our Service</li>
                            <li>To notify you about changes to our Service</li>
                            <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
                            <li>To provide customer care and support</li>
                            <li>To gather analysis or valuable information so that we can improve our Service</li>
                            <li>To monitor the usage of our Service</li>
                            <li>To detect, prevent and address technical issues</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">4. Security of Data</h2>
                        <p>
                            The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">5. Cookies</h2>
                        <p>
                            We use cookies and similar tracking technologies to track activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">6. Service Providers</h2>
                        <p>
                            We may employ third party companies and individuals to facilitate our Service ("Service Providers"), provide the Service on our behalf, perform Service-related services or assist us in analyzing how our Service is used. These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">7. Links to Other Sites</h2>
                        <p>
                            Our Service may contain links to other sites that are not operated by us. If you click on a third party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit. We have no control over and assume no responsibility for the content, privacy policies or practices of any third party sites or services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">8. Changes to This Privacy Policy</h2>
                        <p>
                            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "effective date" at the bottom of this Privacy Policy. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">9. Children's Privacy</h2>
                        <p>
                            Our Service does not address anyone under the age of 18 ("Children"). We do not knowingly collect personally identifiable information from anyone under 18 years of age. If you are a parent or guardian and you are aware that your child has provided us with Personal Data, please contact us immediately.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">10. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at:
                        </p>
                        <p className="mt-4">
                            Email: privacy@operon.ai
                        </p>
                    </section>

                    <section className="pt-8 border-t border-white/20">
                        <p className="text-sm text-white/60">
                            Last updated: April 2026
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
