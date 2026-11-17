/**
 * How a visitor shops, from what they did on this device: which products they
 * looked at, what they sent to checkout, which chapters of the story they read.
 * Pure functions, so the rules are easy to read and test; the browser store
 * lives in shopper.ts. Nothing here leaves the visitor's device.
 */

export type ShopperMemory = {
  /** Separate visits (browser sessions). */
  visits: number;
  /** Product handles looked at, newest first. */
  viewed: string[];
  /** Product handles sent to checkout, newest first. */
  bought: string[];
  /** Story chapters read, in the order first reached. */
  chapters: string[];
  /** The last chapter reached. */
  lastChapter: string | null;
  /** The email given in a sign-up, to fill in at checkout. */
  email: string | null;
};

export const EMPTY_MEMORY: ShopperMemory = {
  visits: 0,
  viewed: [],
  bought: [],
  chapters: [],
  lastChapter: null,
  email: null,
};

/** Newest first, no repeats, at most `max`. */
export function remember(list: string[], items: string[], max = 5): string[] {
  const fresh = [...new Set(items)];
  return [...fresh, ...list.filter((h) => !fresh.includes(h))].slice(0, max);
}

export type ShopperMode = "cart" | "buyer" | "browser" | "reader" | "new";

/**
 * cart: something waits in the cart. buyer: went to checkout before.
 * browser: looked at products. reader: read three or more chapters.
 */
export function shopperMode(m: ShopperMemory, cartCount: number): ShopperMode {
  if (cartCount > 0) return "cart";
  if (m.bought.length) return "buyer";
  if (m.viewed.length) return "browser";
  if (m.chapters.length >= 3) return "reader";
  return "new";
}

/** What each gift answer about "what brings you" suggests first. */
const GOAL_FIRST: Record<string, string[]> = {
  training: ["sticks-15", "sticks-5", "sticks-30"],
  hydration: ["classic-pouch", "sticks-5"],
  ritual: ["classic-pouch", "sticks-5"],
  kitchen: ["classic-pouch"],
  gift: ["classic-pouch", "sticks-15"],
};

/**
 * The quick shop's order for this visitor: what they bought, then what they
 * looked at, then what their gift answer points to, then the house order.
 */
export function rankForShop(
  handles: string[],
  m: ShopperMemory,
  goal?: string,
): string[] {
  const first = [...m.bought, ...m.viewed, ...(GOAL_FIRST[goal ?? ""] ?? [])];
  const known = new Set(handles);
  return remember(
    handles,
    first.filter((h) => known.has(h)),
    handles.length,
  );
}

export type Welcome =
  | { kind: "cart" }
  | { kind: "again"; handle: string }
  | { kind: "viewed"; handle: string }
  | { kind: "chapter"; chapter: string };

/** The one shortcut a returning visitor sees, or none for a first visit. */
export function welcomeFor(
  m: ShopperMemory,
  cartCount: number,
  priced: (handle: string) => boolean,
): Welcome | null {
  if (cartCount > 0) return { kind: "cart" };
  if (m.visits < 2) return null;
  const again = m.bought.find(priced);
  if (again) return { kind: "again", handle: again };
  const viewed = m.viewed.find(priced);
  if (viewed) return { kind: "viewed", handle: viewed };
  if (m.lastChapter && m.chapters.length >= 2) {
    return { kind: "chapter", chapter: m.lastChapter };
  }
  return null;
}
