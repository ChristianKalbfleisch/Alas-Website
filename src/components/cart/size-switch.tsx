"use client";

import clsx from "clsx";
import Link from "next/link";
import { type KeyboardEvent, useRef } from "react";
import { EASE, gsap, prefersReducedMotion, useGSAP } from "@/lib/motion/gsap";
import "./commerce.css";

export type SwitchOption = {
  value: string;
  label: string;
  sublabel?: string;
  /** Small plain-language tag above the segment, e.g. "Best value". */
  tag?: string;
  /** Render as a link (product pages) instead of a radio. */
  href?: string;
};

type SizeSwitchProps = {
  options: SwitchOption[];
  value: string;
  onChange?: (value: string) => void;
  label: string;
  className?: string;
};

/**
 * Liquid glass segmented switch. A glass thumb glides to the chosen segment and
 * stretches slightly on the way, like a drop of water. Radios by default; links
 * when every option carries an href.
 */
export function SizeSwitch({
  options,
  value,
  onChange,
  label,
  className,
}: SizeSwitchProps) {
  const thumbRef = useRef<HTMLSpanElement>(null);
  const buttonsRef = useRef<(HTMLElement | null)[]>([]);
  const settled = useRef(false);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const asLinks = options.every((o) => o.href);

  useGSAP(
    () => {
      const thumb = thumbRef.current;
      if (!thumb) return;
      // x: 0 clears any translate GSAP read back from the server style, so only
      // xPercent places the thumb (also after StrictMode reverts and re-runs).
      if (!settled.current || prefersReducedMotion()) {
        gsap.set(thumb, { x: 0, xPercent: index * 100 });
        settled.current = true;
        return;
      }
      gsap
        .timeline()
        .to(
          thumb,
          { x: 0, xPercent: index * 100, duration: 0.75, ease: EASE.out },
          0,
        )
        .to(
          thumb,
          { scaleX: 1.1, scaleY: 0.92, duration: 0.16, ease: "power2.out" },
          0,
        )
        .to(
          thumb,
          { scaleX: 1, scaleY: 1, duration: 0.7, ease: EASE.out },
          0.16,
        );
    },
    { dependencies: [index] },
  );

  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + options.length) % options.length;
    onChange?.(options[next].value);
    buttonsRef.current[next]?.focus();
  };

  const shell = clsx(
    "relative grid rounded-full p-1",
    "bg-[rgb(18_49_77_/_0.035)] shadow-[inset_0_1px_3px_rgb(18_49_77_/_0.07)] ring-1 ring-[var(--c-line)] ring-inset",
    className,
  );
  const columns = {
    gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
  };

  const segments = (
    <>
      <span
        ref={thumbRef}
        aria-hidden
        className="cm-liquid-thumb pointer-events-none absolute top-1 bottom-1 left-1 rounded-full will-change-transform"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((option, i) => {
        const active = i === index;
        const content = (
          <>
            {option.tag && (
              <span className="-top-2.5 -translate-x-1/2 absolute left-1/2 z-20 whitespace-nowrap rounded-full bg-ink px-2 py-[3px] font-mono text-[9px] text-white uppercase leading-none tracking-[0.08em]">
                {option.tag}
              </span>
            )}
            <span className="font-display text-[1.15rem] leading-none!">
              {option.label}
            </span>
            {option.sublabel && (
              <span className="mt-1.5 font-mono text-[10px] uppercase leading-none tracking-[0.08em] opacity-70">
                {option.sublabel}
              </span>
            )}
          </>
        );
        const classes = clsx(
          "relative z-10 flex h-16 flex-col items-center justify-center rounded-full px-1 text-center transition-colors duration-500",
          active ? "text-ink" : "text-ink-2 hover:text-ink",
        );
        if (asLinks && option.href) {
          return (
            <Link
              key={option.value}
              href={option.href}
              aria-current={active ? "page" : undefined}
              className={classes}
              ref={(el) => {
                buttonsRef.current[i] = el;
              }}
            >
              {content}
            </Link>
          );
        }
        return (
          // biome-ignore lint/a11y/useSemanticElements: segmented control radio with roving focus
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange?.(option.value)}
            className={classes}
            ref={(el) => {
              buttonsRef.current[i] = el;
            }}
          >
            {content}
          </button>
        );
      })}
    </>
  );

  if (asLinks) {
    return (
      <nav aria-label={label} className={shell} style={columns}>
        {segments}
      </nav>
    );
  }
  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={move}
      className={shell}
      style={columns}
    >
      {segments}
    </div>
  );
}
