import type { Metadata, Viewport } from "next";
import { DM_Mono, EB_Garamond, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { Loader } from "@/components/chrome/loader";
import { Nav } from "@/components/chrome/nav";
import { GiftLauncher } from "@/components/gift/gift-launcher";
import { CartProvider } from "@/lib/cart/cart-context";
import { SmoothScroll } from "@/lib/motion/smooth-scroll";
import "./globals.css";

const serif = EB_Garamond({
  subsets: ["latin", "greek", "greek-ext"],
  style: ["normal", "italic"],
  variable: "--font-garamond",
  display: "swap",
});

const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3100";

const description =
  "Hand-harvested Aegean sea salt from Greece. Sun-dried, unrefined, nothing added. A daily ritual for hydration.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "ALAS Salt Co. · Aegean Mineral Salt",
  description,
  robots: { index: false, follow: false },
  openGraph: {
    title: "ALAS Salt Co. · Aegean Mineral Salt",
    description,
    images: [
      { url: "/og.jpg", width: 1200, height: 630, alt: "ALAS Salt Co." },
    ],
    type: "website",
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
};

export const viewport: Viewport = {
  themeColor: "#faf8f4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        <CartProvider>
          <SmoothScroll>
            <Loader />
            <Nav />
            {children}
            <CartDrawer />
            <GiftLauncher />
          </SmoothScroll>
        </CartProvider>
      </body>
    </html>
  );
}
