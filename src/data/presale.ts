import { GIFT_TOP } from "./gift";

/**
 * Pre-order mode: everything ALAS sells is a pre-order until the first run
 * ships, and everyone who pre-orders can join the Founding Members (see
 * src/data/gift.ts). The buy buttons say "Pre-order", and the buy row and the
 * cart carry the ship line.
 *
 * In Shopify, the products must keep selling when out of stock and the Founding
 * Member codes must exist. Set `ships` once the date is decided.
 */
export const PRESALE = {
  on: true,
  /** When pre-orders ship, as the site should say it, e.g. "from mid-December". */
  ships: null as string | null,
};

/** The most the offer gives; how it builds is explained where it is claimed. */
export const PRESALE_BANNER = `Pre-order now · Founding Members save up to ${GIFT_TOP.percent}%`;

/** One line for the buy buttons and the cart. */
export const presaleLine = () =>
  PRESALE.ships
    ? `Pre-order: ships ${PRESALE.ships}.`
    : "Pre-order: we will email your ship date.";
