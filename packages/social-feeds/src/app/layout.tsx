export const dynamic = 'force-dynamic';
import "./globals.css";
import { Suspense } from "react";
import { IBM_Plex_Mono, Manrope, Space_Grotesk } from "next/font/google";

import NextAuthSessionProvider from "@/components/providers/SessionProvider";
import DataSyncProvider from "@/components/providers/DataSyncProvider";
import { Toaster } from "@/components/ui/sonner";
import { AppFooter } from "@/components/layout/AppFooter";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>Workflow Social Poster</title>
        <meta name="description" content="Automate social media posts with visual workflows" />
      </head>
      <body className={`${manrope.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} antialiased`}>
        <Suspense fallback={null}>
          <NextAuthSessionProvider>
            <DataSyncProvider>
              <div className="app-root-shell">
                <main className="app-main-shell">
                  {children}
                </main>
                <AppFooter />
              </div>
              <Toaster />
            </DataSyncProvider>
          </NextAuthSessionProvider>
        </Suspense>
      </body>
    </html>
  );
}
