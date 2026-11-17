import { describe, expect, it } from "vitest";
import {
  buildCheckoutUrl,
  cartCount,
  cartSubtotal,
  checkoutItems,
  emailLines,
  formatPrice,
  linesTotal,
} from "./cart-math";

describe("cartSubtotal", () => {
  it("sums real catalogue prices in cents without float drift", () => {
    const lines = [
      { handle: "classic-pouch", qty: 3 },
      { handle: "sticks-15", qty: 1 },
      { handle: "sticks-5", qty: 3 },
    ];
    // 3 * 32 + 24.99 + 3 * 9.99
    expect(cartSubtotal(lines)).toBe(150.96);
    expect(cartCount(lines)).toBe(7);
    expect(formatPrice(cartSubtotal(lines))).toBe("$150.96");
  });

  it("counts only what the store's checkout can charge for", () => {
    expect(cartSubtotal([{ handle: "nope", qty: 4 }])).toBe(0);
    expect(cartSubtotal([{ handle: "discover-set", qty: 1 }])).toBe(0);
    expect(cartSubtotal([])).toBe(0);
  });
});

describe("pre-orders the store cannot charge for yet", () => {
  const lines = [
    { handle: "lemon-pouch", qty: 2 },
    { handle: "classic-pouch", qty: 1 },
    { handle: "discover-set", qty: 1 },
    { handle: "nope", qty: 1 },
  ];

  it("names the lines that are pre-ordered by email", () => {
    expect(emailLines(lines).map((line) => line.handle)).toEqual([
      "lemon-pouch",
      "discover-set",
    ]);
    expect(emailLines([{ handle: "classic-pouch", qty: 3 }])).toEqual([]);
  });

  it("totals them at their own prices, apart from what checkout charges", () => {
    // 2 * 32 + 39
    expect(linesTotal(emailLines(lines))).toBe(103);
    expect(cartSubtotal(lines)).toBe(32);
    expect(linesTotal(lines)).toBe(135);
  });
});

describe("buildCheckoutUrl", () => {
  it("builds a Shopify cart permalink and merges lines of one variant", () => {
    const url = buildCheckoutUrl([
      { handle: "classic-pouch", qty: 1 },
      { handle: "classic-pouch", flavour: "Classic", qty: 2 },
      { handle: "sticks-30", qty: 1 },
    ]);
    expect(url).toBe(
      "https://alassaltco.myshopify.com/cart/42949692293225:3,42949952077929:1",
    );
    expect(url).toMatch(
      /^https:\/\/[a-z0-9-]+\.myshopify\.com\/cart\/(\d+:\d+)(,\d+:\d+)*$/,
    );
  });

  it("carries a claimed gift's code to checkout", () => {
    expect(
      buildCheckoutUrl([{ handle: "classic-pouch", qty: 1 }], {
        discount: "ALAS25",
      }),
    ).toBe(
      "https://alassaltco.myshopify.com/cart/42949692293225:1?discount=ALAS25",
    );
    expect(buildCheckoutUrl([{ handle: "classic-pouch", qty: 1 }], {})).toBe(
      "https://alassaltco.myshopify.com/cart/42949692293225:1",
    );
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
        { handle: "discover-set", qty: 1 },
        { handle: "sticks-5", qty: 2 },
      ]),
    ).toEqual([{ variantId: 42949905350761, qty: 2 }]);
  });

  it("stays on this site when nothing valid is in the cart", () => {
    expect(buildCheckoutUrl([])).toBe("/#shop");
    expect(buildCheckoutUrl([{ handle: "classic-pouch", qty: 0 }])).toBe(
      "/#shop",
    );
    expect(buildCheckoutUrl([{ handle: "discover-set", qty: 1 }])).toBe(
      "/#shop",
    );
  });

  it("sends an old Mikró line to checkout as the Classic Pouch", () => {
    expect(buildCheckoutUrl([{ handle: "mikro", qty: 2 }])).toBe(
      "https://alassaltco.myshopify.com/cart/42949692293225:2",
    );
  });
});
