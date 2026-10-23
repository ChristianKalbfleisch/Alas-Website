import type { NextConfig } from "next";

/**
 * Redirects from the Framer site's URLs.
 *
 * The live site's sitemap carries 16 URLs. Only `/` survives the rebuild
 * unchanged: products moved from `/salt-co-products/<handle>` to
 * `/products/<handle>`, keeping the same handle. Without these, every
 * product link Google and Instagram hold would 404 on cutover.
 *
 * 308s, not 307s: these moves are permanent and should pass link equity on.
 *
 * TODO(handles): Justin is replacing the Greek in the product handles with
 * readable Latin ones. When he does, each old handle needs its own rule
 * mapping the Greek URL to the new one, because the prefix rule below only
 * rewrites the directory, not the handle. The prefix rule stays as the
 * fallback. Re-query the Storefront API after the rename to get the new
 * handles rather than guessing the transliteration.
 */
const FRAMER_REDIRECTS = [
  // The shop itself.
  { source: "/salt-co-products", destination: "/products", permanent: true },
  // Every product beneath it. Handles are unchanged for now, so one rule
  // covers all eight.
  {
    source: "/salt-co-products/:handle",
    destination: "/products/:handle",
    permanent: true,
  },
  // A pre-launch holding page with no equivalent here.
  { source: "/coming-soon", destination: "/", permanent: true },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Product imagery served from Shopify's CDN.
      { protocol: "https", hostname: "cdn.shopify.com", pathname: "/s/files/**" },
    ],
  },
  async redirects() {
    return FRAMER_REDIRECTS;
  },
};

export default nextConfig;
