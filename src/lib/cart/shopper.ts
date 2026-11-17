"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_MEMORY, remember, type ShopperMemory } from "./shopper-logic";

/**
 * The shopper memory in this browser (localStorage), shared by the quick shop,
 * the welcome-back shortcut and checkout. Storage can fail (private mode): the
 * site then simply behaves as for a first visit.
 */

const KEY = "alas-shopper-v1";
const VISIT = "alas-shopper-visit";
const CHANGE = "alas:shopper-change";

let cache: ShopperMemory | null = null;

function read(): ShopperMemory {
  if (cache) return cache;
  try {
    const saved = JSON.parse(window.localStorage.getItem(KEY) ?? "null");
    cache = saved ? { ...EMPTY_MEMORY, ...saved } : EMPTY_MEMORY;
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

export const noteBought = (handles: string[]) =>
  update((m) => ({ bought: remember(m.bought, handles) }));

export function noteChapter(chapter: string) {
  const m = read();
  if (m.lastChapter === chapter) return;
  update(() => ({
    chapters: m.chapters.includes(chapter)
      ? m.chapters
      : [...m.chapters, chapter].slice(-20),
    lastChapter: chapter,
  }));
}

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
