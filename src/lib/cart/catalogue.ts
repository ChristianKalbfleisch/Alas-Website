import { TERMS } from "@/data/offers";
import {
  getProduct,
  isPriced,
  type PricedProduct,
  type Product,
  products,
} from "@/data/products";
import type { CartLine } from "./cart-math";

/**
 * The one quiet line of terms under the buy buttons. Shipping and returns join
 * it only once the owners confirm them and the store publishes the policy pages.
 */
export const TERMS_LINE = [TERMS.shipping, TERMS.returns, TERMS.checkout]
  .filter(Boolean)
  .join(" · ");

const mustPriced = (handle: string): PricedProduct => {
  const product = getProduct(handle);
  if (!product) throw new Error(`Unknown product ${handle}`);
  if (!isPriced(product)) throw new Error(`${handle} has no price yet`);
  return product;
};

/** The other pack sizes of the same product, in the same flavour. */
export function siblingsOf(product: Product): Product[] {
  if (product.kind !== "sticks") return [];
  return products
    .filter((p) => p.kind === "sticks" && p.flavour === product.flavour)
    .sort((a, b) => (a.sticks ?? 0) - (b.sticks ?? 0));
}

/** "1 pouch", "15 sticks", "1 pouch + 4 sticks". */
export function sizeLabel(product: Product): string {
  if (product.kind === "set") {
    return `${product.pouches} pouch + ${product.sticks} sticks`;
  }
  if (product.pouches) {
    return `${product.pouches} ${product.pouches === 1 ? "pouch" : "pouches"}`;
  }
  if (product.sticks) return `${product.sticks} sticks`;
  return "";
}

export type AddOn = { product: PricedProduct; title: string; detail: string };

/**
 * One quiet add-on for the drawer, from what is already in the cart: sticks
 * for a cart without them, or a first pouch for a cart of sticks only. Nothing
 * when the cart is empty or holds both.
 */
export function suggestAddOns(lines: CartLine[]): AddOn[] {
  if (lines.length === 0) return [];
  const kinds = new Set(lines.map((l) => getProduct(l.handle)?.kind));
  if (!kinds.has("sticks")) {
    return [
      {
        product: mustPriced("sticks-5"),
        title: "Add 5 sticks",
        detail: "For the gym bag, the desk, or wherever the day takes you",
      },
    ];
  }
  if (!kinds.has("salt")) {
    return [
      {
        product: mustPriced("classic-pouch"),
        title: "Add the Classic Pouch",
        detail: "390 g for your morning water and your table",
      },
    ];
  }
  return [];
}

/** Complements only: sticks with a pouch, a pouch with sticks. Sets have none. */
export function complementsOf(handle: string): PricedProduct[] {
  const product = getProduct(handle);
  if (!product) return [];
  if (product.kind === "salt") return [mustPriced("sticks-5")];
  if (product.kind === "sticks") return [mustPriced("classic-pouch")];
  return [];
}
