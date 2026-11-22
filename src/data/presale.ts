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
  /**
   * Whether a checkout link marks its order as a pre-order (cart-math.ts).
   * Nothing else reads it: the buttons and the ship line say "Pre-order"
   * either way.
   */
  on: true,
  /** When pre-orders ship, as the site should say it, e.g. "from mid-December". */
  ships: null as string | null,
};

/** One line for the buy buttons and the cart. */
export const presaleLine = () =>
  PRESALE.ships
    ? `Pre-order: ships ${PRESALE.ships}.`
    : "Pre-order: we will email your ship date.";
