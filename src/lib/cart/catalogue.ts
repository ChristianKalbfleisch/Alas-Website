import {
  getProduct,
  isPriced,
  type PricedProduct,
  type Product,
  products,
} from "@/data/products";
import { RITUAL, RITUAL_SAVE_PERCENT } from "@/data/ritual";
import { type CartLine, formatPrice } from "./cart-math";

/** Size families: one control switches between these. Order = small to large. */
export const SALT_HANDLES = ["mikro", "mesos", "megalo"] as const;
export const STICK_HANDLES = ["sticks-5", "sticks-15", "sticks-30"] as const;
export const BOX_HANDLES = ["welcome-box", "family-box"] as const;

/** Flavours exist only as a promise until Shopify carries them: no selector. */
export const FLAVOUR_NOTE = "Blueberry and Lemon, coming soon";

/** The one quiet line of terms the checkout honours. */
export const TERMS_LINE =
  "Free shipping anywhere in the USA · 30-day money-back guarantee";

/** Shown wherever a product waits for the owners' new price. */
export const PRICE_SOON = "New price soon";

/** The Ritual in one line, from its real terms. */
export const RITUAL_LINE = `Two pouches every month, ${formatPrice(RITUAL.price)}. Save ${RITUAL_SAVE_PERCENT}%.`;

/** The Greek size words, from the content facts. */
export const GREEK_MEANING: Record<string, string> = {
  mikro: "small",
  mesos: "middle",
  megalo: "large",
};

/** Plain-language reasons shown as small tags. Each one is true from the catalogue. */
export const REASONS: Record<string, string> = {
  "sticks-5": "Easy first try",
  "welcome-box": "Best for first-timers",
  "family-box": "For the whole house",
};

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
export const boxRange = BOX_HANDLES.map(must);

export function siblingsOf(product: Product): Product[] {
  if (product.kind === "salt") return saltRange;
  if (product.kind === "sticks") return stickRange;
  return [];
}

/** "1 pouch", "2 pouches", "15 sticks"; boxes have no size. */
export function sizeLabel(product: Product): string {
  if (product.pouches) {
    return `${product.pouches} ${product.pouches === 1 ? "pouch" : "pouches"}`;
  }
  if (product.sticks) return `${product.sticks} sticks`;
  return "";
}

export const kindLabel: Record<Product["kind"], string> = {
  salt: "Aegean Mineral Salt",
  sticks: "Hydration Sticks",
  box: "The boxes",
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
  } else if (!kinds.has("salt") && !kinds.has("box")) {
    offers.push({
      kind: "add",
      product: mustPriced("mikro"),
      title: "Add Mikró",
      detail: "One pouch for your morning water",
    });
  }
  return offers;
}

/** Complements only: sticks with a pouch, a pouch with sticks. Boxes have none. */
export function complementsOf(handle: string): PricedProduct[] {
  const product = getProduct(handle);
  if (!product) return [];
  if (product.kind === "salt") return [mustPriced("sticks-5")];
  if (product.kind === "sticks") return [mustPriced("mikro")];
  return [];
}

/** The one box a product page offers, once the boxes have their new prices. */
export function upgradeFor(handle: string): PricedProduct | null {
  const product = getProduct(handle);
  if (!product || handle === "family-box") return null;
  const box = must(handle === "welcome-box" ? "family-box" : "welcome-box");
  return isPriced(box) ? box : null;
}

/** Meet the salt: who you are, and which first step fits. "ritual" is The Ritual. */
export const AUDIENCES = [
  { key: "training", label: "Training", target: "sticks-5" },
  { key: "running", label: "Running", target: "sticks-5" },
  { key: "daily", label: "Daily stack", target: "mikro" },
  { key: "selfcare", label: "Self-care", target: "ritual" },
  { key: "home", label: "Home", target: "ritual" },
] as const;

export const allProducts = products;
