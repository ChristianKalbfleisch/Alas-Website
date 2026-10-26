/**
 * Art manifest. Every image and video the sections use lives here, with its real
 * size, so layout never jumps. Files arrive from the Blender and photo pipelines;
 * until a final file lands, a same-size placeholder sits at the same path.
 *
 * Photography: Codex and Gamma. Video: the Blender seawater loop. Crystals and
 * the salt mound: Codex studio macros keyed out of black (transparent PNGs that
 * read best over photos or water).
 */

export type ArtImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

export const art = {
  water: {
    loopMp4: "/art/water/hero-loop.mp4",
    loopWebm: "/art/water/hero-loop.webm",
    poster: {
      src: "/art/water/hero-poster.jpg",
      width: 1920,
      height: 1080,
      alt: "Clear shallow Aegean water over white sand, sunlight dancing on the seabed",
    },
  },
  photo: {
    saltPans: {
      src: "/art/photo/salt-pans-wide.jpg",
      width: 2400,
      height: 1349,
      alt: "Aegean salt pans at early morning, a harvester raking white salt into mounds",
    },
    fleurMacro: {
      src: "/art/photo/fleur-de-sel-macro.jpg",
      width: 2100,
      height: 1400,
      alt: "Fleur de sel crystals forming on the surface of a salt pan",
    },
    hands: {
      src: "/art/photo/hands-salt.jpg",
      width: 1122,
      height: 1402,
      alt: "Weathered hands lifting a scoop of white sea salt from the pan",
    },
    cove: {
      src: "/art/photo/cove-aerial.jpg",
      width: 2400,
      height: 1351,
      alt: "White volcanic rock meeting clear turquoise Aegean water, seen from above",
    },
    wall: {
      src: "/art/photo/whitewash-wall.jpg",
      width: 1122,
      height: 1402,
      alt: "A whitewashed Cycladic wall with the shadow of an olive branch and a blue door",
    },
    horizon: {
      src: "/art/photo/sea-horizon.jpg",
      width: 2600,
      height: 1114,
      alt: "A calm Aegean sea at midday from a stone terrace, an island on the horizon",
    },
    glass: {
      src: "/art/photo/glass-ritual.jpg",
      width: 1120,
      height: 1400,
      alt: "A glass of water in morning sun with sea salt crystals and half a lemon",
    },
    bath: {
      src: "/art/photo/bath-ritual.jpg",
      width: 1120,
      height: 1400,
      alt: "A stone bathtub in a whitewashed room with a bowl of sea salt",
    },
    tableSalt: {
      src: "/art/photo/table-salt-macro.jpg",
      width: 2100,
      height: 1400,
      alt: "Refined table salt: tiny uniform white cubes and fine dust",
    },
    morning: {
      src: "/art/photo/morning-window.jpg",
      width: 1440,
      height: 1800,
      alt: "A pinch of sea salt over a glass of water on a whitewashed windowsill at first light",
    },
    runnerBottle: {
      src: "/art/photo/runner-bottle.jpg",
      width: 1440,
      height: 1800,
      alt: "A runner pausing on a coastal path with a clear water bottle",
    },
    runner: {
      src: "/art/photo/runner-coast.jpg",
      width: 2400,
      height: 1350,
      alt: "A runner on a coastal path above an Aegean bay at sunrise",
    },
  },
  /** Photoreal usage sequence (Codex): one locked camera, only the action changes. 2400×1351. */
  howto: [
    {
      src: "/art/howto/step-1-tear.jpg",
      width: 2400,
      height: 1351,
      alt: "Hands tearing open a navy ALAS stick above a glass of water on a sunlit stone ledge by the sea",
    },
    {
      src: "/art/howto/step-2-pour.jpg",
      width: 2400,
      height: 1351,
      alt: "A stream of white salt crystals pouring from the stick into the glass",
    },
    {
      src: "/art/howto/step-3-stir.jpg",
      width: 2400,
      height: 1351,
      alt: "A silver spoon stirring the water as the crystals dissolve",
    },
    {
      src: "/art/howto/step-4-drink.jpg",
      width: 2400,
      height: 1351,
      alt: "A hand lifting the glass toward the Aegean, ready to drink",
    },
  ],
  /** Museum-style photographs of Greek antiquities (Gamma), warm off-white backgrounds. */
  museum: {
    aphrodite: {
      src: "/art/photo/aphrodite-relief.jpg",
      width: 1440,
      height: 1788,
      alt: "A fragment of a white marble relief: Aphrodite rising from carved sea foam",
    },
    homer: {
      src: "/art/photo/homer-bust.jpg",
      width: 1440,
      height: 1788,
      alt: "A white marble bust of Homer in afternoon sun",
    },
    kylix: {
      src: "/art/photo/kylix-dolphins.jpg",
      width: 1600,
      height: 1600,
      alt: "An Attic black-figure cup painted with a ship and leaping dolphins",
    },
    bowl: {
      src: "/art/photo/bowl-salt-bread.jpg",
      width: 1440,
      height: 1800,
      alt: "A white marble bowl of sea salt beside a broken loaf of bread",
    },
    coins: {
      src: "/art/photo/coins-salt.jpg",
      width: 1440,
      height: 1800,
      alt: "Worn ancient silver coins half-buried in a heap of sea salt",
    },
  },
  three: {
    crystalHero: {
      src: "/art/3d/crystal-hero.png",
      width: 2000,
      height: 2000,
      alt: "A single fleur de sel crystal, a hollow stepped pyramid",
    },
    crystals: [1, 2, 3, 4, 5, 6].map((n) => ({
      src: `/art/3d/crystal-0${n}.png`,
      width: 600,
      height: 600,
      alt: "",
    })),
    mound: {
      src: "/art/3d/salt-mound.png",
      width: 2000,
      height: 1500,
      alt: "A small mound of coarse white sea salt",
    },
  },
} as const;
