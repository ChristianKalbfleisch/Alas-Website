"use client";

import { useSyncExternalStore } from "react";
import type { OfferSteps } from "@/data/gift";
import { offerAsBuilt, offerNow, watchOffer } from "@/lib/offer/offer-clock";

/**
 * The offer in force, for anything a visitor reads: the campaign while it
 * runs, the standing offer from its last moment on. While the page loads it is
 * the offer the page was built with; then it follows the clock, and an open
 * page changes over by itself (src/lib/offer/offer-clock.ts).
 */
export function useOffer(): OfferSteps {
  return useSyncExternalStore(watchOffer, offerNow, offerAsBuilt);
}
