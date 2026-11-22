/**
 * The offer for Founding Members, and the seasonal offer that sits on top of it.
 *
 * The discount is a ladder: something for joining with an email, more for each
 * question answered, and a last step for a phone number for texts. While a
 * campaign runs, its ladder, codes and tags are the offer in force everywhere.
 * At its last moment the standing offer takes over by itself, with no new
 * build: the offer in force is always worked out from the clock (`offerAt`),
 * in the browser and on the server. Set `on` to false to end a campaign early.
 *
 * Every percentage, the codes and the end are placeholders until the owners
 * confirm them and a code for each step exists under Discounts in Shopify.
 */

/** How the discount builds, in percentage points. */
export type Ladder = {
  /** For joining with an email, before a single question. */
  base: number;
  /** For each question answered. */
  perAnswer: number;
  /** For adding a phone number for texts. */
  phone: number;
};

export type Offer = {
  /** First half of the Shopify tag a sign-up gets, e.g. friday-25. */
  tag: string;
  /** First half of the discount code, e.g. FRIDAY25. */
  code: string;
  ladder: Ladder;
};

export type Campaign = Offer & {
  on: boolean;
  name: string;
  /**
   * The last moment of the offer, in UTC: 11:59:59 pm on 30 November on the US
   * Pacific coast, so the day named on the site is whole in every US time zone.
   */
  ends: string;
  /** The day it ends, as the site says it. */
  endsLabel: string;
  /** The same, with the hour, for the one place that spells it out. */
  endsExactly: string;
};

export const BLACK_FRIDAY: Campaign = {
  on: true,
  name: "Black Friday",
  tag: "friday",
  code: "FRIDAY",
  ladder: { base: 5, perAnswer: 5, phone: 5 },
  ends: "2026-12-01T07:59:59Z",
  endsLabel: "November 30",
  endsExactly: "November 30 at 11:59 pm Pacific",
};

/**
 * The standing Founding Member offer, in force whenever no campaign is: the
 * same ladder without the phone step, so the campaign's top is the only thing
 * its deadline takes away.
 */
export const STANDING: Offer = {
  tag: "founder",
  code: "FOUNDER",
  ladder: { base: 5, perAnswer: 5, phone: 0 },
};

/** The campaign's last moment as a timestamp; null when none is switched on. */
export const CAMPAIGN_END: number | null = BLACK_FRIDAY.on
  ? Date.parse(BLACK_FRIDAY.ends)
  : null;

/** The campaign running at a moment, or null: none is on, or its end has passed. */
export function campaignAt(now: number): Campaign | null {
  return CAMPAIGN_END !== null && now <= CAMPAIGN_END ? BLACK_FRIDAY : null;
}

/** The offer in force at a moment: the campaign while it runs, then the standing offer. */
export const offerAt = (now: number): Offer => campaignAt(now) ?? STANDING;

/** What a member has done towards the offer. */
export type Progress = { answers: number; phone: boolean };

/** The percentage one offer gives for that much done, out of `questions` asked. */
export function ladderPercent(
  ladder: Ladder,
  { answers, phone }: Progress,
  questions: number,
): number {
  const answered = Math.max(0, Math.min(questions, Math.floor(answers) || 0));
  return ladder.base + answered * ladder.perAnswer + (phone ? ladder.phone : 0);
}

/** Whole days, hours, minutes and seconds left; all zero once it has ended. */
export function timeLeft(ends: string, now: number = Date.now()) {
  const ms = Math.max(0, Date.parse(ends) - now);
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    over: ms === 0,
  };
}

/** A price in dollars with a percentage taken off, rounded to the cent. */
export function discounted(price: number, percent: number): number {
  return Math.round(price * (100 - percent)) / 100;
}
