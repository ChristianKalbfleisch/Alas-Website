import { TERMS } from "@/data/offers";
import {
  getProduct,
  isPriced,
  type PricedProduct,
  type Product,
  products,
} from "@/data/products";
import { RITUAL, ritualCadence } from "@/data/ritual";
import { type CartLine, formatPrice } from "./cart-math";

/** Size families: one control switches between these. Order = small to large. */
export const SALT_HANDLES = ["classic-pouch", "lemon-pouch"] as const;
export const STICK_HANDLES = ["sticks-5", "sticks-15", "sticks-30"] as const;
export const SET_HANDLES = ["discover-set"] as const;

/**
 * The one quiet line of terms under the buy buttons. Shipping and returns join
 * it only once the owners confirm them and the store publishes the policy pages.
 */
export const TERMS_LINE = [TERMS.shipping, TERMS.returns, TERMS.checkout]
  .filter(Boolean)
  .join(" · ");

/** Shown wherever a product waits for the owners' price. */
export const PRICE_SOON = "Price soon";

/** The Ritual in one line, from its real terms. */
export const RITUAL_LINE =
  RITUAL.price === null
    ? `${ritualCadence()}. Opens at launch.`
    : `${ritualCadence()}, ${formatPrice(RITUAL.price)}.`;

const must = (handle: string): Product => {
  const product = getProduct(handle);
  if (!product) throw new Error(`Unknown product ${handle}`);
  return product;
};

const mustPriced = (handle: string): PricedProduct => {
  const product = must(handle);
  if (!isPriced(product)) throw new Error(`${handle} has no price yet`);
  return product;
};

export const saltRange = SALT_HANDLES.map(must);
export const stickRange = STICK_HANDLES.map(mustPriced);
export const setRange = SET_HANDLES.map(must);

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

export const kindLabel: Record<Product["kind"], string> = {
  salt: "Pouch",
  sticks: "Sticks",
  set: "Set",
};

export type AddOn =
  | { kind: "ritual"; title: string; detail: string }
  | { kind: "add"; product: PricedProduct; title: string; detail: string };

/**
 * Up to two quiet add-ons for the drawer, from what is already in the cart:
 * The Ritual for carts with a pouch; then sticks for carts without them, or a
 * first pouch for sticks-only carts. Nothing when the cart is empty.
 */
export function suggestAddOns(lines: CartLine[]): AddOn[] {
  if (lines.length === 0) return [];
  const kinds = new Set(lines.map((l) => getProduct(l.handle)?.kind));
  const offers: AddOn[] = [];
  if (kinds.has("salt")) {
    offers.push({
      kind: "ritual",
      title: "Make it The Ritual",
      detail: RITUAL_LINE,
    });
  }
  if (!kinds.has("sticks")) {
    offers.push({
      kind: "add",
      product: mustPriced("sticks-5"),
      title: "Add 5 sticks",
      detail: "For the gym bag, the desk and the plane",
    });
  } else if (!kinds.has("salt")) {
    offers.push({
      kind: "add",
      product: mustPriced("classic-pouch"),
      title: "Add the Classic Pouch",
      detail: "390 g for your morning water and your table",
    });
  }
  return offers;
}

/** Complements only: sticks with a pouch, a pouch with sticks. Sets have none. */
export function complementsOf(handle: string): PricedProduct[] {
  const product = getProduct(handle);
  if (!product) return [];
  if (product.kind === "salt") return [mustPriced("sticks-5")];
  if (product.kind === "sticks") return [mustPriced("classic-pouch")];
  return [];
}

export const allProducts = products;
