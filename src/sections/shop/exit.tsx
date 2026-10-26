"use client";

import { type ReactNode, useRef } from "react";
import {
  gsap,
  prefersReducedMotion,
  ScrollTrigger,
  useGSAP,
} from "@/lib/motion/gsap";

/**
 * The shared exit (revision 1): as a block passes through the top of the
 * viewport it fades, drifts up 24 px and settles to 0.98. A toggle, never a
 * scrub, so text is never caught half gone; scrolling back brings it home.
 */
export function Exit({
  children,
  className,
  start = "top 15%",
}: {
  children: ReactNode;
  className?: string;
  /** When to leave. Headlines: "top 15%". Tall images: "bottom 35%". */
  start?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const tween = gsap.to(el, {
        opacity: 0,
        y: -24,
        scale: 0.98,
        duration: 0.5,
        ease: "power2.out",
        paused: true,
      });
      ScrollTrigger.create({
        trigger: el,
        start,
        onEnter: () => tween.play(),
        onLeaveBack: () => tween.reverse(),
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className} style={{ transformOrigin: "50% 0%" }}>
      {children}
    </div>
  );
}
