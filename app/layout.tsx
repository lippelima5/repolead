import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { GoogleAnalytics } from "@next/third-parties/google";
import { getServerUserPreferences } from "@/lib/user-preferences.server";
import { localeToHtmlLang } from "@/lib/user-preferences";
import "./globals.css";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "RepoLead";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  title: `${APP_NAME} - API-first Lead Operations`,
  description: "Canonical lead repository with capture, dedupe, timeline, deliveries and workspace isolation.",
  openGraph: {
    title: `${APP_NAME} - API-first Lead Operations`,
    description: "Canonical lead repository with capture, dedupe, timeline, deliveries and workspace isolation.",
    url: APP_URL,
    siteName: APP_NAME,
    images: [
      {
        url: `${APP_URL}/og.webp`,
        width: 1200,
        height: 630,
        alt: `${APP_NAME} cover`,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} - API-first Lead Operations`,
    description: "Canonical lead repository with capture, dedupe, timeline, deliveries and workspace isolation.",
    images: [`${APP_URL}/og.webp`],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { locale, theme } = await getServerUserPreferences();
  const initialThemeClass = theme === "dark" || theme === "light" ? theme : 'dark';

  return (
    <html lang={localeToHtmlLang(locale)} className={initialThemeClass} suppressHydrationWarning>
      <body>
        {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        <Toaster position="top-right" visibleToasts={3} richColors />
      </body>
    </html>
  );
}


