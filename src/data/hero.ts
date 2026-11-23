import type { StaticImageData } from "next/image";
import heroBottle from "@/assets/photos/hero-bottle.jpg";
import heroGlass from "@/assets/photos/hero-glass.jpg";
import heroLemon from "@/assets/photos/hero-lemon.jpg";
import heroPacks from "@/assets/photos/hero-packs.jpg";
import heroPlate from "@/assets/photos/hero-plate.jpg";
import type { HERO_SEA } from "./hero-sea";
import { WHY_TITLE } from "./why-salt";

export type HeroScene = {
  /** Its name, which is also the name of its open water in HERO_SEA. */
  id: (typeof HERO_SEA.scenes)[number];
  /** Its name on the row of tabs. */
  tab: string;
  /**
   * The headline. One entry is left to the browser to break evenly. A longer
   * headline is given line by line: on a wide screen each entry stands on a
   * line of its own, in type sized so that the longest fits the column.
   */
  headline: readonly string[];
  /** The line under it, phrase by phrase: it breaks between phrases first. */
  line: readonly string[];
  /** The product the main button opens the quick shop on. */
  focus?: string;
  /** The product whose price stands under the button, and what to call it there. */
  priced: { handle: string; as: string };
  photo: StaticImageData;
  /** What is in the picture, never where it was taken. */
  alt: string;
};

/**
 * The empty ledge every scene stands on. It lies under them all, so one scene
 * can leave before the next has arrived.
 */
export const HERO_PLATE: StaticImageData = heroPlate;

/**
 * The first screen, scene by scene. Every photograph shows the same ledge, sea
 * and sky, so only what stands on the ledge changes from one to the next. The
 * first scene has to say everything alone: many visitors never see another.
 */
export const HERO_SCENES: readonly HeroScene[] = [
  {
    id: "packs",
    tab: "The salt",
    headline: ["Salt your water."],
    line: [
      "Hand-harvested Greek fleur de sel.",
      "A pinch in your first glass,",
      "a stick in your bottle on the go.",
    ],
    priced: { handle: "classic-pouch", as: "The 390 g pouch" },
    photo: heroPacks,
    alt: "The ÁLAS Classic and Lemon pouches standing on a wet stone ledge, the sea behind them.",
  },
  {
    id: "glass",
    tab: "At home",
    headline: ["A pinch in your glass."],
    line: ["One 390 g pouch is roughly 260 servings."],
    focus: "classic-pouch",
    priced: { handle: "classic-pouch", as: "The 390 g pouch" },
    photo: heroGlass,
    alt: "A hand lets a pinch of fine salt fall into a glass of water beside the ÁLAS Classic pouch.",
  },
  {
    id: "bottle",
    tab: "On the go",
    headline: ["A stick in your bottle."],
    line: [
      "2.5 g sticks for the gym bag,",
      "the desk,",
      "the plane,",
      "or wherever the day takes you.",
    ],
    focus: "sticks-15",
    priced: { handle: "sticks-5", as: "Five sticks" },
    photo: heroBottle,
    alt: "A hand tips an ÁLAS Classic stick of salt into a glass bottle of water standing on the ledge.",
  },
  {
    id: "lemon",
    tab: "Lemon",
    headline: ["Lemon Zest,", "coming soon."],
    line: ["The same salt, with lemon.", "In a pouch and in sticks."],
    focus: "lemon-pouch",
    priced: { handle: "lemon-pouch", as: "The Lemon pouch" },
    photo: heroLemon,
    alt: "The ÁLAS Lemon pouch with cut lemons and a glass of water with a slice of lemon.",
  },
];

/** Where the quiet link under the price leads: the reasons, further down the page. */
export const HERO_WHY = { label: WHY_TITLE, href: "#why-salt" };
