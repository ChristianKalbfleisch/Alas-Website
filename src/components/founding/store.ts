"use client";

import { useSyncExternalStore } from "react";
import type { Offer } from "@/data/campaign";
import {
  cleanAnswers,
  type GiftAnswers,
  type GiftTier,
  tierForAnswers,
} from "@/data/gift";

/**
 * The Founding Member offer on this device, shared by the dialog, the footer
 * and the cart. The discount is a ladder: the base for joining with an email, a
 * step for each question answered and a last step for a phone number. What has
 * been done is kept here; the step follows from it under the offer in force,
 * and checkout applies that step's code once the visitor has joined.
 */
export type GiftState = {
  answers: GiftAnswers;
  /** True once the visitor has joined with an email on this device. */
  joined: boolean;
  /** True once a phone number for texts has been given. */
  phone: boolean;
  /**
   * True once the server has said that the store kept a sign-up from this
   * device. A device that has joined without it shows that nothing was saved,
   * and sends its sign-up once more when it next can: that is a device that
   * joined while the site had no store connection.
   */
  saved: boolean;
};

const KEY = "alas-gift-v4";
const CHANGE = "alas:gift-change";
const OPEN = "alas:gift-open";
const EMPTY: GiftState = {
  answers: {},
  joined: false,
  phone: false,
  saved: false,
};

let cache: GiftState | null = null;

function parse(raw: string | null): GiftState | null {
  if (!raw) return null;
  const saved = JSON.parse(raw) as Partial<GiftState>;
  return {
    answers: cleanAnswers(saved.answers),
    joined: saved.joined === true,
    phone: saved.phone === true,
    saved: saved.saved === true,
  };
}

function read(): GiftState {
  if (cache) return cache;
  try {
    cache = parse(window.localStorage.getItem(KEY)) ?? EMPTY;
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
    // Private mode: the offer still works for this visit.
  }
  window.dispatchEvent(new Event(CHANGE));
}

/**
 * Marks the visitor as joined, with a phone number when they gave one. A later
 * sign-up without a number never takes the phone step away.
 */
export function joinGift({ phone = false }: { phone?: boolean } = {}) {
  updateGift({ joined: true, phone: read().phone || phone });
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

/** The offer on this device right now, for code that runs outside a component. */
export const giftNow = (): GiftState => read();

/** The step earned so far under an offer, whether or not it has been claimed. */
export function earnedTier(offer: Offer, state: GiftState): GiftTier {
  return tierForAnswers(offer, state.answers, state.phone);
}

/** Open the Founding Member dialog from anywhere. */
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
