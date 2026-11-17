/**
 * Offer terms, as written in the owners' design brief and updated with the
 * subscription terms they set later. Only offers the store honours (or will,
 * once The Ritual opens) belong here.
 *
 * Before launch the store must publish refund and shipping policy pages that
 * match these lines; today only its privacy policy exists.
 */

export const TERMS = {
  shipping: "Free shipping anywhere in the USA",
  returns: "30-day money-back guarantee",
  checkout: null as string | null,
};

export const OFFER_TERMS = [
  { title: "Free shipping", detail: "Anywhere in the USA" },
  { title: "30-day guarantee", detail: "30-day money-back guarantee" },
  {
    title: "The Ritual",
    detail: "A pouch every 30 or 90 days, opening soon",
  },
] as const;

export const ANNOUNCEMENT = "Free shipping anywhere in the USA";
