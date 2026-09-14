import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AnnouncementBar } from "@/components/announcement-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

// Inter is the confirmed UI face on the current site. The display face is
// still unresolved — see --font-display in tokens.css.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ALAS Salt Co.",
    template: "%s · ALAS Salt Co.",
  },
  description:
    "100% Aegean mineral sea salt, hand-harvested. Ancient Elements of the Aegean.",
  metadataBase: new URL("https://alassaltco.com"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {/* First focusable element on the page. It sits outside the header
            because the header's backdrop-filter would become the containing
            block for a fixed-position child and pin it inside. */}
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <AnnouncementBar />
        <SiteHeader />
        {/* The one main landmark on the site; pages render sections into it. */}
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
