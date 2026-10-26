import { type Flavour, getProduct, SHOPIFY_DOMAIN } from "@/data/products";

export type CartLine = {
  handle: string;
  flavour?: Flavour;
  qty: number;
};

/** Money is summed in integer cents so $49.99 + $9.99 never drifts. */
const toCents = (value: number) => Math.round(value * 100);

/** Products waiting for a new price are never summed or sent to checkout. */
const pricedProduct = (handle: string) => {
  const product = getProduct(handle);
  return product && product.price !== null
    ? { ...product, price: product.price }
    : undefined;
};

export function cartSubtotal(lines: CartLine[]): number {
  const cents = lines.reduce((sum, line) => {
    const product = pricedProduct(line.handle);
    return product ? sum + toCents(product.price) * line.qty : sum;
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

/**
 * Shopify cart permalink: no API token needed, lands on the store's checkout.
 * With nothing to buy it stays on this site: the store's own pages are the old one.
 */
export function buildCheckoutUrl(lines: CartLine[]): string {
  const items = checkoutItems(lines)
    .map(({ variantId, qty }) => `${variantId}:${qty}`)
    .join(",");
  return items ? `https://${SHOPIFY_DOMAIN}/cart/${items}` : "/#shop";
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const formatPrice = (value: number) => usd.format(value);
