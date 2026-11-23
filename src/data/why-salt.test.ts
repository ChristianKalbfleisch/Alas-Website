import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { numbered } from "./sources";
import { SODIUM_NOTE, WHY_POINTS, WHY_TITLE } from "./why-salt";

describe("why people salt their water, on the home page", () => {
  it("reports a habit in its heading and does not advise", () => {
    expect(WHY_TITLE).toBe("Why people salt their water");
  });

  it("says these two sentences, word for word", () => {
    expect(WHY_POINTS.map((point) => point.line)).toEqual([
      "When you sweat, you lose salt as well as water. Mainly sodium.",
      "Sodium is one of the electrolytes that help balance the water in your body.",
    ]);
  });

  it("credits every line to a source in the long read's list", () => {
    const names = numbered.map((source) => source.short);
    const credits = [
      ...WHY_POINTS.flatMap((point) => point.credits),
      ...SODIUM_NOTE.credits,
    ];
    expect(credits.length).toBeGreaterThan(0);
    for (const credit of credits) expect(names).toContain(credit);
  });

  it("leaves no line without a credit", () => {
    for (const point of WHY_POINTS)
      expect(point.credits.length).toBeGreaterThan(0);
  });

  it("gives the sodium of the pouch's serving and of a stick, as their labels print them", () => {
    expect(SODIUM_NOTE.text).toBe(
      "A quarter-teaspoon serving of ÁLAS Classic has 580 mg of sodium, 25% of the Daily Value. One 2.5 g Classic stick has 970 mg, 42% of the Daily Value. US guidelines suggest that people 14 and older keep sodium under 2,300 mg a day. If you watch your sodium or have a medical condition, consult your health practitioner first.",
    );
  });
});

describe("the same two sentences in the long read", () => {
  const chapter = readFileSync(
    new URL("../components/science/why.tsx", import.meta.url),
    "utf8",
  );

  it("are taken from the home page's own, so the two cannot differ", () => {
    expect(chapter).toContain('from "@/data/why-salt"');
    expect(chapter).toContain("const [SWEAT, BALANCE] = WHY_POINTS;");
    expect(chapter).toContain("{SWEAT.line}");
    expect(chapter).toContain("{BALANCE.line}");
  });

  it("are not written out a second time there", () => {
    for (const phrase of ["you lose salt as well as water", "help balance"])
      expect(chapter).not.toContain(phrase);
  });

  it("no longer names minerals the list of sources does not cover", () => {
    expect(chapter).not.toMatch(/magnesium|potassium|calcium,|minerals that/);
  });
});
