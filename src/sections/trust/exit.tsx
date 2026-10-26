"use client";

import { type ReactNode, useRef } from "react";
import { EASE, gsap, prefersReducedMotion, useGSAP } from "@/lib/motion/gsap";

/**
 * The shared exit for headlines and images in non-pinned chapters: as the
 * block passes through the top 15% of the viewport it fades, drifts up 24 px
 * and settles to 0.98. Optionally it also comes in (fade and rise). Both are
 * toggled at set points (never scrubbed) and reverse on the way back. The
 * outer box is the trigger and never moves; enter and exit run on separate
 * inner layers so they never fight over the same properties.
 */
export function Exit({
  children,
  className,
  enter = false,
}: {
  children: ReactNode;
  className?: string;
  enter?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const outer = ref.current;
      const exitLayer = outer?.querySelector<HTMLElement>(
        ":scope > [data-exit]",
      );
      const enterLayer = exitLayer?.querySelector<HTMLElement>(
        ":scope > [data-enter]",
      );
      if (!outer || !exitLayer || !enterLayer || prefersReducedMotion()) return;
      gsap.to(exitLayer, {
        opacity: 0,
        y: -24,
        scale: 0.98,
        duration: 0.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: outer,
          start: "center 15%",
          toggleActions: "play none none reverse",
        },
      });
      if (enter) {
        gsap.from(enterLayer, {
          opacity: 0,
          y: 28,
          duration: 1.1,
          ease: EASE.out,
          scrollTrigger: {
            trigger: outer,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        });
      }
    },
    { scope: ref, dependencies: [enter] },
  );

  return (
    <div ref={ref} className={className}>
      <div data-exit className="origin-top">
        <div data-enter>{children}</div>
      </div>
    </div>
  );
}
