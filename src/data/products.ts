/**
 * The catalogue, named the way the packs read (ALAS Salt Co · Greek Fleur de Sel ·
 * Classic or Lemon). Variant ids are the live Shopify store's
 * (alassaltco.myshopify.com), so the cart hands off to Shopify checkout.
 *
 * Prices follow the owners' latest figures. Lemon costs what Classic costs,
 * pouch for pouch and pack for pack. Everything sells as a pre-order
 * (src/data/presale.ts), Classic and Lemon alike, through the same buttons and
 * the same cart. Shopify checkout can only charge for a product that exists in
 * the store: one that is not there yet (variantId null) is pre-ordered in the
 * cart by email, with no payment, until its variant id is filled in here.
 * Shopify charges whatever the store lists, so the store must match.
 *
 * Pack images come from the print artwork and from studio photographs of the
 * packs (public/packs).
 */

import { PACKS } from "./pack-sizes";

export type Flavour = "Classic" | "Lemon";

export type PackImage = {
  src: string;
  /** The same picture, small, for thumbnails. */
  thumb: string;
  width: number;
  height: number;
  alt: string;
  /** A photograph that fills its panel edge to edge. Without it, a cut-out pack that sits inside the panel. */
  cover?: boolean;
};

export type Product = {
  handle: string;
  /** Plain name used on cards. */
  name: string;
  flavour: Flavour;
  subtitle: string;
  kind: "salt" | "sticks" | "set";
  /** USD. Null while the owners settle a price. */
  price: number | null;
  /** Null until the product exists in Shopify: until then its pre-order is taken in the cart by email. */
  variantId: number | null;
  /** Grams of salt, for the size story. */
  grams?: number;
  /** Servings in the pack, from its label. Absent while a pack's label is not final. */
  servings?: number;
  pouches?: number;
  sticks?: number;
  /** The first image is the pack itself. */
  images: PackImage[];
  /** The same pack photographed in larger amounts: two pouches, three pouches. */
  counts?: Record<number, PackImage>;
  description: string;
};

/** A pack image, with the files and size recorded for it (see scripts/sync-packs.py). */
export const pack = (name: string, alt: string): PackImage => {
  const [file, small, width, height] = PACKS[name] ?? [
    `${name}.webp`,
    `${name}.s.webp`,
    1800,
    1800,
  ];
  return {
    src: `/packs/${file}`,
    thumb: `/packs/${small}`,
    width,
    height,
    alt,
  };
};

/**
 * A studio photograph of a pack. It fills its panel, and its thumbnail is the
 * pack's cut-out so that small spots (the cart, the gallery strip) stay clean.
 * Until the photograph exists, the cut-out stands in.
 */
const studio = (name: string, cutout: string, alt: string): PackImage => {
  const small = pack(cutout, alt);
  return PACKS[name]
    ? { ...pack(name, alt), thumb: small.thumb, cover: true }
    : small;
};

const TASTE: Record<Flavour, string> = {
  Classic:
    "Greek fleur de sel, hand-harvested from Mediterranean salt pans and dried by the sun. Sea salt and nothing else, for your water and your table.",
  Lemon:
    "The same Greek fleur de sel with lemon. A bright citrus note over a clean, briny finish.",
};

const key = (flavour: Flavour) => flavour.toLowerCase();

/** Servings in a 390 g Classic pouch, a quarter teaspoon each, from its label. */
export const POUCH_SERVINGS = 260;

function pouch(flavour: Flavour, variantId: number | null): Product {
  const f = key(flavour);
  // Fronts only: the back panels carry label details that are still being settled.
  const images = [
    studio(
      `pouch-${f}-studio`,
      `pouch-${f}-cut`,
      `The ALAS ${flavour} pouch, 390 g of Greek fleur de sel`,
    ),
  ];
  return {
    handle: `${f}-pouch`,
    name: `${flavour} Pouch`,
    flavour,
    // Lemon's label is not final, so its page states no servings.
    subtitle:
      flavour === "Classic"
        ? `390 g · roughly ${POUCH_SERVINGS} servings`
        : "390 g",
    kind: "salt",
    price: 49.99,
    variantId,
    grams: 390,
    servings: flavour === "Classic" ? POUCH_SERVINGS : undefined,
    pouches: 1,
    images,
    counts: {
      2: studio(
        `pouch-${f}-2-studio`,
        `pouch-${f}-2-studio`,
        `Two ALAS ${flavour} pouches, 390 g each`,
      ),
      3: studio(
        `pouch-${f}-3-studio`,
        `pouch-${f}-3-studio`,
        `Three ALAS ${flavour} pouches, 390 g each`,
      ),
    },
    description: TASTE[flavour],
  };
}

const STICK_LINES: Record<number, string> = {
  5: "Tear one into your bottle, wherever you are.",
  15: "For the gym bag, the desk drawer, the carry-on, or wherever the day takes you.",
  30: "Enough to keep a few in every bag you carry.",
};

function sticks(
  flavour: Flavour,
  count: 5 | 15 | 30,
  price: number,
  variantId: number | null,
): Product {
  const f = key(flavour);
  return {
    handle: flavour === "Classic" ? `sticks-${count}` : `${f}-sticks-${count}`,
    name: `${flavour} Sticks`,
    flavour,
    subtitle: `${count} sticks · 2.5 g each`,
    kind: "sticks",
    price,
    variantId,
    sticks: count,
    // The picture shows as many sticks as the pack holds.
    images: [
      studio(
        count === 5 ? `sticks-${f}-studio` : `sticks-${f}-${count}-studio`,
        count === 5 ? `sticks-${f}-studio` : `sticks-${f}-${count}-studio`,
        `${count} ALAS ${flavour} sticks, 2.5 g each`,
      ),
      pack(`stick-${f}`, `One ALAS ${flavour} stick, 2.5 g`),
    ],
    description: STICK_LINES[count],
  };
}

export const products: Product[] = [
  pouch("Classic", 42949692293225),
  pouch("Lemon", null),
  sticks("Classic", 5, 12.99, 42949905350761),
  sticks("Classic", 15, 32.49, 42949916721257),
  sticks("Classic", 30, 64.99, 42949952077929),
  sticks("Lemon", 5, 12.99, null),
  sticks("Lemon", 15, 32.49, null),
  sticks("Lemon", 30, 64.99, null),
  {
    handle: "discovery-set",
    name: "Discovery Set",
    flavour: "Classic",
    subtitle: "1 pouch, 4 sticks and a ritual card",
    kind: "set",
    price: 39,
    variantId: null,
    pouches: 1,
    sticks: 4,
    images: [
      studio(
        "discover-set-studio",
        "discover-set-cut",
        "The ALAS Discovery Set: the Classic pouch with four Classic sticks",
      ),
      studio(
        "pouch-classic-studio",
        "pouch-classic-cut",
        "The ALAS Classic pouch, 390 g of Greek fleur de sel",
      ),
      studio(
        "sticks-classic-studio",
        "sticks-classic-5",
        "ALAS Classic sticks, 2.5 g each",
      ),
    ],
    description:
      "Discover the ALAS ritual: the 390 g Classic pouch, four Classic sticks and a card with three simple rituals. The first 100 sets are hand-numbered, with a note from the founders.",
  },
];

/**
 * A product of today under an earlier spelling of its own name. It is the same
 * thing, so a saved cart keeps it under today's name.
 */
const RESPELLED = new Map([["discover-set", "discovery-set"]]);

/**
 * Names that lead to a product of today in a page address or a shop link:
 * retired products, and earlier spellings. A retired product is something
 * else, so a cart never turns it into today's.
 */
const RENAMED = new Map([
  ["mikro", "classic-pouch"],
  ["mesos", "classic-pouch"],
  ["megalo", "classic-pouch"],
  ["welcome-box", "discovery-set"],
  ["family-box", "discovery-set"],
  ...RESPELLED,
]);

/** A product with a price: it can be pre-ordered. */
export type OrderableProduct = Product & { price: number };

export const canOrder = (product: Product): product is OrderableProduct =>
  product.price !== null;

/** A product the store's checkout can charge for: it has a price and exists in Shopify. */
export type PricedProduct = Product & { price: number; variantId: number };

export const isPriced = (product: Product): product is PricedProduct =>
  product.price !== null && product.variantId !== null;

/**
 * The picture of a product in the amount picked: one, two or three pouches.
 * Past the largest amount photographed, the largest stands in.
 */
export function shotFor(product: Product, qty = 1): PackImage {
  const amounts = Object.keys(product.counts ?? {})
    .map(Number)
    .sort((a, b) => b - a);
  const shown = amounts.find((amount) => amount <= qty);
  return (shown && product.counts?.[shown]) || product.images[0];
}

/**
 * The product sold under exactly this name today. A cart and a pre-order hold
 * only these: a retired name is never turned into today's product there.
 */
export function exactProduct(handle: string): Product | undefined {
  return products.find((p) => p.handle === handle);
}

/** Today's name for a product saved under an earlier spelling; any other name as it is. */
export const todaysName = (handle: string) => RESPELLED.get(handle) ?? handle;

/** The product a name leads to, old names included: for pages and links. */
export function getProduct(handle: string): Product | undefined {
  return exactProduct(RENAMED.get(handle) ?? handle);
}

export const FLAVOURS: readonly Flavour[] = ["Classic", "Lemon"];

/**
 * What one serving costs at the regular price, in words; null for a pack whose
 * label states no servings yet.
 */
export function perServing(product: Product): string | null {
  if (!product.servings || product.price === null) return null;
  const cents = Math.round((product.price / product.servings) * 100);
  return `${cents}\u00a2 each`;
}

/**
 * A product in one or two sentences for a search result or a link preview,
 * where nothing stands above it: it opens with what the pack is. On the page
 * the line above the description already says so.
 */
export function pageDescription(product: Product): string {
  if (product.kind === "sticks")
    return `${product.sticks} sticks, 2.5 g each. ${product.description}`;
  if (product.kind === "salt")
    return `${product.grams} g. ${product.description}`;
  return product.description;
}

/** One line on how each flavour tastes, from the back of its pack. */
export const FLAVOUR_NOTE: Record<Flavour, string> = {
  Classic: "Clean and briny. Sea salt, nothing else.",
  Lemon: "A bright citrus note over a clean, briny finish.",
};

/** The same product in the other flavour, when there is one. */
export function inFlavour(
  product: Product,
  flavour: Flavour,
): Product | undefined {
  if (product.kind === "set") return undefined;
  return products.find(
    (p) =>
      p.kind === product.kind &&
      p.flavour === flavour &&
      p.sticks === product.sticks,
  );
}

export const SHOPIFY_DOMAIN = "alassaltco.myshopify.com";
