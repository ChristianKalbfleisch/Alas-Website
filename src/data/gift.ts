import {
  BLACK_FRIDAY,
  type Campaign,
  ladderPercent,
  type Offer,
  offerAt,
  type Progress,
  STANDING,
} from "./campaign";

/**
 * The Founding Member offer. Everything ALAS sells is a pre-order until the
 * first run ships, and everyone who pre-orders becomes a Founding Member.
 * Joining with an email takes a first percentage off the pre-order, each of the
 * questions answered adds a step, and a phone number for texts adds the last
 * one. The ladders and codes are in src/data/campaign.ts; here each offer is
 * spelled out into its steps. Nothing in this file knows which offer is in
 * force: every function takes the offer it should speak for, and the pages and
 * the server ask the clock for it (`stepsAt`).
 */

export type GiftChoice = { id: string; label: string };
export type GiftQuestion = {
  id: string;
  prompt: string;
  choices: GiftChoice[];
};

/** The answers become Shopify tags, so the owners can write to each group. */
export const GIFT_QUESTIONS: readonly GiftQuestion[] = [
  {
    id: "goal",
    prompt: "What brings you to ÁLAS?",
    choices: [
      { id: "hydration", label: "Better hydration" },
      { id: "training", label: "Training and sport" },
      { id: "ritual", label: "A daily ritual" },
      { id: "kitchen", label: "Cooking and flavour" },
      { id: "gift", label: "A gift for someone" },
    ],
  },
  {
    id: "flavour",
    prompt: "Which flavour would you try first?",
    choices: [
      { id: "classic", label: "Classic" },
      { id: "lemon", label: "Lemon" },
      { id: "both", label: "Both" },
    ],
  },
  {
    id: "learn",
    prompt: "What would you like to hear more about?",
    choices: [
      { id: "rituals", label: "Rituals and recipes" },
      { id: "flavours", label: "New flavours, first" },
      { id: "greece", label: "Greece and its salt" },
      { id: "offers", label: "Offers and launches" },
    ],
  },
];

/** Question id → choice id. */
export type GiftAnswers = Record<string, string>;

/** Keeps only answers to real questions with real choices. */
export function cleanAnswers(raw: unknown): GiftAnswers {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const given = raw as Record<string, unknown>;
  const answers: GiftAnswers = {};
  for (const question of GIFT_QUESTIONS) {
    const value = given[question.id];
    if (
      typeof value === "string" &&
      question.choices.some((c) => c.id === value)
    ) {
      answers[question.id] = value;
    }
  }
  return answers;
}

export const answeredCount = (answers: GiftAnswers) =>
  Object.keys(cleanAnswers(answers)).length;

/** Shopify tags for the answers: pref-goal-hydration, pref-flavour-lemon… */
export function answerTags(answers: GiftAnswers): string[] {
  const clean = cleanAnswers(answers);
  return GIFT_QUESTIONS.flatMap((q) =>
    clean[q.id] ? [`pref-${q.id}-${clean[q.id]}`] : [],
  );
}

/** One step of an offer: a percentage and the code that gives it. */
export type GiftTier = { percent: number; code: string };

export type { Progress };

/** The percentage an offer gives for that much done. */
export const percentFor = (offer: Offer, progress: Progress): number =>
  ladderPercent(offer.ladder, progress, GIFT_QUESTIONS.length);

const tierAt = (offer: Offer, percent: number): GiftTier => ({
  percent,
  code: `${offer.code}${percent}`,
});

/** The step of an offer a member stands on for that much done. */
export const tierOf = (offer: Offer, progress: Progress): GiftTier =>
  tierAt(offer, percentFor(offer, progress));

/** The step for a set of answers, with or without a phone number. */
export const tierForAnswers = (
  offer: Offer,
  answers: GiftAnswers,
  phone: boolean,
) => tierOf(offer, { answers: answeredCount(answers), phone });

/** The Shopify tag for a sign-up on one step of an offer. */
export const offerTag = (offer: Offer, progress: Progress): string =>
  `${offer.tag}-${percentFor(offer, progress)}`;

/** An offer with its steps worked out: what the pages quote and the server checks. */
export type OfferSteps = Offer & {
  /** The campaign this offer is, or null for the standing offer. */
  campaign: Campaign | null;
  /** For joining with an email alone. */
  start: GiftTier;
  /** With every question answered. */
  answered: GiftTier;
  /** The most there is: every question answered and, where it counts, a phone number. */
  top: GiftTier;
  /** Every step the offer has, lowest first. */
  tiers: readonly GiftTier[];
  /** What each answer adds, and what a phone number adds. */
  answerBonus: number;
  phoneBonus: number;
};

const isCampaign = (offer: Offer): offer is Campaign => "ends" in offer;

function spell(offer: Offer): OfferSteps {
  const asked = GIFT_QUESTIONS.length;
  const percents = new Set(
    [false, true].flatMap((phone) =>
      Array.from({ length: asked + 1 }, (_, answers) =>
        percentFor(offer, { answers, phone }),
      ),
    ),
  );
  return {
    ...offer,
    campaign: isCampaign(offer) ? offer : null,
    start: tierOf(offer, { answers: 0, phone: false }),
    answered: tierOf(offer, { answers: asked, phone: false }),
    top: tierOf(offer, { answers: asked, phone: true }),
    tiers: [...percents].sort((a, b) => a - b).map((p) => tierAt(offer, p)),
    answerBonus: offer.ladder.perAnswer,
    phoneBonus: offer.ladder.phone,
  };
}

/**
 * Each offer is spelled out once, so the same offer always gives the same
 * object: a page can tell that the offer has changed by comparing the two.
 */
const SPELLED = new Map<Offer, OfferSteps>();

export function stepsOf(offer: Offer): OfferSteps {
  let steps = SPELLED.get(offer);
  if (!steps) {
    steps = spell(offer);
    SPELLED.set(offer, steps);
  }
  return steps;
}

/** The offer in force at a moment, with its steps. */
export const stepsAt = (now: number): OfferSteps => stepsOf(offerAt(now));

/** The standing offer, which every campaign falls back to. */
export const STANDING_STEPS = stepsOf(STANDING);

/** Every offer the site has ever quoted from: the campaign and the standing one. */
export const KNOWN_OFFERS: readonly OfferSteps[] = [
  stepsOf(BLACK_FRIDAY),
  STANDING_STEPS,
];

/** The step of an offer with that percentage, or null when it has none. */
export function tierFor(offer: OfferSteps, percent: number): GiftTier | null {
  return offer.tiers.find((t) => t.percent === percent) ?? null;
}
