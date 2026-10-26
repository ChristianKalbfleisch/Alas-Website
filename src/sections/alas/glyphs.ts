/**
 * The Greek word on stage. ἅλας (salt) sheds its second alpha to become ἅλς,
 * the older word for salt and sea. Each glyph is its own element; `at` gives its
 * slot in every form it belongs to.
 */
export type Form = "hal" | "hals";

export const FORMS: Record<Form, string[]> = {
  hal: ["ἅ", "λ", "α", "ς"],
  hals: ["ἅ", "λ", "ς"],
};

export type Glyph = {
  id: string;
  ch: string;
  at: Partial<Record<Form, number>>;
  /** Shows only the breathing mark and accent of ἅ (masked to the band above the x-height). */
  marks?: boolean;
};

export const GLYPHS: Glyph[] = [
  { id: "a1", ch: "α", at: { hal: 0, hals: 0 } },
  { id: "l", ch: "λ", at: { hal: 1, hals: 1 } },
  { id: "a2", ch: "α", at: { hal: 2 } },
  { id: "s", ch: "ς", at: { hal: 3, hals: 2 } },
  { id: "m", ch: "ἅ", at: { hal: 0, hals: 0 }, marks: true },
];
