import type { Metadata } from "next";
import { Manrope, Plus_Jakarta_Sans } from "next/font/google";
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
    apple: [{ url: "/favicon.svg" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${plusJakarta.variable} font-body bg-cream`}>{children}</body>
    </html>
  );
}
