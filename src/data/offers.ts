/**
 * Offer terms, as written in the owners' design brief and updated with the
 * subscription terms they set after the site preview. Only offers the store
 * honours (or will, once The Ritual opens) belong here; the "spend more,
 * unlock more" bar waits until real Shopify discounts exist.
 */

export const OFFER_TERMS = [
  { title: "Free shipping", detail: "Anywhere in the USA" },
  { title: "30-day guarantee", detail: "30-day money-back guarantee" },
  { title: "Save 40%", detail: "With The Ritual subscription" },
] as const;

/** The one sign-up offer used site-wide (the owners' live offer). */
export const JOIN_OFFER = "10% off your next order";

export const ANNOUNCEMENT = "Free shipping anywhere in the USA";
