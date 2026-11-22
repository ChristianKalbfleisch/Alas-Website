import { describe, expect, it } from "vitest";
import { discounted } from "@/data/campaign";
import { getProduct, isPriced, products } from "@/data/products";
import {
  buildCheckoutUrl,
  cartCount,
  cartSubtotal,
  checkoutItems,
  emailLines,
  formatPrice,
  linesTotal,
  MAX_QTY,
  ORDER_MARK,
  priceTimes,
  savedCart,
  sellable,
} from "./cart-math";

describe("priceTimes", () => {
  it("multiplies in whole cents", () => {
    expect(priceTimes(32.49, 5)).toBe(162.45);
    expect(priceTimes(49.99, 3)).toBe(149.97);
    expect(priceTimes(64.99, 6)).toBe(389.94);
    expect(priceTimes(12.99, 1)).toBe(12.99);
  });

  it("gives a page the cart's own figure for the same amount, at every step", () => {
    // Half-cent cases where multiplying dollars first used to differ by a cent.
    const cases: [string, number, number][] = [
      ["sticks-15", 5, 10],
      ["sticks-15", 10, 5],
      ["sticks-15", 10, 15],
      ["sticks-30", 6, 25],
    ];
    for (const [handle, qty, percent] of cases) {
      const price = getProduct(handle)?.price as number;
      expect(discounted(priceTimes(price, qty), percent)).toBe(
        discounted(cartSubtotal([{ handle, qty }]), percent),
      );
    }
    // And for every product that goes to checkout, every amount, every step.
    for (const product of products.filter(isPriced)) {
      for (let qty = 1; qty <= 12; qty++) {
        for (const percent of [0, 5, 10, 15, 20, 25]) {
          expect(
            discounted(priceTimes(product.price, qty), percent),
            `${product.handle} x ${qty} at ${percent}%`,
          ).toBe(
            discounted(
              cartSubtotal([{ handle: product.handle, qty }]),
              percent,
            ),
          );
        }
      }
    }
  });
});

describe("cartSubtotal", () => {
  it("sums real catalogue prices in cents without float drift", () => {
    const lines = [
      { handle: "classic-pouch", qty: 3 },
      { handle: "sticks-15", qty: 1 },
      { handle: "sticks-5", qty: 3 },
    ];
    // 3 * 49.99 + 32.49 + 3 * 12.99
    expect(cartSubtotal(lines)).toBe(221.43);
    expect(cartCount(lines)).toBe(7);
    expect(formatPrice(cartSubtotal(lines))).toBe("$221.43");
  });

  it("counts only what the store's checkout can charge for", () => {
    expect(cartSubtotal([{ handle: "nope", qty: 4 }])).toBe(0);
    expect(cartSubtotal([{ handle: "discovery-set", qty: 1 }])).toBe(0);
    expect(cartSubtotal([])).toBe(0);
  });
});

describe("pre-orders the store cannot charge for yet", () => {
  const lines = [
    { handle: "lemon-pouch", qty: 2 },
    { handle: "classic-pouch", qty: 1 },
    { handle: "discovery-set", qty: 1 },
    { handle: "nope", qty: 1 },
  ];

  it("names the lines that are pre-ordered by email", () => {
    expect(emailLines(lines).map((line) => line.handle)).toEqual([
      "lemon-pouch",
      "discovery-set",
    ]);
    expect(emailLines([{ handle: "classic-pouch", qty: 3 }])).toEqual([]);
  });

  it("totals them at their own prices, apart from what checkout charges", () => {
    // 2 * 49.99 + 39
    expect(linesTotal(emailLines(lines))).toBe(138.98);
    expect(cartSubtotal(lines)).toBe(49.99);
    expect(linesTotal(lines)).toBe(188.97);
  });
});

describe("buildCheckoutUrl", () => {
  it("builds a Shopify cart permalink and merges lines of one variant", () => {
    const url = buildCheckoutUrl([
      { handle: "classic-pouch", qty: 1 },
      { handle: "classic-pouch", flavour: "Classic", qty: 2 },
      { handle: "sticks-30", qty: 1 },
    ]);
    expect(url.split("?")[0]).toBe(
      "https://alassaltco.myshopify.com/cart/42949692293225:3,42949952077929:1",
    );
    expect(url.split("?")[0]).toMatch(
      /^https:\/\/[a-z0-9-]+\.myshopify\.com\/cart\/(\d+:\d+)(,\d+:\d+)*$/,
    );
  });

  it("marks the order as a pre-order from this site, for the store's admin", () => {
    const url = buildCheckoutUrl([{ handle: "classic-pouch", qty: 1 }]);
    expect(url).toBe(
      "https://alassaltco.myshopify.com/cart/42949692293225:1?attributes%5BWebsite%5D=Pre-order",
    );
    expect(new URL(url).searchParams.get(`attributes[${ORDER_MARK.key}]`)).toBe(
      ORDER_MARK.value,
    );
  });

  it("carries a claimed gift's code to checkout", () => {
    expect(
      buildCheckoutUrl([{ handle: "classic-pouch", qty: 1 }], {
        discount: "ALAS25",
      }),
    ).toBe(
      "https://alassaltco.myshopify.com/cart/42949692293225:1?discount=ALAS25&attributes%5BWebsite%5D=Pre-order",
    );
    expect(
      new URL(
        buildCheckoutUrl([{ handle: "classic-pouch", qty: 1 }], {}),
      ).searchParams.has("discount"),
    ).toBe(false);
    expect(buildCheckoutUrl([], { discount: "ALAS25" })).toBe("/#shop");
  });

  it("fills in the email the visitor already gave", () => {
    const url = new URL(
      buildCheckoutUrl([{ handle: "classic-pouch", qty: 1 }], {
        discount: "ALAS10",
        email: "ana+salt@gmail.com",
      }),
    );
    expect(url.searchParams.get("discount")).toBe("ALAS10");
    expect(url.searchParams.get("checkout[email]")).toBe("ana+salt@gmail.com");
  });

  it("never sends a product the store does not hold to checkout", () => {
    expect(
      checkoutItems([
        { handle: "discovery-set", qty: 1 },
        { handle: "sticks-5", qty: 2 },
      ]),
    ).toEqual([{ variantId: 42949905350761, qty: 2 }]);
  });

  it("stays on this site when nothing valid is in the cart", () => {
    expect(buildCheckoutUrl([])).toBe("/#shop");
    expect(buildCheckoutUrl([{ handle: "classic-pouch", qty: 0 }])).toBe(
      "/#shop",
    );
    expect(buildCheckoutUrl([{ handle: "discovery-set", qty: 1 }])).toBe(
      "/#shop",
    );
  });

  it("never sends a retired name to checkout as today's product", () => {
    for (const handle of ["mikro", "mesos", "megalo"]) {
      expect(getProduct(handle)?.handle).toBe("classic-pouch");
      expect(buildCheckoutUrl([{ handle, qty: 2 }])).toBe("/#shop");
      expect(cartSubtotal([{ handle, qty: 2 }])).toBe(0);
    }
  });
});

describe("a saved cart", () => {
  it("keeps the lines of products sold today, with their quantities", () => {
    expect(
      savedCart([
        { handle: "classic-pouch", qty: 2 },
        { handle: "lemon-sticks-5", qty: 1 },
        { handle: "discovery-set", qty: 3 },
      ]),
    ).toEqual([
      { handle: "classic-pouch", qty: 2 },
      { handle: "lemon-sticks-5", qty: 1 },
      { handle: "discovery-set", qty: 3 },
    ]);
  });

  it("drops retired products instead of turning them into today's", () => {
    // As an earlier version saved it: three pouch sizes and two boxes.
    const old = [
      { handle: "megalo", qty: 1 },
      { handle: "mikro", qty: 1 },
      { handle: "mesos", qty: 2 },
      { handle: "family-box", qty: 2 },
      { handle: "welcome-box", qty: 1 },
      { handle: "sticks-15", flavour: "Lemon", qty: 1 },
    ];
    for (const { handle } of old.slice(0, 5)) {
      expect(sellable(handle), handle).toBe(false);
    }
    expect(savedCart(old)).toEqual([{ handle: "sticks-15", qty: 1 }]);
  });

  it("keeps the set that was saved under the first spelling of its name, as today's", () => {
    expect(
      savedCart([
        { handle: "discover-set", qty: 2 },
        { handle: "lemon-pouch", qty: 1 },
        { handle: "discovery-set", qty: 1 },
      ]),
    ).toEqual([
      { handle: "discovery-set", qty: 3 },
      { handle: "lemon-pouch", qty: 1 },
    ]);
    // An earlier spelling is the same product; a retired one is not.
    expect(sellable("discover-set")).toBe(false);
  });

  it("folds two lines of one product into one and stops at 99", () => {
    expect(MAX_QTY).toBe(99);
    expect(
      savedCart([
        { handle: "classic-pouch", qty: 60 },
        { handle: "classic-pouch", qty: 60 },
        { handle: "sticks-5", qty: 1_000_000_000 },
      ]),
    ).toEqual([
      { handle: "classic-pouch", qty: 99 },
      { handle: "sticks-5", qty: 99 },
    ]);
  });

  it("drops anything that is not a line, and takes anything that is not a list as empty", () => {
    expect(
      savedCart([
        null,
        "classic-pouch",
        { handle: "classic-pouch" },
        { handle: "classic-pouch", qty: 0 },
        { handle: "classic-pouch", qty: -1 },
        { handle: "classic-pouch", qty: 1.5 },
        { handle: "classic-pouch", qty: "2" },
        { handle: 7, qty: 1 },
        { handle: "constructor", qty: 1 },
        { handle: "toString", qty: 1 },
        { handle: "sea-water", qty: 1 },
      ]),
    ).toEqual([]);
    for (const raw of [null, undefined, "[]", {}, 3]) {
      expect(savedCart(raw)).toEqual([]);
    }
  });
});
