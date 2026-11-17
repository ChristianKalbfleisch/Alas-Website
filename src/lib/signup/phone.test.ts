import { describe, expect, it } from "vitest";
import { normalisePhone } from "./phone";

describe("normalisePhone", () => {
  it("reads US and Canadian numbers however they are typed", () => {
    expect(normalisePhone("(512) 555-0147")).toBe("+15125550147");
    expect(normalisePhone("512.555.0147")).toBe("+15125550147");
    expect(normalisePhone("1 512 555 0147")).toBe("+15125550147");
    expect(normalisePhone("+1 (416) 555-0199")).toBe("+14165550199");
  });

  it("keeps other countries that bring their code", () => {
    expect(normalisePhone("+44 7911 123456")).toBe("+447911123456");
    expect(normalisePhone("+90 532 123 45 67")).toBe("+905321234567");
  });

  it("refuses what cannot be a number", () => {
    expect(normalisePhone("")).toBeNull();
    expect(normalisePhone("555-0147")).toBeNull();
    expect(normalisePhone("(112) 555-0147")).toBeNull();
    expect(normalisePhone("+1 512 555 014")).toBeNull();
    expect(normalisePhone("call me")).toBeNull();
    expect(normalisePhone("+12")).toBeNull();
  });
});
