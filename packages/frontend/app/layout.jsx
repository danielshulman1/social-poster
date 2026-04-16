import { Sora, Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Footer from './components/Footer';

const sora = Sora({
    subsets: ['latin'],
    variable: '--font-sora',
    display: 'swap',
});

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-plus-jakarta',
    display: 'swap',
});

export const metadata = {
    title: 'Operon',
    description: 'AI-powered email operations and automation',
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={`${sora.variable} ${inter.variable} ${plusJakarta.variable}`}>
            <body
                className="font-inter antialiased"
                style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}
            >
                <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    {children}
                </main>
                <Footer />
            </body>
        </html>
    );
}
