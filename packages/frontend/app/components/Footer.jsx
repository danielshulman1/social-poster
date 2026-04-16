'use client';

import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="w-full bg-[#0a0f1a] border-t border-white/10 py-6 px-4 sm:px-6 lg:px-8 mt-auto">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-white/60 text-xs sm:text-sm order-2 sm:order-1">
                        <p>&copy; 2026 Operon. All rights reserved.</p>
                    </div>

                    <div className="flex gap-4 sm:gap-6 order-1 sm:order-2">
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
