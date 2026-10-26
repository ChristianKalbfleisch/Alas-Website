"use client";

import { useEffect, useRef, useState } from "react";
import { linkForSection } from "./nav-links";

export type NavScrollState = {
  /** At the very top: the announcement line is showing. */
  top: boolean;
  /** Scrolled enough for the capsules to condense into glass. */
  glass: boolean;
  /** Tucked away after a fast scroll down. */
  hidden: boolean;
  /** The hero's big lockup has left, so the small one shows in the bar. */
  mark: boolean;
  /** Nav link id for the chapter under the reading line. */
  active: string | null;
};

const FAST = 1.1; // px per ms counts as a fast scroll down

/** Scroll-driven nav state. `pin` keeps the bar visible (menu open, focus, cart). */
export function useNavScroll(pin: boolean): NavScrollState {
  const [state, setState] = useState<NavScrollState>({
    top: true,
    glass: false,
    hidden: false,
    mark: false,
    active: null,
  });
  const pinRef = useRef(pin);
  pinRef.current = pin;

  useEffect(() => {
    let lastY = window.scrollY;
    let lastT = performance.now();
    let hidden = false;
    let raf = 0;
    let lastActiveCheck = 0;
    let active: string | null = null;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const now = performance.now();
      const dy = y - lastY;
      const speed = dy / Math.max(1, now - lastT);
      lastY = y;
      lastT = now;

      if (y < 140 || pinRef.current) hidden = false;
      else if (dy < -3) hidden = false;
      else if (dy > 0 && speed > FAST) hidden = true;

      // The small lockup takes over as the hero's big one leaves (it switches
      // out at the top 15% of the screen; with reduced motion, once it is gone).
      const heroMark = document.querySelector<HTMLElement>("[data-hero-mark]");
      let mark = true;
      if (heroMark) {
        const rect = heroMark.getBoundingClientRect();
        const line = window.innerHeight * 0.15;
        mark = (reduced.matches ? rect.bottom : rect.top) < line;
      }

      if (now - lastActiveCheck > 90) {
        lastActiveCheck = now;
        const line = window.innerHeight * 0.45;
        let current: string | null = null;
        for (const el of document.querySelectorAll<HTMLElement>(
          "[data-section]",
        )) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= line && rect.bottom > line) {
            current = el.dataset.section ?? null;
            break;
          }
        }
        active = linkForSection(current);
      }

      setState((prev) => {
        const next = {
          top: y < 8,
          glass: y > 24,
          hidden,
          mark,
          active,
        };
        return prev.top === next.top &&
          prev.glass === next.glass &&
          prev.hidden === next.hidden &&
          prev.mark === next.mark &&
          prev.active === next.active
          ? prev
          : next;
      });
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return pin && state.hidden ? { ...state, hidden: false } : state;
}
