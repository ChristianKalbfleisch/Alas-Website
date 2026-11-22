"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_MEMORY, remember, type ShopperMemory } from "./shopper-logic";

/**
 * The shopper memory in this browser (localStorage), shared by the quick shop,
 * the welcome-back shortcut and checkout. Storage can fail (private mode): the
 * site then simply behaves as for a first visit.
 */

const list = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];

/** Only what is remembered today: anything else an older visit saved is left behind. */
function known(saved: Partial<Record<keyof ShopperMemory, unknown>>) {
  return {
    visits: typeof saved.visits === "number" ? saved.visits : 0,
    viewed: list(saved.viewed),
    chapters: list(saved.chapters),
    lastChapter:
      typeof saved.lastChapter === "string" ? saved.lastChapter : null,
    email: typeof saved.email === "string" ? saved.email : null,
  } satisfies ShopperMemory;
}

const KEY = "alas-shopper-v1";
const VISIT = "alas-shopper-visit";
const CHANGE = "alas:shopper-change";

let cache: ShopperMemory | null = null;

function read(): ShopperMemory {
  if (cache) return cache;
  try {
    const saved = JSON.parse(window.localStorage.getItem(KEY) ?? "null");
    cache = saved && typeof saved === "object" ? known(saved) : EMPTY_MEMORY;
  } catch {
    cache = EMPTY_MEMORY;
  }
  return cache as ShopperMemory;
}

function update(patch: (m: ShopperMemory) => Partial<ShopperMemory>) {
  const now = read();
  cache = { ...now, ...patch(now) };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Kept for this page only.
  }
  window.dispatchEvent(new Event(CHANGE));
}

/** Counts a new visit once per browser session. */
export function startVisit() {
  try {
    if (window.sessionStorage.getItem(VISIT)) return;
    window.sessionStorage.setItem(VISIT, "1");
  } catch {
    return;
  }
  update((m) => ({ visits: m.visits + 1 }));
}

export const noteViewed = (handle: string) =>
  update((m) => ({ viewed: remember(m.viewed, [handle]) }));

export const rememberEmail = (email: string) => update(() => ({ email }));

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY) return;
    cache = null;
    onChange();
  };
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useShopper(): ShopperMemory {
  return useSyncExternalStore(subscribe, read, () => EMPTY_MEMORY);
}

/** The memory right now, for code that runs outside a component. */
export const shopperNow = (): ShopperMemory => read();
