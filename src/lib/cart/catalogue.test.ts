import { describe, expect, it } from "vitest";
import {
  canOrder,
  exactProduct,
  getProduct,
  inFlavour,
  isPriced,
  products,
  shotFor,
} from "@/data/products";
import { buildCheckoutUrl, cartSubtotal } from "./cart-math";
import {
  complementsOf,
  siblingsOf,
  sizeLabel,
  suggestAddOns,
} from "./catalogue";

describe("suggestAddOns", () => {
  it("offers sticks to a cart with a pouch, in a sentence that ends openly", () => {
    const offers = suggestAddOns([{ handle: "classic-pouch", qty: 1 }]);
    expect(offers.map((o) => o.product.handle)).toEqual(["sticks-5"]);
    expect(offers[0].detail).toBe(
      "For the gym bag, the desk, or wherever the day takes you",
    );
  });

  it("offers nothing once a pouch and sticks are both in the cart", () => {
    expect(
      suggestAddOns([
        { handle: "classic-pouch", qty: 2 },
        { handle: "sticks-15", qty: 1 },
      ]),
    ).toEqual([]);
  });

  it("offers sticks to a cart that holds only the set", () => {
    const offers = suggestAddOns([{ handle: "discovery-set", qty: 1 }]);
    expect(offers.map((o) => o.product.handle)).toEqual(["sticks-5"]);
  });

  it("offers a first pouch to sticks-only carts and nothing to empty ones", () => {
    const offers = suggestAddOns([{ handle: "sticks-15", qty: 2 }]);
    expect(offers.map((o) => o.product.handle)).toEqual(["classic-pouch"]);
    expect(suggestAddOns([])).toEqual([]);
  });
});

describe("catalogue helpers", () => {
  it("labels sizes in plain words", () => {
    const pouch = getProduct("classic-pouch");
    const sticks = getProduct("sticks-30");
    const set = getProduct("discovery-set");
    expect(pouch && sizeLabel(pouch)).toBe("1 pouch");
    expect(sticks && sizeLabel(sticks)).toBe("30 sticks");
    expect(set && sizeLabel(set)).toBe("1 pouch + 4 sticks");
  });

  it("finds today's product from an old handle", () => {
    expect(getProduct("mikro")?.handle).toBe("classic-pouch");
    expect(getProduct("mesos")?.handle).toBe("classic-pouch");
    expect(getProduct("megalo")?.handle).toBe("classic-pouch");
    expect(getProduct("family-box")?.handle).toBe("discovery-set");
    expect(getProduct("welcome-box")?.handle).toBe("discovery-set");
    expect(getProduct("nope")).toBeUndefined();
  });

  it("finds the set under the first spelling of its name, for a page or a shop link", () => {
    expect(getProduct("discover-set")?.handle).toBe("discovery-set");
    expect(getProduct("discovery-set")?.name).toBe("Discovery Set");
  });

  it("holds only today's names in a cart or a pre-order", () => {
    expect(exactProduct("discovery-set")?.name).toBe("Discovery Set");
    for (const old of ["discover-set", "welcome-box", "family-box", "mikro"])
      expect(exactProduct(old)).toBeUndefined();
  });

  it("cross-sells complements only", () => {
    expect(complementsOf("classic-pouch").map((p) => p.handle)).toEqual([
      "sticks-5",
    ]);
    expect(complementsOf("sticks-30").map((p) => p.handle)).toEqual([
      "classic-pouch",
    ]);
    expect(complementsOf("discovery-set")).toEqual([]);
  });

  it("prices the Discovery Set and takes its pre-order, though checkout cannot charge for it yet", () => {
    const set = getProduct("discovery-set");
    expect(set?.price).toBe(39);
    expect(set?.variantId).toBeNull();
    expect(set && canOrder(set)).toBe(true);
    expect(set && isPriced(set)).toBe(false);
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
    const set = getProduct("discovery-set");
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

  it("takes Lemon's pre-order like Classic's, but keeps it out of checkout until it exists in the store", () => {
    const lemon = getProduct("lemon-pouch");
    expect(lemon && canOrder(lemon)).toBe(true);
    expect(lemon && isPriced(lemon)).toBe(false);
    const lines = [
      { handle: "lemon-pouch", qty: 2 },
      { handle: "classic-pouch", qty: 1 },
    ];
    expect(cartSubtotal(lines)).toBe(49.99);
    expect(buildCheckoutUrl(lines)).toContain("/cart/42949692293225:1");
    expect(buildCheckoutUrl([{ handle: "lemon-pouch", qty: 1 }])).toBe(
      "/#shop",
    );
  });

  it("shows as many packs as are picked", () => {
    for (const flavour of ["classic", "lemon"]) {
      const pouch = getProduct(`${flavour}-pouch`);
      if (!pouch) throw new Error("missing pouch");
      expect(shotFor(pouch, 1)).toBe(pouch.images[0]);
      expect(shotFor(pouch, 2).src).toContain(`pouch-${flavour}-2-studio`);
      expect(shotFor(pouch, 3).src).toContain(`pouch-${flavour}-3-studio`);
      // Past the largest amount photographed, the largest stands in.
      expect(shotFor(pouch, 7).src).toContain(`pouch-${flavour}-3-studio`);
    }
    const names: Record<string, string> = {
      "sticks-5": "sticks-classic-studio",
      "sticks-15": "sticks-classic-15-studio",
      "sticks-30": "sticks-classic-30-studio",
      "lemon-sticks-5": "sticks-lemon-studio",
      "lemon-sticks-15": "sticks-lemon-15-studio",
      "lemon-sticks-30": "sticks-lemon-30-studio",
    };
    for (const [handle, name] of Object.entries(names)) {
      const sticks = getProduct(handle);
      expect(sticks && shotFor(sticks, 2).src).toContain(`/packs/${name}.`);
    }
  });

  it("never shows Lemon's sample back panel", () => {
    const lemon = products.filter((p) => p.flavour === "Lemon");
    expect(
      lemon.flatMap((p) => p.images).some((i) => i.src.includes("back")),
    ).toBe(false);
  });
});
