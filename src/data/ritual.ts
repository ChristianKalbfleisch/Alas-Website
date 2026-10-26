import { SHOPIFY_DOMAIN } from "./products";

/**
 * The Ritual, the monthly subscription, on the terms the owners set after the
 * site preview: two 390 g pouches every month for $59.99, against $99.98 for
 * two pouches bought one at a time.
 *
 * It needs a selling plan in Shopify (the Shopify Subscriptions app, or any
 * app that uses selling plans). Until `sellingPlanId` is set, every Ritual
 * button collects an email instead of taking payment.
 */
export const RITUAL = {
  name: "The Ritual",
  pouches: 2,
  /** USD, charged every month. */
  price: 59.99,
  /** Two pouches at the one-pouch price. */
  retail: 99.98,
  /** The two-pouch kit (Mésos) the plan ships each month. */
  variantId: 42949716181097,
  quantity: 1,
  sellingPlanId: null as number | null,
} as const;

const cents = (n: number) => Math.round(n * 100);

export const RITUAL_SAVING = (cents(RITUAL.retail) - cents(RITUAL.price)) / 100;
export const RITUAL_SAVE_PERCENT = Math.round(
  (RITUAL_SAVING / RITUAL.retail) * 100,
);

export const ritualLive = () => RITUAL.sellingPlanId !== null;

/**
 * A link that empties the store cart, adds The Ritual with its selling plan
 * (plus any one-time items) and opens Shopify checkout. No API token needed.
 */
export function ritualCheckoutUrl(
  sellingPlanId: number,
  extra: { variantId: number; qty: number }[] = [],
): string {
  const params = new URLSearchParams();
  params.append("items[][id]", String(RITUAL.variantId));
  params.append("items[][quantity]", String(RITUAL.quantity));
  params.append("items[][selling_plan]", String(sellingPlanId));
  for (const item of extra) {
    if (item.qty <= 0) continue;
    params.append("items[][id]", String(item.variantId));
    params.append("items[][quantity]", String(item.qty));
  }
  params.append("return_to", "/checkout");
  const add = `/cart/add?${params.toString()}`;
  return `https://${SHOPIFY_DOMAIN}/cart/clear?return_to=${encodeURIComponent(add)}`;
}
