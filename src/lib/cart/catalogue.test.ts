import { describe, expect, it } from "vitest";
import { getProduct } from "@/data/products";
import {
  AUDIENCES,
  complementsOf,
  sizeLabel,
  suggestAddOns,
  upgradeFor,
} from "./catalogue";

describe("suggestAddOns", () => {
  it("offers The Ritual and sticks to a cart with a pouch", () => {
    const offers = suggestAddOns([{ handle: "mikro", qty: 1 }]);
    expect(offers.map((o) => o.kind)).toEqual(["ritual", "add"]);
    const sticks = offers[1];
    expect(sticks.kind === "add" && sticks.product.handle).toBe("sticks-5");
    expect(offers[0].detail).toBe("Two pouches every month, $59.99. Save 40%.");
  });

  it("offers only The Ritual once sticks are in the cart", () => {
    const offers = suggestAddOns([
      { handle: "mesos", qty: 1 },
      { handle: "sticks-15", qty: 1 },
    ]);
    expect(offers.map((o) => o.kind)).toEqual(["ritual"]);
  });

  it("offers a first pouch to sticks-only carts and nothing to empty ones", () => {
    const offers = suggestAddOns([{ handle: "sticks-15", qty: 2 }]);
    expect(offers).toHaveLength(1);
    const pouch = offers[0];
    expect(pouch.kind === "add" && pouch.product.handle).toBe("mikro");
    expect(suggestAddOns([])).toEqual([]);
  });
});

describe("catalogue helpers", () => {
  it("labels sizes in plain words", () => {
    const mikro = getProduct("mikro");
    const sticks = getProduct("sticks-30");
    expect(mikro && sizeLabel(mikro)).toBe("1 pouch");
    expect(sticks && sizeLabel(sticks)).toBe("30 sticks");
  });

  it("cross-sells complements only, and no box until the boxes have prices", () => {
    expect(complementsOf("mesos").map((p) => p.handle)).toEqual(["sticks-5"]);
    expect(complementsOf("sticks-30").map((p) => p.handle)).toEqual(["mikro"]);
    expect(complementsOf("welcome-box")).toEqual([]);
    expect(upgradeFor("mikro")).toBeNull();
    expect(upgradeFor("welcome-box")).toBeNull();
    expect(upgradeFor("family-box")).toBeNull();
  });

  it("maps every audience to a product with a price, or to The Ritual", () => {
    for (const a of AUDIENCES) {
      if (a.target === "ritual") continue;
      expect(getProduct(a.target)?.price).toBeTypeOf("number");
    }
  });
});
