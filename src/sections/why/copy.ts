/**
 * Every sentence in the WHY chapter, in one place for review.
 * Each line traces to docs/content-facts.md ("Why salt", "The brand", "Words").
 * Plain words for a mass audience; "sodium chloride" only in body text.
 * Not here on purpose (other chapters own them): "Hand-harvested · Sun-dried ·
 * Nothing added" (origin), "One stick, one bottle" (rituals, sticks).
 */

export const OPENER = {
  label: "/ Why salt",
  /** Sentence case, one italic word: before, italic, after. */
  statement: ["You don't", "just", "sweat water."],
} as const;

export const FACTS = [
  { n: "01", text: "When you sweat, you lose salt too. Mostly sodium." },
  { n: "02", text: "Plain water puts back the water. Not the salt." },
  {
    n: "03",
    text: "Electrolytes help your body hold on to water. A pinch of sea salt puts sodium in your glass.",
  },
] as const;

export const PHOTO_LABELS = {
  before: "/ Plain water",
  after: "/ Water + a pinch of salt",
  salt: "/ Salt",
} as const;

export const PURITY = {
  label: "/ Purity and source",
  title: "Not all salt is the same.",
  lead: "What's done to salt decides what's in it.",
  refined: {
    tag: "/ Refined",
    name: "Refined table salt",
    body: "Stripped down to almost pure sodium chloride. Anti-caking agents are often added.",
  },
  unrefined: {
    tag: "/ Unrefined",
    name: "ALAS Aegean sea salt",
    body: "Unrefined, so it keeps small amounts of the minerals that were in the seawater, like magnesium, potassium and calcium.",
  },
} as const;

/** Ingredient types, not any one brand's label. Marked illustrative on the page. */
export const SPORTS_DRINK = [
  "Water",
  "Sugar or sweeteners",
  "Acids",
  "Electrolyte salts",
  "Flavorings",
  "Stabilizers",
  "Colors",
] as const;

export const LABELS = {
  label: "/ Label vs label",
  title: "Turn it over.",
  drink: "A typical sports drink",
  ingredients: "Ingredients",
  drinkNote: "Illustrative. Ingredients vary by brand and flavor.",
  front: "Hydration Element",
  alas: "Aegean sea salt.",
  alasNote: "Plain ALAS salt. Flavored versions differ.",
  quiz: "Find your salt",
} as const;
