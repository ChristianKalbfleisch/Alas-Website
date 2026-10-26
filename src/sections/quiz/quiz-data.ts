/**
 * Quiz content. Every line comes from docs/content-facts.md or src/data/products.ts.
 * Order (revision 1): about you first, then four easy questions, then your ritual.
 */

export type Choice = { label: string; correct?: boolean; close?: boolean };

export type Question = {
  prompt: string;
  choices: Choice[];
  /** Verdict when right. */
  right: string;
  /** Verdict when wrong (states the answer). */
  wrong: string;
  /** Verdict for a near miss. */
  close?: string;
  fact: string;
  /** A typographic plate instead of a photograph (one photo, one job). */
  plate: { big: string; caption: string; greek?: boolean };
};

export const LETTERS = ["Α", "Β", "Γ", "Δ", "Ε"] as const;

export const ABOUT_PROMPT = "First, about you. Which sounds most like you?";

export const QUESTIONS: Question[] = [
  {
    prompt: "Our name, ἅλας, is Greek for…",
    choices: [
      { label: "Salt", correct: true },
      { label: "The sea", close: true },
      { label: "Sunlight" },
      { label: "Stone" },
    ],
    right: "Salt. You have it.",
    wrong: "It means salt.",
    close: "Close. It means salt.",
    fact: "Say it AH-las. It is the salt in “you are the salt of the earth”. The older word, ἅλς, meant both salt and the sea. One word for both.",
    plate: { big: "ἅλας", caption: "AH-las · salt", greek: true },
  },
  {
    prompt: "When you sweat, which mineral do you lose the most?",
    choices: [
      { label: "Magnesium" },
      { label: "Sodium", correct: true },
      { label: "Potassium" },
      { label: "Calcium" },
    ],
    right: "Sodium, by far.",
    wrong: "It is sodium, by far.",
    fact: "Sweat carries water and electrolytes, and sodium is the main one. Smaller amounts of potassium, magnesium and calcium go too. Water alone has no sodium.",
    plate: { big: "Na", caption: "Sodium · the main one in sweat" },
  },
  {
    prompt: "What dries Aegean sea salt?",
    choices: [
      { label: "A wood-fired oven" },
      { label: "Volcanic heat" },
      { label: "Cool night air" },
      { label: "The sun and the meltemi wind", correct: true },
    ],
    right: "Sun and wind. Nothing else.",
    wrong: "Sun and wind. Nothing else.",
    fact: "Seawater rests in shallow clay pans. Summer sun and the meltemi, the dry north wind of the Aegean, evaporate it slowly over weeks.",
    plate: { big: "Meltemi", caption: "The dry north wind of the Aegean" },
  },
  {
    prompt: "Fleur de sel, the flower of salt, forms…",
    choices: [
      { label: "At the bottom of the pan" },
      { label: "On the surface of the water", correct: true },
      { label: "In a mine underground" },
      { label: "Inside sea shells" },
    ],
    right: "It blooms on the surface.",
    wrong: "It blooms on the surface.",
    fact: "As the brine thickens, a delicate crust of crystals forms on top. Harvesters skim it by hand with wooden tools in late summer. Up close, many crystals are hollow, stepped pyramids.",
    plate: { big: "Fleur de sel", caption: "The flower of salt" },
  },
];

export type RitualId = "gym" | "run" | "daily" | "care" | "home";

export type Ritual = {
  id: RitualId;
  /** The answer, in the owner's audience words. */
  label: string;
  /** The ritual name, in the rituals chapter's vocabulary. */
  name: string;
  line: string;
  handle: string;
};

/** Products follow the meet chapter: training and running → sticks, daily → Mikró,
 *  self-care → Mésos (two pouches), home → The Ritual (two pouches every month).
 *  `handle: "ritual"` is The Ritual, not a catalogue product. */
export const RITUALS: Ritual[] = [
  {
    id: "gym",
    label: "Training and the gym",
    name: "One stick, one bottle",
    line: "Before training and after, in the bottle you already carry.",
    handle: "sticks-15",
  },
  {
    id: "run",
    label: "Running and endurance",
    name: "One stick, one bottle",
    line: "Long runs and hot days. Thirty sticks, ready for the road.",
    handle: "sticks-30",
  },
  {
    id: "daily",
    label: "My daily wellness or supplement routine",
    name: "The morning pinch",
    line: "A pinch in your morning water. The first thing you do, every day.",
    handle: "mikro",
  },
  {
    id: "care",
    label: "My self-care and beauty routine",
    name: "The sea soak",
    line: "A warm mineral soak at the end of the day. Slow down, breathe out. Two pouches, so the bath never runs dry.",
    handle: "mesos",
  },
  {
    id: "home",
    label: "For the whole home",
    name: "The family table",
    line: "An old Greek oath was sworn by salt and table. Sharing salt meant friendship. Two pouches every month, for the whole house.",
    handle: "ritual",
  },
];

export function verdict(score: number): string {
  if (score >= 4) return "You know your salt.";
  if (score === 3) return "Almost an islander.";
  if (score === 2) return "Half salt, half sea.";
  return "Now you know your salt.";
}
