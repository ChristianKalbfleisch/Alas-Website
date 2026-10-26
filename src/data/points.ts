/**
 * ALAS points, called grains: earned on every order, spent on the next one.
 * The owners decided on points for every purchase after the site preview. The
 * rates below are a proposal until they confirm them: one grain per dollar and
 * $5 off per 100 grains, which is 5% back. Nothing is earned or spent until a
 * points backend is connected (`live`).
 */
export const POINTS = {
  /** What a point is called, singular and plural. */
  one: "grain",
  many: "grains",
  /** Grains for every whole dollar spent. */
  perDollar: 1,
  /** Grains for one reward, and what that reward takes off an order. */
  rewardAt: 100,
  rewardValue: 5,
  live: false,
} as const;

const wholeDollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** "$5": the reward in whole dollars. */
export const REWARD_LABEL = wholeDollars.format(POINTS.rewardValue);

export const POINTS_BACK_PERCENT = Math.round(
  (POINTS.rewardValue / POINTS.rewardAt) * POINTS.perDollar * 100,
);

/** Grains an order of this many dollars earns. */
export const grainsFor = (amount: number) =>
  Math.max(0, Math.floor(amount * POINTS.perDollar));

/** Dollars off that a balance of grains is worth today. */
export const grainsValue = (grains: number) =>
  Math.floor(Math.max(0, grains) / POINTS.rewardAt) * POINTS.rewardValue;

export const grainsLabel = (n: number) =>
  `${n.toLocaleString("en-US")} ${n === 1 ? POINTS.one : POINTS.many}`;
