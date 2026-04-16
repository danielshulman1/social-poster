'use client';

import Link from 'next/link';

export default function Footer() {
    return (
        <footer style={{
            width: '100%',
            backgroundColor: '#0a0f1a',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '24px 16px',
            flexShrink: 0
        }}>
            <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                }}>
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
                        <p style={{ margin: 0 }}>&copy; 2026 Operon. All rights reserved.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                        <Link
                            href="/privacy"
                            style={{ color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none', fontSize: '14px' }}
                            onMouseEnter={(e) => e.target.style.color = 'rgb(255, 255, 255)'}
                            onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.6)'}
                        >
                            Privacy Policy
                        </Link>
                        <div style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</div>
                        <Link
                            href="/terms"
                            style={{ color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none', fontSize: '14px' }}
                            onMouseEnter={(e) => e.target.style.color = 'rgb(255, 255, 255)'}
                            onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.6)'}
                        >
                            Terms and Conditions
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
