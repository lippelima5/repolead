import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "VibeKit";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  title: `${APP_NAME} - AI SaaS Starter`,
  description:
    "Production-oriented Next.js starter with API-route auth, workspace multi-tenant model, invites and billing.",
  openGraph: {
    title: `${APP_NAME} - AI SaaS Starter`,
    description:
      "Production-oriented Next.js starter with API-route auth, workspace multi-tenant model, invites and billing.",
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
    title: `${APP_NAME} - AI SaaS Starter`,
    description: "Production-oriented Next.js starter with auth, workspaces and billing.",
    images: [`${APP_URL}/og.webp`],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-US">
      <body>
        {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        <Toaster position="top-right" visibleToasts={3} richColors />
      </body>
    </html>
  );
}


