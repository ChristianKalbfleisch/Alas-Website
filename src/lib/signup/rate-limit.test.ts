import { describe, expect, it } from "vitest";
import { createRateLimit } from "./rate-limit";

describe("createRateLimit", () => {
  it("lets a few through per window, per visitor", () => {
    const allow = createRateLimit({ max: 2, windowMs: 1000 });
    expect(allow("a", 0)).toBe(true);
    expect(allow("a", 10)).toBe(true);
    expect(allow("a", 20)).toBe(false);
    expect(allow("b", 20)).toBe(true);
    expect(allow("a", 1011)).toBe(true);
  });

  it("forgets the oldest visitor once it holds too many", () => {
    const allow = createRateLimit({ max: 1, windowMs: 1000, maxKeys: 2 });
    allow("a", 0);
    allow("b", 0);
    allow("c", 0);
    expect(allow("a", 1)).toBe(true);
    expect(allow("c", 1)).toBe(false);
  });
});
