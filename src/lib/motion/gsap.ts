"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
  gsap.defaults({ ease: "expo.out", duration: 1.2 });
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/** The site's motion vocabulary. Use these instead of ad-hoc easing. */
export const EASE = {
  /** Entrances: fast start, long silky settle. */
  out: "expo.out",
  /** Scrubbed or two-way movement. */
  inOut: "power3.inOut",
  /** Small UI responses. */
  soft: "power2.out",
} as const;

export const DUR = { fast: 0.45, base: 0.9, slow: 1.3 } as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
