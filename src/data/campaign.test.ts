import { describe, expect, it } from "vitest";
import {
  BLACK_FRIDAY,
  campaignLive,
  discounted,
  ladderPercent,
  STANDING,
  timeLeft,
} from "./campaign";

describe("the ladder", () => {
  const friday = BLACK_FRIDAY.ladder;

  it("starts at the base, before a single question", () => {
    expect(ladderPercent(friday, { answers: 0, phone: false }, 3)).toBe(5);
  });

  it("adds a step for each answer", () => {
    expect(ladderPercent(friday, { answers: 1, phone: false }, 3)).toBe(10);
    expect(ladderPercent(friday, { answers: 2, phone: false }, 3)).toBe(15);
    expect(ladderPercent(friday, { answers: 3, phone: false }, 3)).toBe(20);
  });

  it("adds the last step for a phone number, with or without answers", () => {
    expect(ladderPercent(friday, { answers: 3, phone: true }, 3)).toBe(25);
    expect(ladderPercent(friday, { answers: 0, phone: true }, 3)).toBe(10);
  });

  it("never counts more answers than there are questions", () => {
    expect(ladderPercent(friday, { answers: 9, phone: true }, 3)).toBe(25);
    expect(ladderPercent(friday, { answers: -2, phone: false }, 3)).toBe(5);
    expect(
      ladderPercent(friday, { answers: Number.NaN, phone: false }, 3),
    ).toBe(5);
    expect(ladderPercent(friday, { answers: 1.9, phone: false }, 3)).toBe(10);
  });
});

describe("the seasonal offer", () => {
  const all = { answers: 3, phone: true };

  it("tops the standing offer, and never gives less at any step", () => {
    expect(ladderPercent(BLACK_FRIDAY.ladder, all, 3)).toBeGreaterThan(
      ladderPercent(STANDING.ladder, all, 3),
    );
    for (const answers of [0, 1, 2, 3]) {
      for (const phone of [false, true]) {
        expect(
          ladderPercent(BLACK_FRIDAY.ladder, { answers, phone }, 3),
        ).toBeGreaterThanOrEqual(
          ladderPercent(STANDING.ladder, { answers, phone }, 3),
        );
      }
    }
  });

  it("is live until its last moment and not after", () => {
    const end = Date.parse(BLACK_FRIDAY.ends);
    expect(campaignLive(end - 1000)).toBe(true);
    expect(campaignLive(end)).toBe(true);
    expect(campaignLive(end + 1000)).toBe(false);
  });

  it("counts down to zero and stops there", () => {
    const end = Date.parse(BLACK_FRIDAY.ends);
    const left = timeLeft(
      BLACK_FRIDAY.ends,
      end - (2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000,
    );
    expect(left).toEqual({
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
      over: false,
    });
    expect(timeLeft(BLACK_FRIDAY.ends, end + 5000)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      over: true,
    });
  });

  it("takes a percentage off a price to the cent", () => {
    expect(discounted(32, 25)).toBe(24);
    expect(discounted(24.99, 20)).toBe(19.99);
    expect(discounted(9.99, 25)).toBe(7.49);
  });
});
