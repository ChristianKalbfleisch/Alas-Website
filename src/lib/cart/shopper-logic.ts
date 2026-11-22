/**
 * How a visitor shops, from what they did on this device: which products they
 * looked at and which chapters of the story they read. Opening the store's
 * checkout is not remembered: the site never learns whether an order was
 * placed, so it never says one was. Pure functions, so the rules are easy to
 * read and test; the browser store lives in shopper.ts. Nothing here leaves the
 * visitor's device.
 */

export type ShopperMemory = {
  /** Separate visits (browser sessions). */
  visits: number;
  /** Product handles looked at, newest first. */
  viewed: string[];
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
  chapters: [],
  lastChapter: null,
  email: null,
};

/** Newest first, no repeats, at most `max`. */
export function remember(list: string[], items: string[], max = 5): string[] {
  const fresh = [...new Set(items)];
  return [...fresh, ...list.filter((h) => !fresh.includes(h))].slice(0, max);
}

export type ShopperMode = "cart" | "browser" | "reader" | "new";

/**
 * cart: something waits in the cart. browser: looked at products.
 * reader: read three or more chapters.
 */
export function shopperMode(m: ShopperMemory, cartCount: number): ShopperMode {
  if (cartCount > 0) return "cart";
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
 * The quick shop's order for this visitor: what they looked at, then what
 * their gift answer points to, then the house order.
 */
export function rankForShop(
  handles: string[],
  m: ShopperMemory,
  goal?: string,
): string[] {
  const first = [...m.viewed, ...(GOAL_FIRST[goal ?? ""] ?? [])];
  const known = new Set(handles);
  return remember(
    handles,
    first.filter((h) => known.has(h)),
    handles.length,
  );
}

export type Welcome =
  | { kind: "cart" }
  | { kind: "viewed"; handle: string }
  | { kind: "chapter"; chapter: string };

/**
 * The one shortcut a returning visitor sees, or none for a first visit: the
 * cart that is waiting, or the product they looked at last.
 */
export function welcomeFor(
  m: ShopperMemory,
  cartCount: number,
  priced: (handle: string) => boolean,
): Welcome | null {
  if (cartCount > 0) return { kind: "cart" };
  if (m.visits < 2) return null;
  const viewed = m.viewed.find(priced);
  if (viewed) return { kind: "viewed", handle: viewed };
  if (m.lastChapter && m.chapters.length >= 2) {
    return { kind: "chapter", chapter: m.lastChapter };
  }
  return null;
}
