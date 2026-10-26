"use client";

import clsx from "clsx";
import { type ElementType, useRef } from "react";
import { EASE, gsap, prefersReducedMotion, useGSAP } from "@/lib/motion/gsap";

/**
 * Words stacked in one masked cell: the current one sits in place, earlier ones
 * wait above, later ones below. Changing `index` rolls them, in the direction of
 * the change, with the house masked-line easing.
 */
export function RollingWord({
  words,
  index,
  as: Tag = "span",
  className,
  wordClassName,
}: {
  words: string[];
  index: number;
  as?: ElementType;
  className?: string;
  wordClassName?: string;
}) {
  const root = useRef<HTMLElement>(null);
  const first = useRef(true);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const nodes = el.querySelectorAll<HTMLElement>("[data-word]");
      const instant = first.current || prefersReducedMotion();
      first.current = false;
      nodes.forEach((node, i) => {
        const y = i === index ? 0 : i < index ? -112 : 112;
        const vars = { yPercent: y, opacity: i === index ? 1 : 0 };
        // y: 0 drops any translate GSAP read back from the server style (it would
        // otherwise add to yPercent, e.g. after StrictMode reverts and re-runs).
        if (instant) gsap.set(node, { ...vars, y: 0 });
        else
          gsap.to(node, {
            ...vars,
            y: 0,
            duration: 0.95,
            ease: EASE.out,
            overwrite: "auto",
          });
      });
    },
    { dependencies: [index] },
  );

  return (
    <Tag
      ref={root}
      className={clsx("grid overflow-hidden", className)}
      aria-live="polite"
    >
      {words.map((word, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: words can repeat
          key={i}
          data-word
          aria-hidden={i !== index}
          className={clsx("col-start-1 row-start-1 block", wordClassName)}
          style={{
            transform: `translateY(${i === index ? 0 : i < index ? -112 : 112}%)`,
            opacity: i === index ? 1 : 0,
          }}
        >
          {word}
        </span>
      ))}
    </Tag>
  );
}
