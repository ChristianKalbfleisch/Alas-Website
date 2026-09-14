import type { Money } from "./types";

/**
 * Deliberately not `server-only`: client components format prices too, and
 * importing this through the package barrel would drag the Storefront client
 * into the browser bundle.
 */
export function formatMoney(money: Money, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: money.currencyCode,
  }).format(Number(money.amount));
}
