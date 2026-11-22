import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { WelcomeBack } from "@/components/cart/welcome-back";
import { FoundingDialog } from "@/components/founding/founding-dialog";
import { Announcement } from "@/components/shell/announcement";
import { Footer } from "@/components/shell/footer";
import { Header } from "@/components/shell/header";
import { TopHeight } from "@/components/shell/top-height";
import { CartProvider } from "@/lib/cart/cart-context";
import "./globals.css";

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:2527";

const description =
  "Greek fleur de sel for your water and your table. Hand-harvested from Mediterranean salt pans and dried by the sun.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "ALAS Salt Co. · Greek Sea Salt",
  description,
  robots: { index: false, follow: false },
  openGraph: {
    title: "ALAS Salt Co. · Greek Sea Salt",
    description,
    images: [
      { url: "/og.jpg", width: 1200, height: 630, alt: "ALAS Salt Co." },
    ],
    type: "website",
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
};

export const viewport: Viewport = {
  themeColor: "#011524",
  width: "device-width",
  initialScale: 1,
};

/**
 * The typeface is Instrument Sans (SIL Open Font License) in a cut made for
 * this site: two weights drawn to sit where a classic grotesque's regular and
 * bold do, with the straight-legged R, Q and $ as the defaults. The Greek
 * words on the Science page come from a small Inter subset (also OFL).
 * Licences sit beside the files; scripts/font/build_alas_cut.py rebuilds them.
 */
const sans = localFont({
  src: [
    {
      path: "./fonts/InstrumentSans-ALAS-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/InstrumentSans-ALAS-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-alas",
  display: "swap",
  adjustFontFallback: "Arial",
});

/** Greek letters only, so it loads on the pages that set Greek and nowhere else. */
const greek = localFont({
  src: "./fonts/Inter-Greek-ALAS-Regular.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-alas-greek",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0370-03FF, U+1F00-1FFF" }],
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The page writes the height of its bar and header on this element as it
    // is read (TopHeight), which the server's copy of it does not carry.
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${sans.variable} ${greek.variable}`}
      suppressHydrationWarning
    >
      <body>
        <CartProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-navy focus:px-5 focus:py-3 focus:text-white"
          >
            Skip to content
          </a>
          <div data-site-top className="sticky top-0 z-40">
            <Announcement />
            <Header />
          </div>
          <TopHeight />
          <div id="main">{children}</div>
          <Footer />
          <CartDrawer />
          <FoundingDialog />
          <WelcomeBack />
        </CartProvider>
      </body>
    </html>
  );
}
