import { PRESALE } from "@/data/presale";
import {
  canOrder,
  exactProduct,
  type Flavour,
  isPriced,
  SHOPIFY_DOMAIN,
  todaysName,
} from "@/data/products";

export type CartLine = {
  handle: string;
  flavour?: Flavour;
  qty: number;
};

/** The most of one product in a cart, and so in a pre-order by email. */
export const MAX_QTY = 99;

/** Money is summed in integer cents so $49.99 + $9.99 never drifts. */
export const toCents = (value: number) => Math.round(value * 100);

/**
 * What so many of one thing come to, in dollars: the price in whole cents times
 * the quantity. A page that shows a price for an amount works it out here
 * before any percentage is taken off, as the cart does, so the two never
 * differ by a cent.
 */
export const priceTimes = (price: number, qty: number) =>
  (toCents(price) * qty) / 100;

/**
 * Anything sold today with a price can sit in the cart, whether or not the
 * store's checkout can charge for it yet: the cart sends what it can to
 * checkout and takes the rest as a pre-order by email. A name that is no
 * longer sold is not turned into today's product: it is not put in.
 */
export const sellable = (handle: string) => {
  const product = exactProduct(handle);
  return Boolean(product && canOrder(product));
};

/**
 * A saved cart as it may be used: one line per product sold today, 1 to 99 of
 * it. A product saved under an earlier spelling of its name is kept under
 * today's. Anything else in it is dropped.
 */
export function savedCart(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const merged = new Map<string, number>();
  for (const l of raw as { handle?: unknown; qty?: unknown }[]) {
    if (typeof l?.handle !== "string") continue;
    const handle = todaysName(l.handle);
    if (
      !sellable(handle) ||
      typeof l.qty !== "number" ||
      !Number.isInteger(l.qty) ||
      l.qty <= 0
    )
      continue;
    merged.set(handle, Math.min(MAX_QTY, (merged.get(handle) ?? 0) + l.qty));
  }
  return [...merged].map(([handle, qty]) => ({ handle, qty }));
}

/** A product the store's checkout can charge for; anything else is never sent there. */
const pricedProduct = (handle: string) => {
  const product = exactProduct(handle);
  return product && isPriced(product) ? product : undefined;
};

/** What the store's checkout will charge for, before any discount. */
export function cartSubtotal(lines: CartLine[]): number {
  const cents = lines.reduce((sum, line) => {
    const product = pricedProduct(line.handle);
    return product ? sum + toCents(product.price) * line.qty : sum;
  }, 0);
  return cents / 100;
}

/**
 * The lines the store's checkout cannot take yet: products with a price that
 * are not in Shopify. They are pre-ordered in the cart by email instead.
 */
export function emailLines(lines: CartLine[]): CartLine[] {
  return lines.filter((line) => {
    const product = exactProduct(line.handle);
    return Boolean(product && canOrder(product) && !isPriced(product));
  });
}

/** What a set of lines comes to at their prices, whether or not checkout can take them. */
export function linesTotal(lines: CartLine[]): number {
  const cents = lines.reduce((sum, line) => {
    const product = exactProduct(line.handle);
    return product && canOrder(product)
      ? sum + toCents(product.price) * line.qty
      : sum;
  }, 0);
  return cents / 100;
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((n, line) => n + line.qty, 0);
}

/** One entry per Shopify variant: flavours are not in Shopify yet, so lines of one size merge. */
export function checkoutItems(
  lines: CartLine[],
): { variantId: number; qty: number }[] {
  const merged = new Map<number, number>();
  for (const line of lines) {
    const product = pricedProduct(line.handle);
    if (!product || line.qty <= 0) continue;
    merged.set(
      product.variantId,
      (merged.get(product.variantId) ?? 0) + line.qty,
    );
  }
  return [...merged].map(([variantId, qty]) => ({ variantId, qty }));
}

export type CheckoutExtras = {
  /** A claimed gift's code, so nobody has to type it. */
  discount?: string | null;
  /** The email the visitor already gave, filled in at checkout. */
  email?: string | null;
};

/**
 * What a checkout link tells the store about the order: Shopify shows it in
 * the Notes section of the order's page, so a pre-order made on this site can
 * be told from an order placed on the store's own pages.
 */
export const ORDER_MARK = { key: "Website", value: "Pre-order" };

/**
 * Shopify cart permalink: no API token needed, lands on the store's checkout.
 * With nothing to buy it stays on this site: the store's own pages are the old one.
 */
export function buildCheckoutUrl(
  lines: CartLine[],
  extras: CheckoutExtras = {},
): string {
  const items = checkoutItems(lines)
    .map(({ variantId, qty }) => `${variantId}:${qty}`)
    .join(",");
  if (!items) return "/#shop";
  const params = new URLSearchParams();
  if (extras.discount) params.set("discount", extras.discount);
  if (extras.email) params.set("checkout[email]", extras.email);
  if (PRESALE.on) params.set(`attributes[${ORDER_MARK.key}]`, ORDER_MARK.value);
  const query = params.toString();
  return `https://${SHOPIFY_DOMAIN}/cart/${items}${query ? `?${query}` : ""}`;
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const formatPrice = (value: number) => usd.format(value);
