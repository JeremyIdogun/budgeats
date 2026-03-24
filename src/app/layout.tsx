import type { Metadata, Viewport } from "next";
import { Manrope, Plus_Jakarta_Sans } from "next/font/google";
import { AnalyticsInit } from "@/components/analytics/AnalyticsInit";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-ui",
  weight: ["400", "500", "600", "700", "800"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://loavish.app"),
  title: "Loavish",
  description: "Plan meals, track food spending, and optimize grocery costs.",
  applicationName: "Loavish",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Loavish",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Loavish",
    description: "Plan meals, track food spending, and optimize grocery costs.",
    siteName: "Loavish",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary",
    title: "Loavish",
    description: "Plan meals, track food spending, and optimize grocery costs.",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.svg"],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#1B2C4D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${plusJakarta.variable} font-body bg-cream`}>
        <AnalyticsInit />
        {children}
      </body>
    </html>
  );
}
