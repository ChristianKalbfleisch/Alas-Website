import { describe, expect, it } from "vitest";
import {
  RITUAL,
  RITUAL_SAVE_PERCENT,
  RITUAL_SAVING,
  ritualCheckoutUrl,
  ritualLive,
} from "./ritual";

describe("The Ritual", () => {
  it("saves $39.99, 40%, against two pouches bought one at a time", () => {
    expect(RITUAL.retail).toBe(99.98);
    expect(RITUAL_SAVING).toBe(39.99);
    expect(RITUAL_SAVE_PERCENT).toBe(40);
  });

  it("takes no payment until Shopify has a selling plan", () => {
    expect(ritualLive()).toBe(RITUAL.sellingPlanId !== null);
  });

  it("builds a checkout link that clears the cart, adds the plan and opens checkout", () => {
    const url = new URL(
      ritualCheckoutUrl(123, [
        { variantId: 42949905350761, qty: 2 },
        { variantId: 1, qty: 0 },
      ]),
    );
    expect(url.origin).toBe("https://alassaltco.myshopify.com");
    expect(url.pathname).toBe("/cart/clear");
    const add = new URL(url.searchParams.get("return_to") ?? "", url.origin);
    expect(add.pathname).toBe("/cart/add");
    expect(add.searchParams.getAll("items[][id]")).toEqual([
      String(RITUAL.variantId),
      "42949905350761",
    ]);
    expect(add.searchParams.getAll("items[][quantity]")).toEqual(["1", "2"]);
    expect(add.searchParams.getAll("items[][selling_plan]")).toEqual(["123"]);
    expect(add.searchParams.get("return_to")).toBe("/checkout");
  });
});
