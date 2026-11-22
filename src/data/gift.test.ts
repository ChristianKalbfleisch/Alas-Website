import { describe, expect, it } from "vitest";
import { BLACK_FRIDAY, STANDING } from "./campaign";
import {
  answeredCount,
  answerTags,
  cleanAnswers,
  GIFT_QUESTIONS,
  KNOWN_OFFERS,
  offerTag,
  percentFor,
  STANDING_STEPS,
  stepsAt,
  stepsOf,
  tierFor,
  tierForAnswers,
  tierOf,
} from "./gift";

const asked = GIFT_QUESTIONS.length;
const END = Date.parse(BLACK_FRIDAY.ends);

describe("the questions", () => {
  it("are three", () => {
    expect(asked).toBe(3);
  });

  it("keeps only real answers", () => {
    const raw = {
      goal: "hydration",
      flavour: "mango",
      learn: "rituals",
      extra: "yes",
    };
    expect(cleanAnswers(raw)).toEqual({ goal: "hydration", learn: "rituals" });
    expect(answeredCount(raw)).toBe(2);
    expect(cleanAnswers("goal")).toEqual({});
    expect(cleanAnswers(["hydration"])).toEqual({});
    expect(cleanAnswers(null)).toEqual({});
  });

  it("turns answers into tags in question order", () => {
    expect(answerTags({ learn: "offers", goal: "gift", flavour: "x" })).toEqual(
      ["pref-goal-gift", "pref-learn-offers"],
    );
  });
});

describe.each([
  ["the campaign", BLACK_FRIDAY],
  ["the standing offer", STANDING],
])("%s, spelled out", (_, offer) => {
  const steps = stepsOf(offer);
  const { base, perAnswer, phone } = offer.ladder;

  it("gives the base for joining, a step for each answer and a last one for a phone", () => {
    expect(steps.start.percent).toBe(base);
    expect(steps.answered.percent).toBe(base + asked * perAnswer);
    expect(steps.top.percent).toBe(base + asked * perAnswer + phone);
    expect(steps.answerBonus).toBe(perAnswer);
    expect(steps.phoneBonus).toBe(phone);
  });

  it("names each step's code and tag by its percentage", () => {
    const step = tierOf(offer, { answers: 2, phone: false });
    expect(step.percent).toBe(base + 2 * perAnswer);
    expect(step.code).toBe(`${offer.code}${step.percent}`);
    expect(offerTag(offer, { answers: 2, phone: false })).toBe(
      `${offer.tag}-${step.percent}`,
    );
    expect(offerTag(offer, { answers: asked, phone: true })).toBe(
      `${offer.tag}-${steps.top.percent}`,
    );
  });

  it("lists every step once, lowest first", () => {
    const percents = steps.tiers.map((t) => t.percent);
    expect(percents).toEqual([...new Set(percents)].sort((a, b) => a - b));
    expect(percents[0]).toBe(steps.start.percent);
    expect(percents.at(-1)).toBe(steps.top.percent);
    for (let answers = 0; answers <= asked; answers++) {
      expect(percents).toContain(percentFor(offer, { answers, phone: false }));
      expect(percents).toContain(percentFor(offer, { answers, phone: true }));
    }
  });

  it("finds a step by its percent", () => {
    expect(tierFor(steps, steps.start.percent)).toEqual(steps.start);
    expect(tierFor(steps, steps.top.percent)).toEqual(steps.top);
    expect(tierFor(steps, steps.top.percent + 5)).toBeNull();
    expect(tierFor(steps, 0)).toBeNull();
    expect(tierFor(steps, Number.NaN)).toBeNull();
  });

  it("counts only real answers towards the step", () => {
    const answers = { goal: "hydration", flavour: "mango", learn: "rituals" };
    expect(tierForAnswers(offer, answers, false).percent).toBe(
      base + 2 * perAnswer,
    );
    expect(tierForAnswers(offer, answers, true).percent).toBe(
      base + 2 * perAnswer + phone,
    );
    expect(tierForAnswers(offer, {}, false)).toEqual(steps.start);
  });

  it("is spelled out once, so the same offer is always the same object", () => {
    expect(stepsOf(offer)).toBe(steps);
  });
});

describe("the offer in force", () => {
  const friday = stepsOf(BLACK_FRIDAY);

  it("is the campaign up to its last moment: FRIDAY codes, friday- tags, 25% at most, a phone step", () => {
    for (const now of [END - 10 * 86_400_000, END - 1000, END]) {
      const offer = stepsAt(now);
      expect(offer).toBe(friday);
      expect(offer.campaign).toBe(BLACK_FRIDAY);
      expect(offer.top).toEqual({ percent: 25, code: "FRIDAY25" });
      expect(offer.tiers.map((t) => t.code)).toEqual([
        "FRIDAY5",
        "FRIDAY10",
        "FRIDAY15",
        "FRIDAY20",
        "FRIDAY25",
      ]);
      expect(offer.phoneBonus).toBe(5);
      expect(offerTag(offer, { answers: 3, phone: true })).toBe("friday-25");
    }
  });

  it("is the standing offer from one second after: FOUNDER codes, founder- tags, 20% at most, no phone step", () => {
    for (const now of [END + 1000, END + 86_400_000, END + 400 * 86_400_000]) {
      const offer = stepsAt(now);
      expect(offer).toBe(STANDING_STEPS);
      expect(offer.campaign).toBeNull();
      expect(offer.top).toEqual({ percent: 20, code: "FOUNDER20" });
      expect(offer.tiers.map((t) => t.code)).toEqual([
        "FOUNDER5",
        "FOUNDER10",
        "FOUNDER15",
        "FOUNDER20",
      ]);
      expect(offer.phoneBonus).toBe(0);
      expect(offerTag(offer, { answers: 3, phone: true })).toBe("founder-20");
    }
  });

  it("reads a step earned in the campaign again under the standing offer, never above its top", () => {
    const done = { goal: "training", flavour: "lemon", learn: "offers" };
    expect(tierForAnswers(stepsAt(END), done, true)).toEqual({
      percent: 25,
      code: "FRIDAY25",
    });
    expect(tierForAnswers(stepsAt(END + 1000), done, true)).toEqual({
      percent: 20,
      code: "FOUNDER20",
    });
    // A phone number alone was worth a step in the campaign and is not after it.
    expect(tierForAnswers(stepsAt(END), {}, true).code).toBe("FRIDAY10");
    expect(tierForAnswers(stepsAt(END + 1000), {}, true).code).toBe("FOUNDER5");
  });

  it("knows both offers it has quoted from", () => {
    expect(KNOWN_OFFERS).toEqual([friday, STANDING_STEPS]);
  });
});
