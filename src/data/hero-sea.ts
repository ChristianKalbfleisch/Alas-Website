/**
 * The open water in the hero photographs. Written by scripts/hero-sea.py:
 * run it again with new photographs rather than editing this by hand.
 * Every scene shows the same sea, so there is one band of it: top, horizon
 * and bottom are fractions of a photograph's height. Each file holds the
 * band with, beneath it, the mask of the empty ledge and then one mask per
 * scene, in the order of scenes.
 */
export const HERO_SEA = {
  top: 0.5781,
  horizon: 0.5896,
  bottom: 0.8125,
  scenes: ["packs", "glass", "bottle", "lemon"],
  wide: "/hero/sea-2560.e23e6d49.webp",
  small: "/hero/sea-1280.85f2d799.webp",
} as const;

/** The sunlit shallows behind the shop: the picture, and its width over its height. */
export const SHALLOWS = {
  src: "/hero/shallows-1600.899c8947.webp",
  ratio: 1.7758,
} as const;
