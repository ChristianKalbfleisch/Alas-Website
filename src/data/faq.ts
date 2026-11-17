import { CAMPAIGN } from "./campaign";
import {
  ANSWER_BONUS,
  countWord,
  GIFT_QUESTIONS,
  GIFT_START,
  GIFT_TOP,
  PHONE_BONUS,
  STANDING_TOP,
} from "./gift";

/**
 * Plain answers for the home page, each from the pack, the supplier's
 * certificate or the owners' terms. The longer questions (table salt, history,
 * how it is made) live on the Science & History page.
 */

export type Faq = {
  q: string;
  a: string;
  link?: { href: string; label: string };
};

const SEASONAL: Faq[] = CAMPAIGN
  ? [
      {
        q: `How does the ${CAMPAIGN.name} offer work?`,
        a: `Join the Founding Members with your email and ${GIFT_START.percent}% comes off your pre-order straight away. Each of ${countWord(GIFT_QUESTIONS.length)} quick questions adds ${ANSWER_BONUS}%${
          PHONE_BONUS
            ? `, and your phone number takes it to ${GIFT_TOP.percent}%`
            : ""
        }. ${CAMPAIGN.name} ends ${CAMPAIGN.endsLabel}${
          STANDING_TOP < GIFT_TOP.percent
            ? `; after that the most is ${STANDING_TOP}%`
            : ""
        }. Your code shows on screen and checkout applies it for you.`,
      },
    ]
  : [];

export const FAQS: Faq[] = [
  ...SEASONAL,
  {
    q: "What is a Founding Member?",
    a: `Anyone who pre-orders. Founding Members get the Welcome Box free when we launch, better prices than everyone else on later orders, and up to ${GIFT_TOP.percent}% off the pre-order.`,
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
    a: "A pinch in your first glass of water. On the go, tear a stick into your bottle, shake and drink. At the table, a pinch over your food.",
    link: { href: "/#how-to-use", label: "Three ways to use it" },
  },
  {
    q: "What does it taste like?",
    a: "Clean and briny, softer than table salt. In the kitchen it is a finishing salt.",
  },
  {
    q: "Isn't salt bad for me?",
    a: "Your body needs some sodium, and the amount matters. Each serving's sodium is on the label. If you are on a low-sodium diet or have a medical condition, ask your doctor first.",
  },
  {
    q: "What about shipping and returns?",
    a: "Shipping is free anywhere in the USA, and if ALAS is not for you, our 30-day money-back guarantee has you covered.",
  },
  {
    q: "Is there a subscription?",
    a: "The Ritual opens at launch: a pouch every 30 or 90 days. Founding Members hear first.",
  },
];

export const CONTACT_EMAIL = "admin@alassaltco.com";
