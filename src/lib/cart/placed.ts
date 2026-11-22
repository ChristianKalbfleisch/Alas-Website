"use client";

import { useSyncExternalStore } from "react";
import { isRef, newRef, type Preorder } from "@/lib/signup/preorder";
import type { CartLine } from "./cart-math";

/**
 * What this device remembers of pre-orders by email (localStorage).
 *
 * The last one the store kept, exactly as the server confirmed it: its lines
 * and amounts, the percentage, the address the link to pay goes to, the day
 * and the reference. The cart shows it until the visitor puts it away, also
 * after the cart was closed and after a reload: until the link to pay arrives
 * it is the only copy the shopper has.
 *
 * And the reference of the pre-order being placed. It is made once for a set
 * of lines and sent with every try, a reload in between included, so the store
 * writes a pre-order once however often it is sent. A new one is made only
 * after the store has kept it or the lines have changed.
 */

/** A pre-order the store has kept, as the server priced it, and where the pay link goes. */
export type Placed = { order: Preorder; email: string };

const KEY = "alas-preorder-v1";
const PENDING = "alas-preorder-pending";
const CHANGE = "alas:preorder-change";

const number = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

/** What was saved, when it still has the shape of a kept pre-order; otherwise nothing. */
export function readPlaced(raw: string | null): Placed | null {
  if (!raw) return null;
  try {
    const saved = JSON.parse(raw) as Partial<Placed> | null;
    const order = saved?.order;
    if (
      !saved ||
      typeof saved.email !== "string" ||
      !order ||
      !isRef(order.ref) ||
      typeof order.day !== "string" ||
      !number(order.total) ||
      !number(order.percent) ||
      !number(order.toPay) ||
      !Array.isArray(order.lines) ||
      order.lines.length === 0 ||
      !order.lines.every(
        (line) =>
          typeof line?.handle === "string" &&
          typeof line.name === "string" &&
          number(line.qty) &&
          number(line.total),
      )
    ) {
      return null;
    }
    return { order, email: saved.email };
  } catch {
    return null;
  }
}

let cache: Placed | null | undefined;

function read(): Placed | null {
  if (cache !== undefined) return cache;
  try {
    cache = readPlaced(window.localStorage.getItem(KEY));
  } catch {
    cache = null;
  }
  return cache;
}

function write(placed: Placed | null) {
  cache = placed;
  try {
    if (placed) window.localStorage.setItem(KEY, JSON.stringify(placed));
    else window.localStorage.removeItem(KEY);
  } catch {
    // Kept for this page only.
  }
  window.dispatchEvent(new Event(CHANGE));
}

/** Remembers a pre-order the store has kept; it takes the place of an earlier one. */
export const keepPlaced = (placed: Placed) => write(placed);

/** The visitor has put the note away. */
export const dismissPlaced = () => write(null);

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY) return;
    cache = undefined;
    onChange();
  };
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** The last pre-order by email the store kept, until it is put away. */
export function usePlaced(): Placed | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

/** The lines as one string, whatever order they are in: the same lines give the same string. */
export const linesKey = (lines: Pick<CartLine, "handle" | "qty">[]) =>
  lines
    .map((line) => `${line.handle}:${line.qty}`)
    .sort()
    .join(",");

type Pending = { key: string; ref: string };

/** Kept here too, for a browser that will not store anything. */
let pending: Pending | null = null;

function savedPending(): Pending | null {
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(PENDING) ?? "null",
    ) as { key?: unknown; ref?: unknown } | null;
    return typeof saved?.key === "string" && isRef(saved.ref)
      ? { key: saved.key, ref: saved.ref }
      : null;
  } catch {
    return pending;
  }
}

/**
 * The reference for a pre-order of these lines: the one already made for them
 * when there is one, a new one otherwise.
 */
export function refFor(lines: Pick<CartLine, "handle" | "qty">[]): string {
  const key = linesKey(lines);
  const saved = savedPending();
  if (saved?.key === key) return saved.ref;
  pending = { key, ref: newRef() };
  try {
    window.localStorage.setItem(PENDING, JSON.stringify(pending));
  } catch {
    // Kept for this page only.
  }
  return pending.ref;
}

/** The pre-order with this reference is kept: the next one gets a new reference. */
export function forgetRef() {
  pending = null;
  try {
    window.localStorage.removeItem(PENDING);
  } catch {
    // Nothing was saved.
  }
}
