"use client";

import { type ReactNode, useRef } from "react";
import { EASE, gsap, prefersReducedMotion, useGSAP } from "@/lib/motion/gsap";

type RevealMediaProps = {
  children: ReactNode;
  className?: string;
  /** Direction the wipe opens from. */
  from?: "bottom" | "top" | "left" | "right";
  delay?: number;
  start?: string;
};

const CLIP: Record<NonNullable<RevealMediaProps["from"]>, string> = {
  bottom: "inset(100% 0% 0% 0%)",
  top: "inset(0% 0% 100% 0%)",
  left: "inset(0% 100% 0% 0%)",
  right: "inset(0% 0% 0% 100%)",
};

/**
 * Image or video entrance: a clip-path wipe while the inner media settles
 * from a slight zoom. Wrap a single element that fills this box.
 */
export function RevealMedia({
  children,
  className,
  from = "bottom",
  delay = 0,
  start = "top 82%",
}: RevealMediaProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const inner = el.firstElementChild;
      const tl = gsap.timeline({
        delay,
        scrollTrigger: { trigger: el, start, once: true },
      });
      tl.fromTo(
        el,
        { clipPath: CLIP[from] },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: EASE.out },
      );
      if (inner) {
        tl.fromTo(
          inner,
          { scale: 1.18 },
          { scale: 1, duration: 1.8, ease: EASE.out },
          0,
        );
      }
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className} style={{ overflow: "hidden" }}>
      {children}
    </div>
  );
}
