"use client";

import { gsap } from "@/lib/motion/gsap";

/**
 * Revision 1 motion rules for this chapter. Text and blocks switch at set scroll
 * points with a quick ease (toggleActions), never scrubbed, so no half state exists.
 */

/** Shared exit: fade, drift up 24 px, scale to 0.98 as a block passes the top 15%. */
export function exitAtTop(targets: Element[], start = "center 15%") {
  for (const el of targets) {
    gsap.to(el, {
      opacity: 0,
      y: -24,
      scale: 0.98,
      duration: 0.5,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start,
        toggleActions: "play none none reverse",
      },
    });
  }
}

/** Entrance: rise in once, staggered, when the first target reaches `start`. */
export function riseIn(targets: Element[], start = "top 86%", stagger = 0.08) {
  if (!targets.length) return;
  gsap.from(targets, {
    opacity: 0,
    y: 18,
    duration: 0.9,
    ease: "expo.out",
    stagger,
    scrollTrigger: { trigger: targets[0], start, once: true },
  });
}
