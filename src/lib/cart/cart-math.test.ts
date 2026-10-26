import { describe, expect, it } from "vitest";
import {
  buildCheckoutUrl,
  cartCount,
  cartSubtotal,
  checkoutItems,
  formatPrice,
} from "./cart-math";

describe("cartSubtotal", () => {
  it("sums real catalogue prices in cents without float drift", () => {
    const lines = [
      { handle: "mikro", qty: 1 },
      { handle: "mesos", qty: 2 },
      { handle: "sticks-5", qty: 3 },
    ];
    // 49.99 + 2 * 99.98 + 3 * 9.99
    expect(cartSubtotal(lines)).toBe(279.92);
    expect(cartCount(lines)).toBe(6);
    expect(formatPrice(cartSubtotal(lines))).toBe("$279.92");
  });

  it("ignores unknown handles and products waiting on a new price", () => {
    expect(cartSubtotal([{ handle: "nope", qty: 4 }])).toBe(0);
    expect(cartSubtotal([{ handle: "family-box", qty: 1 }])).toBe(0);
    expect(cartSubtotal([])).toBe(0);
  });
});

describe("buildCheckoutUrl", () => {
  it("builds a Shopify cart permalink and merges lines of one variant", () => {
    const url = buildCheckoutUrl([
      { handle: "mikro", qty: 1 },
      { handle: "mikro", flavour: "Regular", qty: 2 },
      { handle: "sticks-30", qty: 1 },
    ]);
    expect(url).toBe(
      "https://alassaltco.myshopify.com/cart/42949692293225:3,42949952077929:1",
    );
    expect(url).toMatch(
      /^https:\/\/[a-z0-9-]+\.myshopify\.com\/cart\/(\d+:\d+)(,\d+:\d+)*$/,
    );
  });

  it("never sends a product without a current price to checkout", () => {
    expect(
      checkoutItems([
        { handle: "megalo", qty: 1 },
        { handle: "sticks-5", qty: 2 },
      ]),
    ).toEqual([{ variantId: 42949905350761, qty: 2 }]);
  });

  it("stays on this site when nothing valid is in the cart", () => {
    expect(buildCheckoutUrl([])).toBe("/#shop");
    expect(buildCheckoutUrl([{ handle: "mesos", qty: 0 }])).toBe("/#shop");
    expect(buildCheckoutUrl([{ handle: "welcome-box", qty: 1 }])).toBe(
      "/#shop",
    );
  });
});
