"use client";

import { type ReactNode, useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion/gsap";

type ParallaxProps = {
  children: ReactNode;
  className?: string;
  /** Percent of own height to travel across the viewport. Negative moves up faster. */
  amount?: number;
};

/** Scrubbed vertical drift tied to the element's pass through the viewport. */
export function Parallax({ children, className, amount = -12 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      gsap.fromTo(
        el,
        { yPercent: -amount / 2 },
        {
          yPercent: amount / 2,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
