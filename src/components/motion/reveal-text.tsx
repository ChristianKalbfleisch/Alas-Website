"use client";

import { type ElementType, type ReactNode, useRef } from "react";
import {
  EASE,
  gsap,
  prefersReducedMotion,
  SplitText,
  useGSAP,
} from "@/lib/motion/gsap";

type RevealTextProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** Seconds before the first line moves. */
  delay?: number;
  /** Seconds between lines (or words). */
  stagger?: number;
  /** Split by lines (default) or words. */
  by?: "lines" | "words";
  /** ScrollTrigger start. Pass null to play immediately on mount. */
  start?: string | null;
};

/**
 * Masked line rise: each line slides up from behind its own mask.
 * The house text entrance. Re-splits on resize so lines stay correct.
 */
export function RevealText({
  as: Tag = "p",
  children,
  className,
  delay = 0,
  stagger = 0.085,
  by = "lines",
  start = "top 86%",
}: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        el.dataset.reveal = "done";
        return;
      }
      const split = SplitText.create(el, {
        type: by === "lines" ? "lines" : "words,lines",
        mask: "lines",
        autoSplit: true,
        onSplit(self) {
          el.dataset.reveal = "done";
          const targets = by === "lines" ? self.lines : self.words;
          return gsap.from(targets, {
            yPercent: 115,
            duration: 1.25,
            ease: EASE.out,
            stagger,
            delay,
            scrollTrigger: start
              ? { trigger: el, start, once: true }
              : undefined,
          });
        },
      });
      return () => split.revert();
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className} data-reveal="pending">
      {children}
    </Tag>
  );
}
