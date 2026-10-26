import { describe, expect, it } from "vitest";
import {
  grainsFor,
  grainsLabel,
  grainsValue,
  POINTS_BACK_PERCENT,
} from "./points";

describe("grains", () => {
  it("earns one grain per whole dollar", () => {
    expect(grainsFor(49.99)).toBe(49);
    expect(grainsFor(99.98)).toBe(99);
    expect(grainsFor(0)).toBe(0);
    expect(grainsFor(-5)).toBe(0);
  });

  it("is worth $5 per 100 grains, 5% back", () => {
    expect(grainsValue(99)).toBe(0);
    expect(grainsValue(100)).toBe(5);
    expect(grainsValue(260)).toBe(10);
    expect(POINTS_BACK_PERCENT).toBe(5);
  });

  it("reads naturally", () => {
    expect(grainsLabel(1)).toBe("1 grain");
    expect(grainsLabel(1240)).toBe("1,240 grains");
  });
});
