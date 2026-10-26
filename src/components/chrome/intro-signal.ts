/**
 * The first-load intro contract shared by the loader, the nav and the hero.
 *
 * A tiny inline gate script (see loader.tsx) runs before first paint and sets
 * `window.__alasIntro` to "play" or "skip". When it plays, the loader fires
 * `alas:intro-done` as the veil starts to open, and sets `__alasIntroDone`.
 * When it is skipped, `__alasIntroDone` is already true before React runs.
 */

export const INTRO_DONE_EVENT = "alas:intro-done";
export const INTRO_END_EVENT = "alas:intro-end";
export const INTRO_SESSION_KEY = "alas-intro-seen";

declare global {
  interface Window {
    __alasIntro?: "play" | "skip";
    __alasIntroDone?: boolean;
    __alasIntroEnded?: boolean;
  }
}

export function introIsPlaying(): boolean {
  return typeof window !== "undefined" && window.__alasIntro === "play";
}

/** Run `callback` once the intro has handed over (immediately if it already has). */
export function onIntroDone(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  if (window.__alasIntroDone !== false) {
    callback();
    return () => {};
  }
  let called = false;
  const run = () => {
    if (called) return;
    called = true;
    callback();
  };
  window.addEventListener(INTRO_DONE_EVENT, run, { once: true });
  return () => window.removeEventListener(INTRO_DONE_EVENT, run);
}

/** Mark the intro as handed over and tell anyone waiting. Safe to call twice. */
export function signalIntroDone(): void {
  if (window.__alasIntroDone === true) return;
  window.__alasIntroDone = true;
  window.dispatchEvent(new Event(INTRO_DONE_EVENT));
}
