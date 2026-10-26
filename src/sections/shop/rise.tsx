"use client";

import { type ReactNode, useRef } from "react";
import { EASE, gsap, prefersReducedMotion, useGSAP } from "@/lib/motion/gsap";

/**
 * Soft entrance for a block: children marked `data-rise` (or all direct children)
 * lift into place in a short stagger, once, as the block scrolls into view.
 */
export function Rise({
  children,
  className,
  start = "top 82%",
  stagger = 0.07,
  id,
}: {
  children: ReactNode;
  className?: string;
  start?: string;
  stagger?: number;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        el.dataset.reveal = "done";
        return;
      }
      const marked = el.querySelectorAll<HTMLElement>("[data-rise]");
      const targets = marked.length ? [...marked] : [...el.children];
      gsap.set(targets, { y: 34, opacity: 0 });
      el.dataset.reveal = "done";
      gsap.to(targets, {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: EASE.out,
        stagger,
        scrollTrigger: { trigger: el, start, once: true },
        clearProps: "transform",
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} id={id} className={className} data-reveal="pending">
      {children}
    </div>
  );
}
