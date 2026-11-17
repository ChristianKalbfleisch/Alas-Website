import { describe, expect, it } from "vitest";
import {
  EMPTY_MEMORY,
  rankForShop,
  remember,
  shopperMode,
  welcomeFor,
} from "./shopper-logic";

const HOUSE = ["classic-pouch", "sticks-5", "sticks-15", "sticks-30"];
const priced = (h: string) => HOUSE.includes(h);

describe("shopper memory", () => {
  it("keeps the newest first, without repeats", () => {
    expect(remember(["a", "b", "c"], ["b"])).toEqual(["b", "a", "c"]);
    expect(remember(["a"], ["x", "y", "x"], 2)).toEqual(["x", "y"]);
  });

  it("reads the mode from what the visitor did", () => {
    expect(shopperMode(EMPTY_MEMORY, 0)).toBe("new");
    expect(shopperMode({ ...EMPTY_MEMORY, bought: ["classic-pouch"] }, 2)).toBe(
      "cart",
    );
    expect(shopperMode({ ...EMPTY_MEMORY, bought: ["classic-pouch"] }, 0)).toBe(
      "buyer",
    );
    expect(shopperMode({ ...EMPTY_MEMORY, viewed: ["sticks-5"] }, 0)).toBe(
      "browser",
    );
    expect(
      shopperMode({ ...EMPTY_MEMORY, chapters: ["alas", "myth", "origin"] }, 0),
    ).toBe("reader");
  });

  it("orders the quick shop by habit, then the gift answer, then the house", () => {
    expect(rankForShop(HOUSE, EMPTY_MEMORY)).toEqual(HOUSE);
    expect(
      rankForShop(HOUSE, { ...EMPTY_MEMORY, viewed: ["sticks-30"] }, "ritual"),
    ).toEqual(["sticks-30", "classic-pouch", "sticks-5", "sticks-15"]);
    expect(rankForShop(HOUSE, EMPTY_MEMORY, "training").slice(0, 3)).toEqual([
      "sticks-15",
      "sticks-5",
      "sticks-30",
    ]);
    expect(
      rankForShop(HOUSE, { ...EMPTY_MEMORY, bought: ["discover-set"] }),
    ).toEqual(HOUSE);
  });

  it("welcomes a returning visitor with one shortcut", () => {
    expect(welcomeFor(EMPTY_MEMORY, 0, priced)).toBeNull();
    expect(welcomeFor(EMPTY_MEMORY, 1, priced)).toEqual({ kind: "cart" });
    const back = { ...EMPTY_MEMORY, visits: 2 };
    expect(
      welcomeFor({ ...back, bought: ["discover-set", "sticks-15"] }, 0, priced),
    ).toEqual({ kind: "again", handle: "sticks-15" });
    expect(welcomeFor({ ...back, viewed: ["sticks-5"] }, 0, priced)).toEqual({
      kind: "viewed",
      handle: "sticks-5",
    });
    expect(
      welcomeFor(
        { ...back, chapters: ["alas", "origin"], lastChapter: "origin" },
        0,
        priced,
      ),
    ).toEqual({ kind: "chapter", chapter: "origin" });
    expect(welcomeFor({ ...back, chapters: ["alas"] }, 0, priced)).toBeNull();
  });
});
