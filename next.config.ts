import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  devIndicators: false,
  partialPrefetching: true,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 85, 95],
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com" }],
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
