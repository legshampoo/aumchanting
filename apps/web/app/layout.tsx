import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://aumchanting.com");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "AUM Chanting",
  description:
    "A live, global OM chanting circle. Join anytime. Chant, listen, or simply be present.",
  openGraph: {
    title: "AUM Chanting",
    description:
      "A live, global OM chanting circle. Join anytime. Chant, listen, or simply be present.",
    siteName: "AUM Chanting",
    type: "website",
    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 630,
        alt: "AUM Chanting — One Sound. One Breath. One Global Circle.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AUM Chanting",
    description:
      "A live, global OM chanting circle. Join anytime. Chant, listen, or simply be present.",
    images: ["/opengraph-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
