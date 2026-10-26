import { describe, expect, it } from "vitest";
import { editDistance, suggestEmail } from "./email-hint";

describe("suggestEmail", () => {
  it.each([
    ["ana@gmial.com", "ana@gmail.com"],
    ["ana@gmal.com", "ana@gmail.com"],
    ["ana@gmail.co", "ana@gmail.com"],
    ["ana@gmail.con", "ana@gmail.com"],
    ["ana@hotmial.com", "ana@hotmail.com"],
    ["ana@yahooo.com", "ana@yahoo.com"],
    ["ana@yaho.com", "ana@yahoo.com"],
    ["ana@outlok.com", "ana@outlook.com"],
    ["ana@iclod.com", "ana@icloud.com"],
    ["ana@icloud.cmo", "ana@icloud.com"],
    ["ana@aol.con", "ana@aol.com"],
    ["ana@live.con", "ana@live.com"],
    ["ana@alassaltco.con", "ana@alassaltco.com"],
    ["ana@studio.og", "ana@studio.org"],
  ])("%s → %s", (typed, meant) => {
    expect(suggestEmail(typed)).toBe(meant);
  });

  it.each([
    "ana@gmail.com",
    "ana@yahoo.de",
    "ana@live.ca",
    "ana@gmx.net",
    "ana@hotmail.nl",
    "ana@aon.com",
    "ana@att.com",
    "ana@verizon.com",
    "ana@alassaltco.com",
    "ana@studio.co",
    "ana@bigpond.net.au",
    "not an email",
    "ana@",
  ])("leaves %s alone", (typed) => {
    expect(suggestEmail(typed)).toBeNull();
  });

  it("keeps the name as typed and lowercases only the domain", () => {
    expect(suggestEmail("  Ana.Lima@GMIAL.com ")).toBe("Ana.Lima@gmail.com");
  });
});

describe("editDistance", () => {
  it("counts a swap of neighbours as one edit", () => {
    expect(editDistance("gmial", "gmail")).toBe(1);
    expect(editDistance("con", "com")).toBe(1);
    expect(editDistance("gmail", "gmail")).toBe(0);
    expect(editDistance("", "abc")).toBe(3);
  });
});
