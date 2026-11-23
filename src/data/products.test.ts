import { describe, expect, it } from "vitest";
import {
  exactProduct,
  getProduct,
  pageDescription,
  perServing,
  products,
  todaysName,
} from "./products";

describe("the catalogue, written out", () => {
  // Nine products, their names and their prices in dollars, as the owners
  // gave them. A change here is a change to what a customer is charged.
  const PRICE_LIST: [string, string, number][] = [
    ["classic-pouch", "Classic Pouch", 49.99],
    ["lemon-pouch", "Lemon Pouch", 49.99],
    ["sticks-5", "Classic Sticks", 12.99],
    ["sticks-15", "Classic Sticks", 32.49],
    ["sticks-30", "Classic Sticks", 64.99],
    ["lemon-sticks-5", "Lemon Sticks", 12.99],
    ["lemon-sticks-15", "Lemon Sticks", 32.49],
    ["lemon-sticks-30", "Lemon Sticks", 64.99],
    ["discovery-set", "Discovery Set", 39],
  ];

  it("sells nine products under these names at these prices", () => {
    expect(products.map((p) => [p.handle, p.name, p.price])).toEqual(
      PRICE_LIST,
    );
  });

  it("names nothing by an old name", () => {
    for (const product of products) {
      const words = `${product.handle} ${product.name} ${product.subtitle} ${product.description}`;
      expect(words).not.toMatch(
        /Discover Set|discover-set|Mikr|Megal|Welcome Box|Family Box|Aegean/i,
      );
    }
  });

  it("counts the sticks in each pack", () => {
    expect(
      products.filter((p) => p.kind === "sticks").map((p) => p.sticks),
    ).toEqual([5, 15, 30, 5, 15, 30]);
    expect(getProduct("discovery-set")?.sticks).toBe(4);
  });
});

describe("what a page says about a product", () => {
  const classic = getProduct("classic-pouch");
  const lemon = getProduct("lemon-pouch");

  it("states the Classic pouch's servings and what one costs, from its label", () => {
    expect(classic?.subtitle).toBe("390 g · roughly 260 servings");
    expect(classic && perServing(classic)).toBe("19¢ each");
  });

  it("states no servings and no price a serving for Lemon, whose label is not final", () => {
    expect(lemon?.subtitle).toBe("390 g");
    expect(lemon?.servings).toBeUndefined();
    expect(lemon && perServing(lemon)).toBeNull();
    for (const product of products.filter((p) => p.flavour === "Lemon")) {
      expect(`${product.subtitle} ${product.description}`).not.toMatch(
        /serving/i,
      );
      expect(perServing(product)).toBeNull();
    }
  });

  it("does not open a pouch's description with the weight the line above already gives", () => {
    expect(classic?.description).toBe(
      "Greek fleur de sel, hand-harvested from Mediterranean salt pans and dried by the sun. Sea salt and nothing else, for your water and your table.",
    );
    expect(lemon?.description).toBe(
      "The same Greek fleur de sel with lemon. A bright citrus note over a clean, briny finish.",
    );
  });

  it("opens a search result or a link preview with what the pack is", () => {
    const said = (handle: string) => {
      const product = getProduct(handle);
      return product && pageDescription(product);
    };
    expect(said("sticks-5")).toBe(
      "5 sticks, 2.5 g each. Tear one into your bottle, wherever you are.",
    );
    expect(said("sticks-15")).toBe(
      "15 sticks, 2.5 g each. For the gym bag, the desk drawer, the carry-on, or wherever the day takes you.",
    );
    expect(said("lemon-sticks-30")).toBe(
      "30 sticks, 2.5 g each. Enough to keep a few in every bag you carry.",
    );
    expect(said("classic-pouch")).toBe(
      "390 g. Greek fleur de sel, hand-harvested from Mediterranean salt pans and dried by the sun. Sea salt and nothing else, for your water and your table.",
    );
    expect(said("lemon-pouch")).toBe(
      "390 g. The same Greek fleur de sel with lemon. A bright citrus note over a clean, briny finish.",
    );
    expect(said("discovery-set")).toBe(
      "Discover the ÁLAS ritual: the 390 g Classic pouch, four Classic sticks and a card on how to use them. The first 100 sets are hand-numbered, with a note from the founders.",
    );
  });

  it("ends no sticks sentence on a closed list", () => {
    for (const product of products.filter((p) => p.kind === "sticks")) {
      expect(product.description).not.toMatch(/the plane\.?$|and the plane/);
    }
  });
});

describe("names that lead to a product", () => {
  it("takes the set's first spelling to the set, on a page, in a shop link and in a saved cart", () => {
    expect(getProduct("discover-set")?.handle).toBe("discovery-set");
    expect(todaysName("discover-set")).toBe("discovery-set");
    expect(todaysName("discovery-set")).toBe("discovery-set");
  });

  it("takes a retired product to today's on a page, and never in a cart", () => {
    for (const [old, now] of [
      ["mikro", "classic-pouch"],
      ["mesos", "classic-pouch"],
      ["megalo", "classic-pouch"],
      ["welcome-box", "discovery-set"],
      ["family-box", "discovery-set"],
    ]) {
      expect(getProduct(old)?.handle).toBe(now);
      expect(todaysName(old)).toBe(old);
      expect(exactProduct(old)).toBeUndefined();
    }
  });

  it("is not fooled by a name every object carries", () => {
    for (const name of ["constructor", "toString", "__proto__", "get"]) {
      expect(getProduct(name)).toBeUndefined();
      expect(todaysName(name)).toBe(name);
    }
  });
});
