import { describe, expect, it } from "vitest";
import {
  applicationNote,
  checkApplication,
  WHOLESALE_PRODUCTS,
  wholesaleTags,
} from "./wholesale";

const FORM = {
  business: "  Salt & Stone   Market ",
  name: "Maya Ortiz",
  email: "maya@saltstone.com",
  phone: "(512) 555-0147",
  website: "saltstone.com",
  type: "shop",
  location: "Austin, TX",
  volume: "50-200",
  products: ["sticks", "pouches", "boxes", "caviar"],
  message: "We would love to carry the pouches.",
  updates: true,
};

describe("checkApplication", () => {
  it("cleans a full application", () => {
    const checked = checkApplication(FORM);
    expect(checked).toEqual({
      ok: true,
      value: {
        business: "Salt & Stone Market",
        name: "Maya Ortiz",
        email: "maya@saltstone.com",
        phone: "+15125550147",
        website: "saltstone.com",
        type: "shop",
        location: "Austin, TX",
        volume: "50-200",
        products: ["pouches", "sticks"],
        message: "We would love to carry the pouches.",
        updates: true,
      },
    });
  });

  it("needs the business, the name, a real email, a type and a place", () => {
    expect(checkApplication({ ...FORM, business: " " })).toEqual({
      ok: false,
      error: "missing_business",
    });
    expect(checkApplication({ ...FORM, name: "" })).toMatchObject({
      error: "missing_name",
    });
    expect(checkApplication({ ...FORM, email: "maya@" })).toMatchObject({
      error: "invalid_email",
    });
    expect(checkApplication({ ...FORM, phone: "555" })).toMatchObject({
      error: "invalid_phone",
    });
    expect(checkApplication({ ...FORM, type: "casino" })).toMatchObject({
      error: "invalid_type",
    });
    expect(checkApplication({ ...FORM, location: "" })).toMatchObject({
      error: "missing_location",
    });
    expect(
      checkApplication({ ...FORM, message: "x".repeat(1501) }),
    ).toMatchObject({ error: "too_long" });
    expect(checkApplication(null)).toMatchObject({ error: "missing_business" });
  });

  it("drops unknown volumes and keeps optional fields optional", () => {
    const checked = checkApplication({
      ...FORM,
      phone: "",
      volume: "lots",
      products: "pouches",
      updates: "yes",
    });
    expect(checked).toMatchObject({
      ok: true,
      value: { phone: null, volume: "", products: [], updates: false },
    });
  });
});

describe("applicationNote", () => {
  it("reads like a note the team can act on", () => {
    const checked = checkApplication(FORM);
    if (!checked.ok) throw new Error("expected a valid application");
    expect(
      applicationNote(checked.value, new Date("2026-11-13T09:00:00Z")),
    ).toBe(
      [
        "Wholesale application, 2026-11-13 (website)",
        "Business: Salt & Stone Market",
        "Contact: Maya Ortiz",
        "Type: Shop or market",
        "Location: Austin, TX",
        "Website: saltstone.com",
        "Phone: +15125550147",
        "Monthly order: 50 to 200 a month",
        "Interested in: Pouches, Classic Sticks",
        "Message: We would love to carry the pouches.",
        "Wholesale news by email: yes",
      ].join("\n"),
    );
    expect(wholesaleTags(checked.value)).toEqual([
      "site-wholesale",
      "wholesale-applicant",
      "wholesale-shop",
    ]);
  });
});

describe("what a business can ask for", () => {
  it("offers pouches and sticks, and nothing the site does not sell", () => {
    expect(WHOLESALE_PRODUCTS.map((p) => p.label)).toEqual([
      "Pouches",
      "Classic Sticks",
    ]);
  });
});
