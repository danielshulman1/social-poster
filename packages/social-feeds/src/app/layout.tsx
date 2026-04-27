export const dynamic = 'force-dynamic';
import "./globals.css";
import { Suspense } from "react";
import { IBM_Plex_Mono, Inter, Manrope, Space_Grotesk } from "next/font/google";

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

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brandStyle = (process.env.BRAND_STYLE || "easyai").toLowerCase();
  const brandClassName =
    brandStyle === "socialposter" || brandStyle === "default"
      ? ""
      : "brand-easyai";

  return (
    <html lang="en" className={brandClassName}>
      <head>
        <title>Workflow Social Poster</title>
        <meta name="description" content="Automate social media posts with visual workflows" />
      </head>
      <body className={`${manrope.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} ${inter.variable} antialiased`}>
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
