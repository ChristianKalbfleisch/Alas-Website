"use client";

import { useSyncExternalStore } from "react";

/**
 * Below this height the cart keeps only the total and the Checkout button
 * pinned at its foot, and lets everything else scroll with the list: a pinned
 * foot with every line in it would leave too little room for the items and
 * the email step on a phone with its browser bars showing.
 */
const SHORT = "(max-height: 799px)";

function watch(onChange: () => void) {
  const query = window.matchMedia(SHORT);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** True on a screen too short for the cart's whole foot. */
export function useShortScreen(): boolean {
  return useSyncExternalStore(
    watch,
    () => window.matchMedia(SHORT).matches,
    () => false,
  );
}
