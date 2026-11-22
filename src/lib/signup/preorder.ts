import { discounted } from "@/data/campaign";
import { KNOWN_OFFERS, type OfferSteps, tierFor } from "@/data/gift";
import {
  canOrder,
  exactProduct,
  isPriced,
  type Product,
} from "@/data/products";
import { formatPrice, MAX_QTY, toCents } from "@/lib/cart/cart-math";

/**
 * A pre-order placed by email: what the store's checkout cannot charge for yet
 * is taken in the cart with an email and no payment. The cart sends the whole
 * pre-order in one request, with a reference of its own. The amounts are worked
 * out here from the catalogue, never taken from the browser, and the same
 * figures go into the customer's note and back to the shopper's screen.
 */

/** The form name a pre-order is posted under; it becomes the tag site-preorder. */
export const PREORDER = "preorder";

/** A product as the cart heads its line: sticks carry their count. */
export const lineName = (product: Product) =>
  product.kind === "sticks"
    ? `${product.name}, ${product.sticks}`
    : product.name;

/**
 * A product where a quantity follows its name, in a list, a confirmation or
 * the store's note: "Lemon Sticks (pack of 5) × 2" cannot be read as five
 * times two.
 */
export const listName = (product: Product) =>
  product.kind === "sticks"
    ? `${product.name} (pack of ${product.sticks})`
    : product.name;

/**
 * The signs a reference is made of: digits and consonants that are not taken
 * for one another, and no vowels, so that it never spells a word.
 */
const REF_SIGNS = "23456789bcdfghjkmnpqrstvwxz";
const REF_LENGTH = 8;
const REF = new RegExp(`^[${REF_SIGNS}]{${REF_LENGTH}}$`);

export const isRef = (value: unknown): value is string =>
  typeof value === "string" && REF.test(value);

/**
 * A reference for one pre-order. The browser makes it once and sends it with
 * every try, so the store can tell a second try from a second pre-order.
 */
export function newRef(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(REF_LENGTH));
  return Array.from(bytes, (b) => REF_SIGNS[b % REF_SIGNS.length]).join("");
}

/** True when a customer's note already holds the pre-order with this reference. */
export const holdsRef = (note: string | null, ref: string) =>
  Boolean(note && new RegExp(`\\bref ${ref}\\b`).test(note));

const PACIFIC = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * The day in US Pacific time, as 2026-11-21. The offer's days are counted on
 * that clock, so a pre-order placed on the evening of 30 November there is
 * dated 30 November.
 */
export function pacificDay(on: Date): string {
  const part = Object.fromEntries(
    PACIFIC.formatToParts(on).map(({ type, value }) => [type, value]),
  );
  return `${part.year}-${part.month}-${part.day}`;
}

export type PreorderLine = {
  handle: string;
  name: string;
  qty: number;
  /** The catalogue price of one, in dollars. */
  each: number;
  /** qty × each. */
  total: number;
};

export type Preorder = {
  /** The reference the browser made for it. */
  ref: string;
  /** The day it was placed, in US Pacific time: 2026-11-21. */
  day: string;
  lines: PreorderLine[];
  /** Every line at its catalogue price. */
  total: number;
  /** The percentage off it is recorded with; 0 for none. */
  percent: number;
  /** The total with that percentage off: what the shopper is told they pay later. */
  toPay: number;
  /** The percentage the cart showed, when that was more than is recorded. */
  asked?: number;
};

/**
 * Why a pre-order is refused. "offer_changed" means the percentage is a step
 * of an offer the site has quoted, but not of the one in force now: the page
 * it came from still shows an offer that has ended. "total_changed" means the
 * figure the cart showed is not the one worked out here: a price has changed
 * since that page was loaded. In every case the page that sent it is out of
 * date, and nothing is written.
 */
export type PreorderError =
  | "invalid_ref"
  | "invalid_lines"
  | "invalid_percent"
  | "offer_changed"
  | "total_changed";

/** A pre-order as the cart sends it; nothing in it is trusted. */
export type SentPreorder = {
  ref?: unknown;
  lines?: unknown;
  percent?: unknown;
  /** The figure the cart showed as "to pay", with that percentage off. */
  toPay?: unknown;
};

/**
 * Checks what a browser sent and prices it from the catalogue. Each line must
 * be a product sold under that name today, with a price, that the store's
 * checkout cannot take yet, 1 to 99 of it; anything else refuses the whole
 * pre-order. The percentage must be 0 or a step of the offer in force, so
 * nothing is recorded at the figures of an offer that has ended, and the figure
 * the cart showed must be the one worked out here. The percentage is still
 * only what the cart showed: `settle` lowers it to what is backed.
 */
export function checkPreorder(
  sent: SentPreorder,
  offer: OfferSteps,
  on: Date,
): { ok: true; order: Preorder } | { ok: false; error: PreorderError } {
  if (!isRef(sent.ref)) return { ok: false, error: "invalid_ref" };
  if (!Array.isArray(sent.lines) || sent.lines.length === 0) {
    return { ok: false, error: "invalid_lines" };
  }
  const asked = new Map<string, number>();
  for (const raw of sent.lines as { handle?: unknown; qty?: unknown }[]) {
    const product =
      typeof raw?.handle === "string" ? exactProduct(raw.handle) : undefined;
    const qty = raw?.qty;
    if (
      !product ||
      !canOrder(product) ||
      isPriced(product) ||
      typeof qty !== "number" ||
      !Number.isInteger(qty) ||
      qty < 1
    ) {
      return { ok: false, error: "invalid_lines" };
    }
    const sum = (asked.get(product.handle) ?? 0) + qty;
    if (sum > MAX_QTY) return { ok: false, error: "invalid_lines" };
    asked.set(product.handle, sum);
  }

  const percent = sent.percent === undefined ? 0 : sent.percent;
  if (typeof percent !== "number") {
    return { ok: false, error: "invalid_percent" };
  }
  if (percent !== 0 && !tierFor(offer, percent)) {
    const quoted = KNOWN_OFFERS.some((known) => tierFor(known, percent));
    return { ok: false, error: quoted ? "offer_changed" : "invalid_percent" };
  }

  let cents = 0;
  const lines = [...asked].map(([handle, qty]): PreorderLine => {
    const product = exactProduct(handle) as Product & { price: number };
    const lineCents = toCents(product.price) * qty;
    cents += lineCents;
    return {
      handle,
      name: listName(product),
      qty,
      each: product.price,
      total: lineCents / 100,
    };
  });
  const total = cents / 100;
  const toPay = discounted(total, percent);
  if (
    typeof sent.toPay !== "number" ||
    toCents(sent.toPay) !== toCents(toPay)
  ) {
    return { ok: false, error: "total_changed" };
  }
  return {
    ok: true,
    order: { ref: sent.ref, day: pacificDay(on), lines, total, percent, toPay },
  };
}

/**
 * The pre-order as it is recorded: with no more off than is backed by the
 * answers sent with it and the customer's record in the store. When the cart
 * showed more, the order remembers that figure too.
 */
export function settle(order: Preorder, backed: number): Preorder {
  if (order.percent <= backed) return order;
  return {
    ...order,
    percent: backed,
    toPay: discounted(order.total, backed),
    asked: order.percent,
  };
}

const off = (percent: number) => (percent ? `${percent}% off` : "no discount");

/**
 * The pre-order as it reads in the customer's note in Shopify: one block,
 * headed by its reference and its day. The last line is what the shopper's
 * confirmation said, and so what the link to pay should charge.
 */
export function preorderNote(order: Preorder): string {
  return [
    `Pre-order by email, ref ${order.ref}, ${order.day} US Pacific time (website)`,
    ...order.lines.map(
      (line) =>
        `${line.name} × ${line.qty}, ${formatPrice(line.each)} each, ${formatPrice(line.total)}`,
    ),
    `Total: ${formatPrice(order.total)}`,
    ...(order.asked
      ? [
          `The cart showed ${off(order.asked)}; the answers sent and this customer's record back ${off(order.percent)}.`,
        ]
      : []),
    `Confirmed to the shopper: ${off(order.percent)}, ${formatPrice(order.toPay)} to pay`,
  ].join("\n");
}

/**
 * Tags for a pre-order, beside site-preorder itself: one per product, one for
 * the day and one for its reference. Shopify Flow runs only for tags new to a
 * customer, so the reference's tag is what lets every pre-order be noticed, a
 * second one on the same day for the same product included.
 */
export function preorderTags(order: Preorder): string[] {
  return [
    ...order.lines.map((line) => `site-${PREORDER}-${line.handle}`),
    `site-${PREORDER}-${order.day.replaceAll("-", "")}`,
    `site-${PREORDER}-ref-${order.ref}`,
  ];
}
