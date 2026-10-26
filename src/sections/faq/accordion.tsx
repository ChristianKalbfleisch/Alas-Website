"use client";

import clsx from "clsx";
import { type KeyboardEvent, useId, useRef, useState } from "react";
import { EASE, gsap, prefersReducedMotion, useGSAP } from "@/lib/motion/gsap";
import { scrollToTarget } from "@/lib/motion/smooth-scroll";
import type { Faq } from "./content";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * One question open at a time. Height animates with a grid-rows transition
 * (no measuring); closed answers are inert, so they are neither focusable nor
 * read. Arrow keys, Home and End move between questions.
 */
export function Accordion({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();

  useGSAP(
    () => {
      const list = listRef.current;
      if (!list || prefersReducedMotion()) return;
      gsap.from(list.querySelectorAll("[data-faq-item]"), {
        y: 28,
        opacity: 0,
        duration: 1.1,
        ease: EASE.out,
        stagger: 0.06,
        scrollTrigger: { trigger: list, start: "top 82%", once: true },
      });
    },
    { scope: listRef },
  );

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const last = items.length - 1;
    const target =
      event.key === "ArrowDown"
        ? Math.min(i + 1, last)
        : event.key === "ArrowUp"
          ? Math.max(i - 1, 0)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (target === null) return;
    event.preventDefault();
    buttons.current[target]?.focus();
  };

  return (
    <ul ref={listRef} className="border-[var(--c-line)] border-b">
      {items.map((item, i) => {
        const isOpen = open === i;
        const qId = `${baseId}-q${i}`;
        const aId = `${baseId}-a${i}`;
        return (
          <li
            key={item.q}
            data-faq-item
            className="border-[var(--c-line)] border-t"
          >
            <h3>
              <button
                ref={(el) => {
                  buttons.current[i] = el;
                }}
                id={qId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={aId}
                onClick={() => setOpen(isOpen ? null : i)}
                onKeyDown={(event) => onKeyDown(event, i)}
                className="group flex w-full items-start gap-4 py-6 text-left sm:gap-6 lg:py-7"
              >
                <span
                  className={clsx(
                    "font-mono text-[0.6875rem] font-medium uppercase tracking-[0.1em] w-7 shrink-0 pt-[0.55em] tabular-nums transition-colors duration-500",
                    isOpen
                      ? "text-cobalt"
                      : "text-ink-3 group-hover:text-cobalt",
                  )}
                >
                  {pad(i + 1)}
                </span>
                <span
                  className="font-display flex-1 text-pretty text-ink transition-transform duration-500 ease-[var(--ease-out)] group-hover:translate-x-1.5"
                  style={{
                    fontSize: "clamp(1.35rem, 1.15rem + 0.75vw, 1.95rem)",
                    lineHeight: 1.15,
                  }}
                >
                  {item.q}
                </span>
                <span
                  aria-hidden
                  className={clsx(
                    "relative mt-0.5 grid size-9 shrink-0 place-items-center rounded-full ring-1 ring-inset transition-[background-color,box-shadow,color] duration-500",
                    isOpen
                      ? "bg-ink text-white ring-ink"
                      : "text-ink ring-[var(--c-line-strong)] group-hover:ring-ink",
                  )}
                >
                  <span className="absolute h-px w-3.5 bg-current" />
                  <span
                    className={clsx(
                      "absolute h-3.5 w-px bg-current transition-transform duration-500 ease-[var(--ease-out)]",
                      isOpen ? "scale-y-0" : "scale-y-100",
                    )}
                  />
                </span>
              </button>
            </h3>
            <div
              id={aId}
              inert={!isOpen}
              className="grid transition-[grid-template-rows] duration-700 ease-[var(--ease-out)]"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <div
                  className={clsx(
                    "pr-4 pb-8 pl-11 transition-[opacity,transform] duration-700 ease-[var(--ease-out)] sm:pr-16 sm:pl-[3.25rem]",
                    isOpen
                      ? "translate-y-0 opacity-100"
                      : "-translate-y-2 opacity-0",
                  )}
                >
                  <p className="max-w-[58ch] text-[1rem] leading-relaxed text-ink-2 lg:text-[1.05rem]">
                    {item.a}
                  </p>
                  {item.link && (
                    <a
                      href={item.link.href}
                      onClick={(event) => {
                        const href = item.link?.href;
                        if (!href || !document.querySelector(href)) return;
                        event.preventDefault();
                        scrollToTarget(href);
                      }}
                      className="eyebrow mt-5 inline-flex items-center gap-2 text-ink underline decoration-[var(--c-line-strong)] underline-offset-[6px] transition-colors hover:decoration-ink"
                    >
                      {item.link.label}
                      <span aria-hidden>→</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
