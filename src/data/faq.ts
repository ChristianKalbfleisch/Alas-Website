import { GIFT_QUESTIONS, type OfferSteps, STANDING_STEPS } from "./gift";
import { countWord } from "./offer-lines";

/**
 * Plain answers for the home page, each from the pack, the supplier's
 * certificate or the owners' terms. The longer questions (table salt, history,
 * how it is made) live on the Science & History page. The answers that quote
 * the offer are written for the offer in force: a campaign's own question is
 * there while it runs and leaves with it.
 */

/** A labelled line: what kind of use, then the uses. */
export type Uses = { label: string; uses: string };

export type Faq = {
  q: string;
  a: string;
  /** Labelled lines under the answer. */
  lines?: Uses[];
  link?: { href: string; label: string };
};

/** The heading the uses stand under, on the home page and in the question. */
export const MORE_USES_TITLE = "More ways to use it";

/**
 * Uses beyond the glass, the bottle and the plate, in two labelled lines: food
 * and drink apart from the skin, which is marked as external use. Names only:
 * what a use is, never what it does or how much to take. The home page's
 * ritual section shows the same two lines.
 */
export const MORE_USES: Uses[] = [
  {
    label: "In food and drink",
    uses: "in your water with lemon juice, in your morning coffee, in your cooking.",
  },
  {
    label: "On the skin, external use only",
    uses: "in an ice-water face bath, in a warm bath, as a salt scrub in the shower.",
  },
];

/** How a running campaign works, and what is left after it. */
function seasonal(offer: OfferSteps): Faq[] {
  const campaign = offer.campaign;
  if (!campaign) return [];
  const after = STANDING_STEPS.top.percent;
  return [
    {
      q: `How does the ${campaign.name} offer work?`,
      a: `Join the Founding Members with your email and ${offer.start.percent}% comes off your pre-order straight away. Each of ${countWord(GIFT_QUESTIONS.length)} quick questions adds ${offer.answerBonus}%${
        offer.phoneBonus
          ? `, and your phone number takes it to ${offer.top.percent}%`
          : ""
      }. ${campaign.name} ends ${campaign.endsExactly}${
        after < offer.top.percent ? `; after that the most is ${after}%` : ""
      }. Your code shows on screen and checkout applies it for you.`,
    },
  ];
}

/** The questions, with the offer's figures as they stand under that offer. */
export const faqs = (offer: OfferSteps): Faq[] => [
  ...seasonal(offer),
  {
    q: "What is a Founding Member?",
    a: `Anyone who pre-orders. Founding Members get the Welcome Box free when we launch, better prices than everyone else on later orders, and up to ${offer.top.percent}% off the pre-order.`,
  },
  {
    q: "When does my pre-order ship?",
    a: "We ship the first batch as soon as it is packed, and we email your ship date before then. If the date ever moves, we tell you, and you can cancel for a full refund. The packs pictured here are pre-production, so the final ones may vary.",
  },
  {
    q: "Where does it come from?",
    a: "Greece. It is fleur de sel, hand-harvested from Mediterranean salt pans, then packed in California.",
    link: { href: "/science-and-history#origin", label: "How it is made" },
  },
  {
    q: "How do I use it?",
    a: `Start your morning with a pinch in your water. On the go, tear a stick into your bottle, shake and drink. At the table, a pinch over your food. There's no one way to enjoy ALAS. ${MORE_USES_TITLE}:`,
    lines: MORE_USES,
    link: { href: "/#how-to-use", label: "Make it your ritual" },
  },
  {
    q: "What does it taste like?",
    a: "Clean and briny, softer than table salt. In the kitchen it is a finishing salt.",
  },
  {
    q: "Isn't salt bad for me?",
    a: "Your body needs some sodium, and the amount matters. Each serving's sodium is on the label. If you are on a low-sodium diet or have a medical condition, consult your health practitioner first.",
  },
  {
    q: "What about shipping and returns?",
    a: "Shipping is free anywhere in the USA, and if ALAS is not for you, our 30-day money-back guarantee has you covered.",
  },
  {
    q: "Is there a subscription?",
    a: "Not yet. We plan one after launch, and Founding Members hear first.",
  },
];

export const CONTACT_EMAIL = "admin@alassaltco.com";
