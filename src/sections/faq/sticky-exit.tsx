"use client";

import { type ReactNode, useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion/gsap";

/**
 * The shared exit for a sticky headline: it is measured on its column (which
 * never moves), and fades, drifts up 24 px and settles to 0.98 once the sticky
 * block has been released and passes the top of the viewport. Toggled, never
 * scrubbed.
 */
export function StickyExit({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const sticky = ref.current;
      const column = sticky?.parentElement;
      const inner = sticky?.firstElementChild;
      if (!sticky || !column || !inner || prefersReducedMotion()) return;
      gsap.to(inner, {
        opacity: 0,
        y: -24,
        scale: 0.98,
        duration: 0.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: column,
          start: () =>
            `bottom ${Math.round(sticky.offsetHeight / 2 + window.innerHeight * 0.15)}px`,
          toggleActions: "play none none reverse",
          invalidateOnRefresh: true,
        },
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      <div className="origin-top">{children}</div>
    </div>
  );
}
