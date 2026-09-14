import type { Metadata } from "next";

import { Etymology } from "@/components/home/etymology";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";
import { Minerals } from "@/components/home/minerals";
import { OfferBand } from "@/components/home/offer-band";
import { Ritual } from "@/components/home/ritual";
import { getProducts } from "@/lib/shopify";

export const metadata: Metadata = {
  title: "ALAS Salt Co. — Aegean Mineral Salt",
  description:
    "Hand-harvested Aegean mineral sea salt. Ancient Elements of the Aegean.",
};

/**
 * Homepage, following the live site's section order.
 *
 * Three of its sections are deliberately not reproduced. Each is a question
 * for Justin, recorded in CLAUDE.md:
 *
 * 1. "Trusted by Retailers Who Value Craftsmanship" — the section claims the
 *    trust of "leading retailers and wellness partners" and shows no retailer.
 *    An unsubstantiated trust claim with nothing behind it.
 *
 * 2. "Begin The Ritual" value stack — its line items are a Refill Pouch, a
 *    Forever Jar, a Signature Water Bottle and "Daily Ultimate Nutrition" at
 *    $49/$9/$12/$20. ALAS sells none of those products and none of those
 *    prices appears in the catalogue. It is template copy from another brand,
 *    left unedited. Replaced here by the real catalogue.
 *
 * 3. "Explore the Benefits / WHY SALT?" — salt baths, inhalers and scrubs.
 *    ALAS sells salt to consume, not to bathe in, so the section describes a
 *    product the company does not make; one card also claims relief of asthma
 *    and allergy symptoms.
 */
export default async function Home() {
  const products = await getProducts({ sortKey: "PRICE" });

  return (
    <>
      <Hero />
      <Etymology />
      <OfferBand />
      <Minerals />
      <FeaturedProducts products={products} />
      <Ritual products={products} />
    </>
  );
}
