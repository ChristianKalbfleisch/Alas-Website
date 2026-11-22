import { describe, expect, it } from "vitest";
import { BLACK_FRIDAY } from "./campaign";
import { faqs } from "./faq";
import { stepsAt } from "./gift";
import {
  afterLine,
  joinLine,
  ladderLine,
  rangeLine,
  wayUpLine,
} from "./offer-lines";

const END = Date.parse(BLACK_FRIDAY.ends);
const during = stepsAt(END - 1000);
const after = stepsAt(END + 1000);

describe("the offer's sentences while the campaign runs", () => {
  it("opens the pop-up in the owner's words", () => {
    expect(wayUpLine(during)).toBe(
      "Increase your discount to 25% by answering three quick questions and providing your phone number. Black Friday sale ends November 30.",
    );
  });

  it("names the phone number in the footer's invitation", () => {
    expect(joinLine(during)).toBe(
      "Join the Founding Members with your email for 5% off, then build it to 25% with three quick answers and your phone number.",
    );
  });

  it("gives a visitor the whole range under a price", () => {
    expect(rangeLine(during)).toBe(
      "Founding Members: 5% to 25% off. Join\u00a0free",
    );
  });

  it("explains the ladder and what the end leaves", () => {
    expect(ladderLine(during)).toBe(
      "5% off for joining, 5% more for each of three quick questions, and 25% with your phone number.",
    );
    expect(afterLine(during)).toBe("After November 30 the most is 20%.");
  });

  it("answers how the offer works, with the hour it ends", () => {
    const [first] = faqs(during);
    expect(first.q).toBe("How does the Black Friday offer work?");
    expect(first.a).toContain(
      "Black Friday ends November 30 at 11:59 pm Pacific; after that the most is 20%.",
    );
    expect(first.a).toContain("your phone number takes it to 25%");
  });
});

describe("the offer's sentences after the campaign's end", () => {
  const said = [
    wayUpLine(after),
    joinLine(after),
    rangeLine(after),
    ladderLine(after),
    afterLine(after),
    ...faqs(after).flatMap((faq) => [faq.q, faq.a]),
  ];

  it("opens the pop-up on the standing offer", () => {
    expect(wayUpLine(after)).toBe(
      "Increase your discount to 20% by answering three quick questions.",
    );
  });

  it("leaves the phone number out of the footer's invitation", () => {
    expect(joinLine(after)).toBe(
      "Join the Founding Members with your email for 5% off, then build it to 20% with three quick answers.",
    );
  });

  it("gives the standing range under a price", () => {
    expect(rangeLine(after)).toBe(
      "Founding Members: 5% to 20% off. Join\u00a0free",
    );
    expect(ladderLine(after)).toBe(
      "5% off for joining, 5% more for each of three quick questions.",
    );
    expect(afterLine(after)).toBe("");
  });

  it("drops the campaign's question and quotes 20% in the rest", () => {
    const questions = faqs(after);
    expect(questions).toHaveLength(faqs(during).length - 1);
    expect(questions[0].q).toBe("What is a Founding Member?");
    expect(questions[0].a).toContain("up to 20% off the pre-order");
  });

  it("never names the campaign, its top step or its phone number", () => {
    for (const line of said) {
      expect(line).not.toMatch(/25%|Friday|FRIDAY|phone/);
    }
  });
});
