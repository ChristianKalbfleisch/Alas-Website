import type { StaticImageData } from "next/image";
import carTravel from "@/assets/photos/car-travel.jpg";
import causticsLight from "@/assets/photos/caustics-light.jpg";
import crystalsMacro from "@/assets/photos/crystals-macro.jpg";
import desk from "@/assets/photos/desk.jpg";
import glassPinch from "@/assets/photos/glass-pinch.jpg";
import gymBench from "@/assets/photos/gym-bench.jpg";
import harvestHands from "@/assets/photos/harvest-hands.jpg";
import heroBottle from "@/assets/photos/hero-bottle.jpg";
import heroGlass from "@/assets/photos/hero-glass.jpg";
import heroLemon from "@/assets/photos/hero-lemon.jpg";
import heroPacks from "@/assets/photos/hero-packs.jpg";
import kitchenMorning from "@/assets/photos/kitchen-morning.jpg";
import lemonStill from "@/assets/photos/lemon-still.jpg";
import manSeawall from "@/assets/photos/man-seawall.jpg";
import panWide from "@/assets/photos/pan-wide.jpg";
import plate from "@/assets/photos/plate.jpg";
import pour from "@/assets/photos/pour.jpg";
import stillSun from "@/assets/photos/still-sun.jpg";
import toteSticks from "@/assets/photos/tote-sticks.jpg";
import trailWide from "@/assets/photos/trail-wide.jpg";
import yogaDusk from "@/assets/photos/yoga-dusk.jpg";

export type Photo = { src: StaticImageData; alt: string };

/**
 * The campaign photographs (src/assets/photos, copied in by
 * scripts/sync-photos.py). Every alt line says what is in the picture, never
 * where it was taken.
 */
export const PHOTOS = {
  /** Three of the first screen's scenes, shown again where each product is sold. */
  ledgeGlass: {
    src: heroGlass,
    alt: "A hand lets a pinch of fine salt fall into a glass of water beside the ALAS Classic pouch, the sea behind.",
  },
  ledgeBottle: {
    src: heroBottle,
    alt: "A hand tips an ALAS Classic stick of salt into a glass bottle of water standing on the ledge.",
  },
  ledgeLemon: {
    src: heroLemon,
    alt: "The ALAS Lemon pouch with cut lemons and a glass of water with a slice of lemon.",
  },
  stillSun: {
    src: stillSun,
    alt: "The ALAS Classic pouch, a torn stick and a glass of water on pale stone in hard sunlight.",
  },
  pour: {
    src: pour,
    alt: "Two hands tear an ALAS Classic stick and pour the salt into a glass of water.",
  },
  glassPinch: {
    src: glassPinch,
    alt: "A hand lets a pinch of fine salt fall into a glass of water against a dark navy background.",
  },
  toteSticks: {
    src: toteSticks,
    alt: "ALAS Classic sticks beside a glass water bottle, sunglasses, keys and a navy tote in the sun.",
  },
  plate: {
    src: plate,
    alt: "A hand pinches salt over sliced tomatoes and cucumber at an outdoor table, the ALAS Classic pouch behind.",
  },
  crystals: {
    src: crystalsMacro,
    alt: "A close-up of fine, moist sea salt crystals on wet black slate.",
  },
  harvest: {
    src: harvestHands,
    alt: "Two hands lift wet white salt from the surface of a salt pan with a wooden skimmer.",
  },
  pans: {
    src: panWide,
    alt: "Shallow salt pans in the morning, with small heaps of white salt along one bank.",
  },
  lemon: {
    src: lemonStill,
    alt: "The ALAS Lemon pouch on a white ledge with cut lemons and a glass of water.",
  },
  kitchen: {
    src: kitchenMorning,
    alt: "A man stirs a glass of water at a kitchen counter in the morning, the ALAS Classic pouch beside him.",
  },
  seawall: {
    src: manSeawall,
    alt: "A man drinks water from a glass bottle after a run, sitting by the sea.",
  },
  gym: {
    src: gymBench,
    alt: "A woman on a gym bench tears an ALAS stick over her water bottle.",
  },
  desk: {
    src: desk,
    alt: "A woman at her desk tears an ALAS stick over a glass of water.",
  },
  car: {
    src: carTravel,
    alt: "A woman in a parked car pours an ALAS stick into a bottle of water.",
  },
  dusk: {
    src: yogaDusk,
    alt: "A man sits cross-legged on a terrace above the sea at dusk, a glass of water beside him.",
  },
  trail: {
    src: trailWide,
    alt: "Two runners on a path along a rocky headland high above a deep blue sea.",
  },
  range: {
    src: heroPacks,
    alt: "The ALAS Classic and Lemon pouches standing on a wet stone ledge, the sea behind them.",
  },
  caustics: {
    src: causticsLight,
    alt: "",
  },
} satisfies Record<string, Photo>;
