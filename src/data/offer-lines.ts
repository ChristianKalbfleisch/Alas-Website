import { GIFT_QUESTIONS, type OfferSteps, STANDING_STEPS } from "./gift";

/**
 * The sentences that explain the offer, each written once and filled in from
 * the offer it is asked about, so the bar, the pop-up, the footer and the
 * questions always quote the same figures. While a campaign runs they name its
 * top step and its phone number; under the standing offer they do not.
 */

const WORDS = ["no", "one", "two", "three", "four", "five", "six"];

/** A small count in words: "three". */
export const countWord = (n: number) => WORDS[n] ?? String(n);

const ASKED = countWord(GIFT_QUESTIONS.length);

/** The whole ladder in one sentence, for the places that explain the offer. */
export const ladderLine = (offer: OfferSteps) =>
  `${offer.start.percent}% off when you join, up to ${offer.top.percent}% when you answer ${ASKED} quick questions${
    offer.phoneBonus ? " and add your number" : ""
  }.`;

/** The way to the top step, said once as the offer opens, and when a campaign ends. */
export const wayUpLine = (offer: OfferSteps) =>
  `Increase your discount to ${offer.top.percent}% by answering ${ASKED} quick questions${
    offer.phoneBonus ? " and providing your phone number" : ""
  }.${
    offer.campaign
      ? ` ${offer.campaign.name} sale ends ${offer.campaign.endsLabel}.`
      : ""
  }`;

/** The invitation beside a sign-up field: what an email gives, and how it grows. */
export const joinLine = (offer: OfferSteps) =>
  `Join the Founding Members with your email for ${offer.start.percent}% off, then build it to ${offer.top.percent}% with ${ASKED} quick answers${
    offer.phoneBonus ? " and your phone number" : ""
  }.`;

/**
 * Under a price, for a visitor who has not joined: the whole range, not only
 * its best end. "Join free" stays together when the line wraps.
 */
export const rangeLine = (offer: OfferSteps) =>
  `Founding Members: ${offer.start.percent}% to ${offer.top.percent}% off. Join\u00a0free`;

/** What the end of a campaign leaves: "After November 30 the most is 20%." Empty when nothing changes. */
export const afterLine = (offer: OfferSteps) =>
  offer.campaign && STANDING_STEPS.top.percent < offer.top.percent
    ? `After ${offer.campaign.endsLabel} the most is ${STANDING_STEPS.top.percent}%.`
    : "";
