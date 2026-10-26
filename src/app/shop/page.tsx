import type { Metadata } from "next";
import ShopSection from "@/sections/shop";

export const metadata: Metadata = {
  title: "Shop · ALAS Salt Co.",
  description:
    "Aegean Mineral Salt in three sizes, Hydration Sticks and the boxes. Free shipping anywhere in the USA.",
};

/** The whole range on its own page; the same chapter the home page carries. */
export default function ShopPage() {
  return (
    <main className="pt-16 sm:pt-20">
      <ShopSection />
    </main>
  );
}
