import { describe, expect, it } from "vitest";
import { OFFER } from "./campaign";
import {
  ANSWER_BONUS,
  answeredCount,
  answerTags,
  cleanAnswers,
  GIFT_ANSWERED,
  GIFT_QUESTIONS,
  GIFT_START,
  GIFT_TIERS,
  GIFT_TOP,
  offerTag,
  PHONE_BONUS,
  percentFor,
  tierFor,
  tierForAnswers,
  tierOf,
} from "./gift";

const { base, perAnswer, phone } = OFFER.ladder;
const asked = GIFT_QUESTIONS.length;

describe("the Founding Member offer", () => {
  it("asks three questions", () => {
    expect(asked).toBe(3);
  });

  it("gives the base for joining, a step for each answer and a last one for a phone", () => {
    expect(GIFT_START.percent).toBe(base);
    expect(GIFT_ANSWERED.percent).toBe(base + asked * perAnswer);
    expect(GIFT_TOP.percent).toBe(base + asked * perAnswer + phone);
    expect(ANSWER_BONUS).toBe(perAnswer);
    expect(PHONE_BONUS).toBe(phone);
  });

  it("names each step's code and tag by its percentage", () => {
    const step = tierOf({ answers: 2, phone: false });
    expect(step.percent).toBe(base + 2 * perAnswer);
    expect(step.code).toBe(`${OFFER.code}${step.percent}`);
    expect(offerTag({ answers: 2, phone: false })).toBe(
      `${OFFER.tag}-${step.percent}`,
    );
    expect(offerTag({ answers: asked, phone: true })).toBe(
      `${OFFER.tag}-${GIFT_TOP.percent}`,
    );
  });

  it("lists every step once, lowest first", () => {
    const percents = GIFT_TIERS.map((t) => t.percent);
    expect(percents).toEqual([...new Set(percents)].sort((a, b) => a - b));
    expect(percents[0]).toBe(GIFT_START.percent);
    expect(percents.at(-1)).toBe(GIFT_TOP.percent);
    for (let answers = 0; answers <= asked; answers++) {
      expect(percents).toContain(percentFor({ answers, phone: false }));
      expect(percents).toContain(percentFor({ answers, phone: true }));
    }
  });

  it("finds a step by its percent", () => {
    expect(tierFor(GIFT_START.percent)?.code).toBe(GIFT_START.code);
    expect(tierFor(GIFT_TOP.percent)?.code).toBe(GIFT_TOP.code);
    expect(tierFor(GIFT_TOP.percent + 5)).toBeNull();
    expect(tierFor(0)).toBeNull();
    expect(tierFor(Number.NaN)).toBeNull();
  });

  it("counts only real answers towards the step", () => {
    const answers = { goal: "hydration", flavour: "mango", learn: "rituals" };
    expect(tierForAnswers(answers, false).percent).toBe(base + 2 * perAnswer);
    expect(tierForAnswers(answers, true).percent).toBe(
      base + 2 * perAnswer + phone,
    );
    expect(tierForAnswers({}, false)).toEqual(GIFT_START);
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
