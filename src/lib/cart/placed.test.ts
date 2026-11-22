import { describe, expect, it } from "vitest";
import { linesKey, readPlaced } from "./placed";

const ORDER = {
  ref: "k7q2mxd9",
  day: "2026-11-21",
  lines: [
    {
      handle: "lemon-pouch",
      name: "Lemon Pouch",
      qty: 2,
      each: 49.99,
      total: 99.98,
    },
  ],
  total: 99.98,
  percent: 5,
  toPay: 94.98,
};
const PLACED = { order: ORDER, email: "ana@example.com" };

describe("the kept pre-order a device remembers", () => {
  it("comes back as it was saved", () => {
    expect(readPlaced(JSON.stringify(PLACED))).toEqual(PLACED);
  });

  it("is nothing when nothing was saved, or what was saved cannot be read", () => {
    for (const raw of [null, "", "null", "{", "[]", '"k7q2mxd9"']) {
      expect(readPlaced(raw), String(raw)).toBeNull();
    }
  });

  it("is nothing when a part of it is missing or of the wrong kind", () => {
    const broken: unknown[] = [
      { order: ORDER },
      { email: "ana@example.com" },
      { ...PLACED, email: 7 },
      { ...PLACED, order: { ...ORDER, ref: "K7Q2MXD9" } },
      { ...PLACED, order: { ...ORDER, ref: undefined } },
      { ...PLACED, order: { ...ORDER, day: 20261121 } },
      { ...PLACED, order: { ...ORDER, lines: [] } },
      { ...PLACED, order: { ...ORDER, lines: "Lemon Pouch" } },
      { ...PLACED, order: { ...ORDER, lines: [{ handle: "lemon-pouch" }] } },
      { ...PLACED, order: { ...ORDER, lines: [null] } },
      { ...PLACED, order: { ...ORDER, toPay: "94.98" } },
      { ...PLACED, order: { ...ORDER, percent: null } },
      { ...PLACED, order: { ...ORDER, total: Number.NaN } },
    ];
    for (const saved of broken) {
      expect(
        readPlaced(JSON.stringify(saved)),
        JSON.stringify(saved),
      ).toBeNull();
    }
  });
});

describe("the lines a reference is made for", () => {
  it("read the same in any order, and differently when a quantity or a product changes", () => {
    const a = { handle: "lemon-pouch", qty: 1 };
    const b = { handle: "discovery-set", qty: 2 };
    expect(linesKey([a, b])).toBe(linesKey([b, a]));
    expect(linesKey([a, b])).toBe("discovery-set:2,lemon-pouch:1");
    expect(linesKey([a, { ...b, qty: 3 }])).not.toBe(linesKey([a, b]));
    expect(linesKey([a])).not.toBe(linesKey([a, b]));
  });
});
