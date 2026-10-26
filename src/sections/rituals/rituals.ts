import { type ArtImage, art } from "@/data/art";

/**
 * A day in three named rituals, one vocabulary across the site (quiz uses the same
 * names). Rituals, never treatments: every "when" line comes from content-facts.
 */
export type Ritual = {
  n: string;
  label: string;
  /** The name people repeat. */
  name: string;
  /** Plain line that lets each audience see itself. */
  line: string;
  when: string;
  photo: ArtImage;
  focus: string;
  /** Shopify handle of the product that fits, if this ritual sells one. */
  product?: string;
  /** Placement on the 12-column grid (desktop) and the mobile inset. */
  place: string;
  frame: string;
  sizes: string;
  /** Image parallax travel, percent of its height. Text never moves with scroll. */
  drift: number;
};

export const RITUALS: Ritual[] = [
  {
    n: "01",
    label: "Morning",
    name: "The morning pinch.",
    line: "The simplest thing in your stack. A pinch of the Aegean in your first glass of water, next to your vitamins.",
    when: "First thing, before the coffee. A pinch in your morning water.",
    photo: art.photo.morning,
    focus: "58% 50%",
    product: "mikro",
    place: "md:col-span-5 md:col-start-1",
    frame: "aspect-[4/5]",
    sizes: "(min-width: 768px) 38vw, 100vw",
    drift: -6,
  },
  {
    n: "02",
    label: "Training",
    name: "One stick, one bottle.",
    line: "For runners, lifters and long hot days. When you sweat, you lose salt as well as water.",
    when: "Before and after training, long runs, hot days, the sauna, flights.",
    photo: art.photo.runnerBottle,
    focus: "40% 55%",
    product: "sticks-15",
    place: "ml-[10%] md:col-span-4 md:col-start-8 md:mt-[22vh] md:ml-0",
    frame: "aspect-[4/5]",
    sizes: "(min-width: 768px) 30vw, 90vw",
    drift: -12,
  },
  {
    n: "03",
    label: "Night",
    name: "The sea soak.",
    line: "Self-care, the slow way. Warm water, a little of the sea, and nowhere to be.",
    when: "A warm mineral soak in the bath, or a warm salt compress. For external use.",
    photo: art.photo.bath,
    focus: "50% 70%",
    place: "md:col-span-6 md:col-start-2 md:mt-[2vh]",
    frame: "aspect-[3/2]",
    sizes: "(min-width: 768px) 46vw, 100vw",
    drift: -8,
  },
];
