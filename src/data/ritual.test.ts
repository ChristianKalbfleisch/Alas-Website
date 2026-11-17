import { describe, expect, it } from "vitest";
import { getProduct } from "./products";
import {
  RITUAL,
  ritualCadence,
  ritualCheckoutUrl,
  ritualLive,
  ritualPrice,
} from "./ritual";

describe("The Ritual", () => {
  it("ships the Classic Pouch every 30 or 90 days, 90 first", () => {
    expect(RITUAL.pouches).toBe(1);
    expect(getProduct("classic-pouch")?.variantId).toBe(RITUAL.variantId);
    expect(RITUAL.cadences[0]).toBe(90);
    expect(ritualCadence()).toBe("A pouch every 30 or 90 days");
  });

  it("shows no price and takes no payment until both are set", () => {
    expect(ritualLive()).toBe(
      RITUAL.sellingPlanId !== null && RITUAL.price !== null,
    );
    expect(ritualPrice()).toEqual(
      RITUAL.price === null
        ? "Price at launch"
        : expect.stringMatching(/^\$[\d.,]+ a pouch$/),
    );
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
