'use client';

import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-[#0a0f1a] border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-white/60 text-xs sm:text-sm">
                        <p>&copy; 2026 Operon. All rights reserved.</p>
                    </div>

                    <div className="flex gap-4 sm:gap-6">
                        <Link
                            href="/privacy"
                            className="text-white/60 hover:text-white text-xs sm:text-sm transition-colors"
                        >
                            Privacy Policy
                        </Link>
                        <div className="text-white/20">|</div>
                        <Link
                            href="/terms"
                            className="text-white/60 hover:text-white text-xs sm:text-sm transition-colors"
                        >
                            Terms and Conditions
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
