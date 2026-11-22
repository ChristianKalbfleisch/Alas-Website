import { describe, expect, it } from "vitest";
import { BLACK_FRIDAY } from "./campaign";
import { faqs, MORE_USES, MORE_USES_TITLE } from "./faq";
import { stepsAt } from "./gift";

const END = Date.parse(BLACK_FRIDAY.ends);
const OFFERS = [stepsAt(END - 1000), stepsAt(END + 1000)];
const answerTo = (q: string, offer = OFFERS[0]) =>
  faqs(offer).find((faq) => faq.q === q);

describe("the questions", () => {
  it("promises no subscription and names none", () => {
    for (const offer of OFFERS) {
      expect(answerTo("Is there a subscription?", offer)?.a).toBe(
        "Not yet. We plan one after launch, and Founding Members hear first.",
      );
      for (const faq of faqs(offer)) {
        expect(`${faq.q} ${faq.a}`).not.toMatch(
          /The Ritual|opens at launch|every 30|grains/,
        );
      }
    }
  });

  it("lists the other uses in two labelled lines, the skin apart and marked as external", () => {
    expect(MORE_USES_TITLE).toBe("More ways to use it");
    expect(MORE_USES.map((line) => `${line.label}: ${line.uses}`)).toEqual([
      "In food and drink: in your water with lemon juice, in your morning coffee, in your cooking.",
      "On the skin, external use only: in an ice-water face bath, in a warm bath, as a salt scrub in the shower.",
    ]);
  });

  it("gives the same two lines under How do I use it, and says nothing of what people do", () => {
    const use = answerTo("How do I use it?");
    expect(use?.lines).toBe(MORE_USES);
    expect(use?.a.endsWith("More ways to use it:")).toBe(true);
    expect(use?.a).not.toMatch(/people/);
  });

  it("says what the uses are, never what they do", () => {
    const words = MORE_USES.map((line) => `${line.label} ${line.uses}`).join(
      " ",
    );
    expect(words).not.toMatch(
      /hydrat|detox|heal|sooth|relie|cleans|skin health|glow|mineral/i,
    );
  });
});
