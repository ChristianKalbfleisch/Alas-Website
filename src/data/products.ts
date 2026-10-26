/**
 * Catalogue snapshot from the live Shopify store (alassaltco.myshopify.com), 2026-10-25.
 * Variant ids are real, so the cart can hand off to Shopify checkout.
 * Product photos are the store's own images (client-supplied renders).
 *
 * Prices follow the owners' repricing, agreed after the site preview: one 390 g
 * pouch $49.99, two pouches $99.98. Megálo and the boxes wait for their new
 * prices (null: shown as "New price soon", not sold here). Shopify still lists
 * the old prices until the owners update the store, and checkout charges those.
 */

export type Flavour = "Regular" | "Blueberry" | "Lemon";

export type Product = {
  handle: string;
  /** Short name used on cards. */
  name: string;
  /** Greek name, where the product has one. */
  greek?: string;
  subtitle: string;
  kind: "salt" | "sticks" | "box";
  /** USD. Null while the owners settle a new price. */
  price: number | null;
  variantId: number;
  /** Grams of salt, for the size story. */
  grams?: number;
  pouches?: number;
  sticks?: number;
  /** Flavours are confirmed by the owners but not yet in Shopify. */
  flavours?: Flavour[];
  images: { src: string; width: number; height: number; alt: string }[];
  description: string;
};

const FLAVOURS: Flavour[] = ["Regular", "Blueberry", "Lemon"];

export const products: Product[] = [
  {
    handle: "mikro",
    name: "Mikró",
    greek: "Μικρό",
    subtitle: "The Starter · 1 pouch",
    kind: "salt",
    price: 49.99,
    variantId: 42949692293225,
    grams: 390,
    pouches: 1,
    flavours: FLAVOURS,
    images: [
      {
        src: "/products/mikro.png",
        width: 2048,
        height: 2048,
        alt: "Mikró, one 390 g pouch of ALAS Aegean Mineral Salt",
      },
    ],
    description:
      "A 390 g pouch of 100% Aegean Mineral Salt. Hand-harvested, dried by sun and wind, nothing added. The way in.",
  },
  {
    handle: "mesos",
    name: "Mésos",
    greek: "Μέσος",
    subtitle: "Athlete's Choice · 2 pouches",
    kind: "salt",
    price: 99.98,
    variantId: 42949716181097,
    grams: 780,
    pouches: 2,
    flavours: FLAVOURS,
    images: [
      {
        src: "/products/mesos.jpg",
        width: 2048,
        height: 2048,
        alt: "Mésos, two pouches of ALAS Aegean Mineral Salt",
      },
    ],
    description:
      "Two 390 g pouches for a daily ritual that never runs dry. Our most versatile size.",
  },
  {
    handle: "megalo",
    name: "Megálo",
    greek: "Μεγάλο",
    subtitle: "Performance Bulk · 4 pouches",
    kind: "salt",
    price: null,
    variantId: 42949735121001,
    grams: 1460,
    pouches: 4,
    flavours: FLAVOURS,
    images: [
      {
        src: "/products/megalo.jpg",
        width: 2048,
        height: 2048,
        alt: "Megálo, four pouches of ALAS Aegean Mineral Salt",
      },
    ],
    description:
      "The full expression of the ritual, for athletes, households and long summers.",
  },
  {
    handle: "sticks-5",
    name: "Hydration Sticks",
    greek: "Στικ ενυδάτωσης",
    subtitle: "5 sticks",
    kind: "sticks",
    price: 9.99,
    variantId: 42949905350761,
    sticks: 5,
    flavours: FLAVOURS,
    images: [
      {
        src: "/products/sticks-5.png",
        width: 1402,
        height: 1122,
        alt: "Five ALAS Hydration Sticks",
      },
    ],
    description:
      "Single-serve sticks of Aegean Mineral Salt for the gym bag, the desk and the plane. One stick, one bottle.",
  },
  {
    handle: "sticks-15",
    name: "Hydration Sticks",
    greek: "Στικ ενυδάτωσης",
    subtitle: "15 sticks",
    kind: "sticks",
    price: 24.99,
    variantId: 42949916721257,
    sticks: 15,
    flavours: FLAVOURS,
    images: [
      {
        src: "/products/sticks-15.png",
        width: 1402,
        height: 1122,
        alt: "Fifteen ALAS Hydration Sticks",
      },
    ],
    description:
      "Fifteen single-serve sticks. Two weeks of training days, or a month of mornings on the move.",
  },
  {
    handle: "sticks-30",
    name: "Hydration Sticks",
    greek: "Στικ ενυδάτωσης",
    subtitle: "30 sticks",
    kind: "sticks",
    price: 49.99,
    variantId: 42949952077929,
    sticks: 30,
    flavours: FLAVOURS,
    images: [
      {
        src: "/products/sticks-30.png",
        width: 1402,
        height: 1122,
        alt: "Thirty ALAS Hydration Sticks",
      },
      {
        src: "/products/sticks-30-c.png",
        width: 1402,
        height: 1122,
        alt: "ALAS Hydration Sticks fanned out",
      },
    ],
    description: "A month of sticks. For people who sweat for a living.",
  },
  {
    handle: "welcome-box",
    name: "Welcome Box",
    subtitle: "Everything to begin the ritual",
    kind: "box",
    price: null,
    variantId: 42949975277673,
    images: [
      {
        src: "/products/welcome.png",
        width: 1339,
        height: 1174,
        alt: "The ALAS Welcome Box with pouch, canister, bottle, spoon and sticks",
      },
      {
        src: "/products/welcome-b.png",
        width: 1536,
        height: 1024,
        alt: "The ALAS Welcome Box contents laid out",
      },
    ],
    description:
      "The ritual, complete: Aegean Mineral Salt with the tools that make it a daily habit, in one navy box.",
  },
  {
    handle: "family-box",
    name: "Family Box",
    subtitle: "Three pouches and the full set of tools",
    kind: "box",
    price: null,
    variantId: 42950083182697,
    images: [
      {
        src: "/products/family.jpg",
        width: 1206,
        height: 1182,
        alt: "The ALAS Family Box",
      },
    ],
    description:
      "One box for the whole house: three pouches of Aegean Mineral Salt and the full set of ritual tools.",
  },
];

export type PricedProduct = Product & { price: number };

export const isPriced = (product: Product): product is PricedProduct =>
  product.price !== null;

export function getProduct(handle: string): Product | undefined {
  return products.find((p) => p.handle === handle);
}

/** Cut-out pouch on transparent background, for floating, stacking and pouring. */
export const POUCH_CUTOUT = {
  src: "/products/pouch-cutout.png",
  width: 843,
  height: 1200,
  alt: "A pouch of ALAS Aegean Mineral Salt",
};

/** Lifestyle shot from the store: a stick poured into a glass of water. */
export const STICK_POUR_PHOTO = {
  src: "/products/sticks-hand.png",
  width: 1122,
  height: 1402,
  alt: "An ALAS Hydration Stick poured into a glass of water",
};

export const SHOPIFY_DOMAIN = "alassaltco.myshopify.com";

/** Shopify's own customer account (orders, addresses): sign-in by email code. */
export const ACCOUNT_URL = `https://${SHOPIFY_DOMAIN}/account`;
