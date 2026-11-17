import { ladderPercent, OFFER, type Progress, STANDING } from "./campaign";

/**
 * The Founding Member offer. Everything ALAS sells is a pre-order until the
 * first run ships, and everyone who pre-orders becomes a Founding Member.
 * Joining with an email takes a first percentage off the pre-order, each of the
 * questions answered adds a step, and a phone number for texts adds the last
 * one. The steps and codes come from src/data/campaign.ts: the seasonal offer
 * while one is on, the standing offer otherwise.
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
    prompt: "What brings you to ALAS?",
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
    prompt: "What should we write to you about?",
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

/** One step of the offer: a percentage and the code that gives it. */
export type GiftTier = { percent: number; code: string };

export type { Progress };

/** The percentage earned for that much done. */
export const percentFor = (progress: Progress): number =>
  ladderPercent(OFFER.ladder, progress, GIFT_QUESTIONS.length);

const tierAt = (percent: number): GiftTier => ({
  percent,
  code: `${OFFER.code}${percent}`,
});

/** The step a member stands on for that much done. */
export const tierOf = (progress: Progress): GiftTier =>
  tierAt(percentFor(progress));

/** The step for a set of answers, with or without a phone number. */
export const tierForAnswers = (answers: GiftAnswers, phone: boolean) =>
  tierOf({ answers: answeredCount(answers), phone });

/** The Shopify tag for a sign-up on one step of the offer in force. */
export const offerTag = (progress: Progress): string =>
  `${OFFER.tag}-${percentFor(progress)}`;

/** What each answer adds, and what a phone number adds. */
export const ANSWER_BONUS = OFFER.ladder.perAnswer;
export const PHONE_BONUS = OFFER.ladder.phone;

/** For joining with an email alone. */
export const GIFT_START = tierOf({ answers: 0, phone: false });
/** With every question answered. */
export const GIFT_ANSWERED = tierOf({
  answers: GIFT_QUESTIONS.length,
  phone: false,
});
/** The most there is: every question answered and a phone number. */
export const GIFT_TOP = tierOf({ answers: GIFT_QUESTIONS.length, phone: true });

/** Every step the offer has, lowest first. */
export const GIFT_TIERS: readonly GiftTier[] = [
  ...new Set(
    [false, true].flatMap((phone) =>
      Array.from({ length: GIFT_QUESTIONS.length + 1 }, (_, answers) =>
        percentFor({ answers, phone }),
      ),
    ),
  ),
]
  .sort((a, b) => a - b)
  .map(tierAt);

export function tierFor(percent: number): GiftTier | null {
  return GIFT_TIERS.find((t) => t.percent === percent) ?? null;
}

/** The most the standing offer gives: what is left once a campaign has ended. */
export const STANDING_TOP = ladderPercent(
  STANDING.ladder,
  { answers: GIFT_QUESTIONS.length, phone: true },
  GIFT_QUESTIONS.length,
);

const WORDS = ["no", "one", "two", "three", "four", "five", "six"];

/** A small count in words: "three". */
export const countWord = (n: number) => WORDS[n] ?? String(n);

/** The whole ladder in one sentence, for the places that explain the offer. */
export const LADDER_LINE = `${GIFT_START.percent}% off for joining, ${ANSWER_BONUS}% more for each of ${countWord(GIFT_QUESTIONS.length)} quick questions${
  PHONE_BONUS ? `, and ${GIFT_TOP.percent}% with your phone number` : ""
}.`;
