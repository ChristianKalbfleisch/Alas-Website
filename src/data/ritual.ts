import { formatPrice } from "@/lib/cart/cart-math";
import { SHOPIFY_DOMAIN } from "./products";

/**
 * The Ritual, a subscription planned for after launch: one 390 g pouch every
 * 30 or every 90 days. The pouch defaults to 90: the label counts about 260
 * servings, so a monthly pouch would pile up for most people. It has no price
 * yet, and no page shows or sells it: the site only says that a subscription
 * is planned.
 *
 * It needs a selling plan in Shopify (the Shopify Subscriptions app, or any
 * app that uses selling plans), then `sellingPlanId` and `price` here.
 */
export const RITUAL = {
  name: "The Ritual",
  pouches: 1,
  /** USD per delivery; null until the owners set it. */
  price: null as number | null,
  /** Days between deliveries, the default first. */
  cadences: [90, 30] as const,
  /** The Classic Pouch, the one product the plan ships. */
  variantId: 42949692293225,
  quantity: 1,
  sellingPlanId: null as number | null,
} as const;

/** "A pouch every 30 or 90 days", from the cadences above. */
export const ritualCadence = () =>
  `A pouch every ${[...RITUAL.cadences].sort((a, b) => a - b).join(" or ")} days`;

export const ritualLive = () =>
  RITUAL.sellingPlanId !== null && RITUAL.price !== null;

/** "$x a pouch", or plainly that the price comes with the launch. */
export const ritualPrice = () =>
  RITUAL.price === null
    ? "Price at launch"
    : `${formatPrice(RITUAL.price)} a pouch`;

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
