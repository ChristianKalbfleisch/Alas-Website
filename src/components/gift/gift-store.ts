"use client";

import { useSyncExternalStore } from "react";

/**
 * The gift, shared by the floating launcher, its dialog and the quiz result.
 * The site's one offer (revision 1): 10% off your next order, for joining.
 * PLACEHOLDER code: the owners set the real one before launch.
 */
export const GIFT = {
  headline: "10%",
  title: "10% off your next order",
  detail: "off your next order",
  code: "AEGEAN10",
} as const;

export type GiftState = { revealed: boolean; sent: boolean };

const KEY = "alas-gift-v1";
const CHANGE = "alas:gift-change";
const OPEN = "alas:gift-open";
const EMPTY: GiftState = { revealed: false, sent: false };

let cache: GiftState | null = null;

function read(): GiftState {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw
      ? { ...EMPTY, ...(JSON.parse(raw) as Partial<GiftState>) }
      : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

export function updateGift(patch: Partial<GiftState>) {
  cache = { ...read(), ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Private mode: the gift still works for this visit.
  }
  window.dispatchEvent(new Event(CHANGE));
}

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

export function useGift(): GiftState {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Open the gift dialog from anywhere (the quiz result uses this). */
export function openGift(source = "gift") {
  window.dispatchEvent(new CustomEvent(OPEN, { detail: { source } }));
}

export function onOpenGift(handler: (source: string) => void) {
  const listener = (event: Event) =>
    handler(
      (event as CustomEvent<{ source?: string }>).detail?.source ?? "gift",
    );
  window.addEventListener(OPEN, listener);
  return () => window.removeEventListener(OPEN, listener);
}
