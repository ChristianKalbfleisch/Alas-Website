/**
 * The offer for Founding Members, and the seasonal offer that sits on top of it.
 *
 * The discount is a ladder: something for joining with an email, more for each
 * question answered, and a last step for a phone number for texts. While a
 * campaign is on, its ladder, codes and tags take over everywhere, and the site
 * says when it ends. Once the end has passed the countdown and the "ends" lines
 * hide themselves; set `on` to false to put the standing ladder back.
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
  /** The last moment of the offer: the end of Cyber Monday, Pacific time. */
  ends: string;
  /** The same moment, as the site says it. */
  endsLabel: string;
};

export const BLACK_FRIDAY: Campaign = {
  on: true,
  name: "Black Friday",
  tag: "friday",
  code: "FRIDAY",
  ladder: { base: 5, perAnswer: 5, phone: 5 },
  ends: "2026-12-01T07:59:59Z",
  endsLabel: "Monday 30 November",
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

/** The campaign in force for this build, or null. */
export const CAMPAIGN: Campaign | null = BLACK_FRIDAY.on ? BLACK_FRIDAY : null;

/** The offer in force for this build. */
export const OFFER: Offer = CAMPAIGN ?? STANDING;

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

/** True until the campaign's last moment has passed. */
export function campaignLive(now: number = Date.now()): boolean {
  return CAMPAIGN !== null && now <= Date.parse(CAMPAIGN.ends);
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
