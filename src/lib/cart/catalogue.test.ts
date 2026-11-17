import { describe, expect, it } from "vitest";
import { getProduct, inFlavour, isPriced, products } from "@/data/products";
import { buildCheckoutUrl, cartSubtotal } from "./cart-math";
import {
  complementsOf,
  siblingsOf,
  sizeLabel,
  suggestAddOns,
} from "./catalogue";

describe("suggestAddOns", () => {
  it("offers The Ritual and sticks to a cart with a pouch", () => {
    const offers = suggestAddOns([{ handle: "classic-pouch", qty: 1 }]);
    expect(offers.map((o) => o.kind)).toEqual(["ritual", "add"]);
    const sticks = offers[1];
    expect(sticks.kind === "add" && sticks.product.handle).toBe("sticks-5");
    expect(offers[0].detail).toBe(
      "A pouch every 30 or 90 days. Opens at launch.",
    );
  });

  it("offers only The Ritual once sticks are in the cart", () => {
    const offers = suggestAddOns([
      { handle: "classic-pouch", qty: 2 },
      { handle: "sticks-15", qty: 1 },
    ]);
    expect(offers.map((o) => o.kind)).toEqual(["ritual"]);
  });

  it("offers a first pouch to sticks-only carts and nothing to empty ones", () => {
    const offers = suggestAddOns([{ handle: "sticks-15", qty: 2 }]);
    expect(offers).toHaveLength(1);
    const pouch = offers[0];
    expect(pouch.kind === "add" && pouch.product.handle).toBe("classic-pouch");
    expect(suggestAddOns([])).toEqual([]);
  });
});

describe("catalogue helpers", () => {
  it("labels sizes in plain words", () => {
    const pouch = getProduct("classic-pouch");
    const sticks = getProduct("sticks-30");
    const set = getProduct("discover-set");
    expect(pouch && sizeLabel(pouch)).toBe("1 pouch");
    expect(sticks && sizeLabel(sticks)).toBe("30 sticks");
    expect(set && sizeLabel(set)).toBe("1 pouch + 4 sticks");
  });

  it("finds today's product from an old handle", () => {
    expect(getProduct("mikro")?.handle).toBe("classic-pouch");
    expect(getProduct("mesos")?.handle).toBe("classic-pouch");
    expect(getProduct("family-box")?.handle).toBe("discover-set");
    expect(getProduct("nope")).toBeUndefined();
  });

  it("cross-sells complements only", () => {
    expect(complementsOf("classic-pouch").map((p) => p.handle)).toEqual([
      "sticks-5",
    ]);
    expect(complementsOf("sticks-30").map((p) => p.handle)).toEqual([
      "classic-pouch",
    ]);
    expect(complementsOf("discover-set")).toEqual([]);
  });

  it("shows the Discover Set's price but keeps it out of the cart until it has a Shopify variant", () => {
    const set = getProduct("discover-set");
    expect(set?.price).toBe(39);
    expect(set?.variantId).toBeNull();
  });
});

describe("Classic and Lemon", () => {
  it("offers every pouch and stick pack in both flavours", () => {
    const classic = products.filter((p) => p.flavour === "Classic");
    const lemon = products.filter((p) => p.flavour === "Lemon");
    expect(lemon.map((p) => p.handle)).toEqual([
      "lemon-pouch",
      "lemon-sticks-5",
      "lemon-sticks-15",
      "lemon-sticks-30",
    ]);
    for (const product of lemon) {
      const twin = inFlavour(product, "Classic");
      expect(twin && classic.includes(twin)).toBe(true);
      expect(twin?.price).toBe(product.price);
    }
  });

  it("switches flavour without changing the pack size", () => {
    const sticks = getProduct("sticks-30");
    expect(sticks && inFlavour(sticks, "Lemon")?.handle).toBe(
      "lemon-sticks-30",
    );
    const lemon = getProduct("lemon-pouch");
    expect(lemon && inFlavour(lemon, "Classic")?.handle).toBe("classic-pouch");
    const set = getProduct("discover-set");
    expect(set && inFlavour(set, "Lemon")).toBeUndefined();
  });

  it("lists pack sizes within one flavour, small to large", () => {
    const lemon = getProduct("lemon-sticks-15");
    expect(lemon && siblingsOf(lemon).map((p) => p.handle)).toEqual([
      "lemon-sticks-5",
      "lemon-sticks-15",
      "lemon-sticks-30",
    ]);
  });

  it("keeps Lemon out of checkout until it exists in the store", () => {
    const lemon = getProduct("lemon-pouch");
    expect(lemon && isPriced(lemon)).toBe(false);
    const lines = [
      { handle: "lemon-pouch", qty: 2 },
      { handle: "classic-pouch", qty: 1 },
    ];
    expect(cartSubtotal(lines)).toBe(32);
    expect(buildCheckoutUrl(lines)).toContain("/cart/42949692293225:1");
    expect(buildCheckoutUrl([{ handle: "lemon-pouch", qty: 1 }])).toBe(
      "/#shop",
    );
  });

  it("never shows Lemon's sample back panel", () => {
    const lemon = products.filter((p) => p.flavour === "Lemon");
    expect(
      lemon.flatMap((p) => p.images).some((i) => i.src.includes("back")),
    ).toBe(false);
  });
});
