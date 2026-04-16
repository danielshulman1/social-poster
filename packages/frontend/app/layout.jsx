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
    viewport: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={`${sora.variable} ${inter.variable} ${plusJakarta.variable}`}>
            <body className="font-inter antialiased min-h-screen flex flex-col">
                <div className="flex flex-col flex-1">
                    <main className="flex-1">
                        {children}
                    </main>
                </div>
                <Footer />
            </body>
        </html>
    );
}
