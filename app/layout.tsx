import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
      <body>{children}</body>
    </html>
  );
}
