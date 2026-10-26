"use client";

import { type ReactNode, useRef } from "react";
import {
  gsap,
  prefersReducedMotion,
  ScrollTrigger,
  useGSAP,
} from "@/lib/motion/gsap";

/**
 * The site's shared exit for everything marked [data-exit] inside: as it passes
 * through the top 15% of the viewport it fades, drifts up 24 px and settles to 0.98.
 * A toggle (0.5 s ease-out), never scrubbed, so it reverses cleanly on the way back.
 */
export function Exits({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      for (const target of gsap.utils.toArray<HTMLElement>("[data-exit]", el)) {
        // Attached as the trigger's own animation, so refreshes measure it at rest.
        ScrollTrigger.create({
          trigger: target,
          start: "bottom 15%",
          toggleActions: "play none none reverse",
          animation: gsap.to(target, {
            autoAlpha: 0,
            y: -24,
            scale: 0.98,
            duration: 0.5,
            ease: "power2.out",
            paused: true,
          }),
        });
      }
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
