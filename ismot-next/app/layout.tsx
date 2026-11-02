import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ismot Hair Oil — Naturally Sourced, Healthier Hair",
  description:
    "Ismot Hair Oil — a 100 ml natural and herbal hair oil for stronger, shinier, healthier hair. Order online in under a minute.",
  applicationName: "Ismot Hair Oil",
  appleWebApp: { title: "Ismot Hair Oil", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#07120a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-forest-deep">{children}</body>
    </html>
  );
}
