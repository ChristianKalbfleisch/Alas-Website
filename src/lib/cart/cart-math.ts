import {
  canOrder,
  type Flavour,
  getProduct,
  isPriced,
  SHOPIFY_DOMAIN,
} from "@/data/products";

export type CartLine = {
  handle: string;
  flavour?: Flavour;
  qty: number;
};

/** Money is summed in integer cents so $49.99 + $9.99 never drifts. */
const toCents = (value: number) => Math.round(value * 100);

/** A product the store's checkout can charge for; anything else is never sent there. */
const pricedProduct = (handle: string) => {
  const product = getProduct(handle);
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
    const product = getProduct(line.handle);
    return Boolean(product && canOrder(product) && !isPriced(product));
  });
}

/** What a set of lines comes to at their prices, whether or not checkout can take them. */
export function linesTotal(lines: CartLine[]): number {
  const cents = lines.reduce((sum, line) => {
    const product = getProduct(line.handle);
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
  const query = params.toString();
  return `https://${SHOPIFY_DOMAIN}/cart/${items}${query ? `?${query}` : ""}`;
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const formatPrice = (value: number) => usd.format(value);
