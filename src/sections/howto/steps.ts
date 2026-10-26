import type { ArtImage } from "@/data/art";

export type HowToFrames = readonly ArtImage[];

export type HowToStep = {
  n: string;
  label: string;
  line: string;
};

export const STEPS: HowToStep[] = [
  { n: "01", label: "Tear", line: "Tear the stick open at the notch." },
  { n: "02", label: "Pour", line: "Pour it into your water." },
  { n: "03", label: "Stir", line: "Stir or shake until it dissolves." },
  { n: "04", label: "Drink", line: "Drink. A squeeze of lemon, if you like." },
];

export const CLOSING_LINE = "One stick. One glass.";

/** The frames share one camera; crops keep the glass and hands in view. */
export const FRAME_FOCUS = "64% 55%";
