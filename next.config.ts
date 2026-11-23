import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // The moment of this build, written into the pages' code and the browser's
  // alike: both start from the offer that was in force then, and the browser
  // moves on to the clock once the page has loaded (src/lib/offer/offer-clock.ts).
  // Set SITE_BUILT_AT by hand (a timestamp in milliseconds) to see what a build
  // made at another moment prints.
  env: { SITE_BUILT_AT: process.env.SITE_BUILT_AT ?? String(Date.now()) },
  devIndicators: false,
  partialPrefetching: true,
  images: {
    formats: ["image/webp"],
    qualities: [60, 75, 85, 95],
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com" }],
  },
  // Old product names and spellings, from links shared before the packs were renamed.
  async redirects() {
    const to = (from: string, handle: string) => ({
      source: `/products/${from}`,
      destination: `/products/${handle}`,
      permanent: false,
    });
    return [
      to("mikro", "classic-pouch"),
      to("mesos", "classic-pouch"),
      to("megalo", "classic-pouch"),
      to("welcome-box", "discovery-set"),
      to("family-box", "discovery-set"),
      // The set's address as it was first written.
      to("discover-set", "discovery-set"),
      // The long read was "Science & History" until the founders put history first.
      {
        source: "/science-and-history",
        destination: "/history-and-science",
        permanent: false,
      },
    ];
  },
  // Preview build: keep it out of search engines until launch.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  turbopack: {
    rules: {
      // Tailwind for global stylesheets; CSS Modules keep their own handling.
      "*.css": {
        condition: { not: { path: "*.module.css" } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
