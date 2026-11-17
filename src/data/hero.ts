import type { StaticImageData } from "next/image";
import heroBottle from "@/assets/photos/hero-bottle.jpg";
import heroGlass from "@/assets/photos/hero-glass.jpg";
import heroLemon from "@/assets/photos/hero-lemon.jpg";
import heroPacks from "@/assets/photos/hero-packs.jpg";
import heroPlate from "@/assets/photos/hero-plate.jpg";
import type { HERO_SEA } from "./hero-sea";

export type HeroScene = {
  /** Its name, which is also the name of its open water in HERO_SEA. */
  id: (typeof HERO_SEA.scenes)[number];
  /** Its name on the row of tabs. */
  tab: string;
  headline: string;
  /** The line under it, sentence by sentence: it breaks between sentences first. */
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
    headline: "Salt your water.",
    line: [
      "Hand-harvested Greek fleur de sel.",
      "A pinch in your glass, a stick in your bottle.",
    ],
    priced: { handle: "classic-pouch", as: "The 390 g pouch" },
    photo: heroPacks,
    alt: "The ALAS Classic and Lemon pouches standing on a wet stone ledge, the sea behind them.",
  },
  {
    id: "glass",
    tab: "At home",
    headline: "A pinch in your glass.",
    line: ["One 390 g pouch is about 260 servings."],
    focus: "classic-pouch",
    priced: { handle: "classic-pouch", as: "The 390 g pouch" },
    photo: heroGlass,
    alt: "A hand lets a pinch of fine salt fall into a glass of water beside the ALAS Classic pouch.",
  },
  {
    id: "bottle",
    tab: "On the go",
    headline: "A stick in your bottle.",
    line: ["2.5 g sticks for the gym bag, the desk and the plane."],
    focus: "sticks-15",
    priced: { handle: "sticks-5", as: "Five sticks" },
    photo: heroBottle,
    alt: "A hand tips an ALAS Classic stick of salt into a glass bottle of water standing on the ledge.",
  },
  {
    id: "lemon",
    tab: "Lemon",
    headline: "Now in Lemon.",
    line: ["The same salt, with lemon.", "In a pouch and in sticks."],
    focus: "lemon-pouch",
    priced: { handle: "lemon-pouch", as: "The Lemon pouch" },
    photo: heroLemon,
    alt: "The ALAS Lemon pouch with cut lemons and a glass of water with a slice of lemon.",
  },
];
