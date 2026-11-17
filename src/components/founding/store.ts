"use client";

import { useSyncExternalStore } from "react";
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
 * been done is kept here, the step follows from it, and checkout applies that
 * step's code once the visitor has joined.
 */
export type GiftState = {
  answers: GiftAnswers;
  /** True once the visitor has joined with an email on this device. */
  joined: boolean;
  /** True once a phone number for texts has been given. */
  phone: boolean;
};

const KEY = "alas-gift-v4";
const CHANGE = "alas:gift-change";
const OPEN = "alas:gift-open";
const EMPTY: GiftState = { answers: {}, joined: false, phone: false };

let cache: GiftState | null = null;

function parse(raw: string | null): GiftState | null {
  if (!raw) return null;
  const saved = JSON.parse(raw) as Partial<GiftState>;
  return {
    answers: cleanAnswers(saved.answers),
    joined: saved.joined === true,
    phone: saved.phone === true,
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
export function joinGift({
  phone = false,
}: {
  phone?: boolean;
} = {}): GiftTier {
  updateGift({ joined: true, phone: read().phone || phone });
  return earnedTier(read());
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

/** The step earned so far, whether or not it has been claimed. */
export function earnedTier(state: GiftState): GiftTier {
  return tierForAnswers(state.answers, state.phone);
}

/** The code checkout applies, once the visitor has joined. */
export function claimedCode(state: GiftState): string | null {
  return state.joined ? earnedTier(state).code : null;
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
