"use client";

import clsx from "clsx";
import { type PointerEvent, useCallback, useRef, useState } from "react";
import { VOICES } from "./content";

const pad = (n: number) => String(n).padStart(2, "0");
const COUNT = VOICES.length;

function Arrow({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className={clsx(
        "size-4 transition-transform duration-500 ease-[var(--ease-out)]",
        dir === "prev"
          ? "rotate-180 group-hover:-translate-x-0.5"
          : "group-hover:translate-x-0.5",
      )}
    >
      <path
        d="M3 10h13M11 5l5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
    </svg>
  );
}

const roundButton =
  "group grid size-12 place-items-center rounded-full text-ink ring-1 ring-[var(--c-line-strong)] ring-inset transition-colors duration-500 hover:bg-ink hover:text-white";

/**
 * Sample voices, clearly tagged "Preview". Manual only (no autoplay): arrows,
 * swipe, and a polite live region. Quotes switch with a short time-based
 * cross-fade; nothing is tied to scroll.
 */
export function Voices() {
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);

  const go = useCallback(
    (step: number) => setIndex((i) => (i + step + COUNT) % COUNT),
    [],
  );

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    startX.current = event.clientX;
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return;
    const dx = event.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1);
  };

  const current = VOICES[index];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Voices, sample preview"
      className="grid gap-10 lg:grid-cols-12 lg:gap-x-6"
    >
      <div className="flex flex-col gap-6 lg:col-span-3">
        <div className="flex flex-wrap items-center justify-between gap-3 lg:flex-col lg:items-start">
          <h3 className="eyebrow">/ Voices</h3>
          <span className="eyebrow inline-flex items-center gap-2 rounded-full px-3 py-1.5 ring-1 ring-[var(--c-line-strong)] ring-inset">
            <span aria-hidden className="size-1.5 rounded-full bg-cobalt" />
            Preview · sample copy
          </span>
        </div>
        <p className="hidden max-w-[30ch] text-[0.85rem] leading-relaxed text-ink-3 lg:block">
          Sample quotes for this preview. Real reviews will take their place
          after launch.
        </p>
      </div>

      <div className="lg:col-span-8 lg:col-start-5">
        <div
          className="grid touch-pan-y select-none"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            startX.current = null;
          }}
        >
          {VOICES.map((voice, i) => {
            const active = i === index;
            return (
              <figure
                key={voice.name}
                aria-hidden={!active}
                className={clsx(
                  "[grid-area:1/1] transition-[opacity,transform] ease-[var(--ease-out)]",
                  active
                    ? "translate-y-0 opacity-100 delay-200 duration-500"
                    : "pointer-events-none -translate-y-3 opacity-0 duration-300",
                )}
              >
                <blockquote
                  className="font-display text-pretty text-ink"
                  style={{
                    fontSize: "clamp(1.85rem, 1.2rem + 2.2vw, 3.3rem)",
                    lineHeight: 1.14,
                  }}
                >
                  <span aria-hidden className="-ml-[0.42em] text-ink-3">
                    “
                  </span>
                  {voice.quote}
                  <span aria-hidden className="text-ink-3">
                    ”
                  </span>
                </blockquote>
                <figcaption className="eyebrow mt-7">
                  / {voice.name}, {voice.city}
                </figcaption>
              </figure>
            );
          })}
        </div>

        <p className="sr-only" aria-live="polite">
          {`Sample quote ${index + 1} of ${COUNT}: ${current.quote} ${current.name}, ${current.city}.`}
        </p>

        <div className="mt-10 flex items-center gap-4 lg:mt-12">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous quote"
            className={roundButton}
          >
            <Arrow dir="prev" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next quote"
            className={roundButton}
          >
            <Arrow dir="next" />
          </button>
          <div className="ml-2 flex flex-1 items-center gap-4">
            <span className="eyebrow tabular-nums">
              {pad(index + 1)} / {pad(COUNT)}
            </span>
            <span aria-hidden className="relative h-px flex-1 bg-line">
              <span
                className="absolute inset-y-0 left-0 bg-ink transition-[width] duration-500 ease-[var(--ease-out)]"
                style={{ width: `${((index + 1) / COUNT) * 100}%` }}
              />
            </span>
          </div>
        </div>
        <p className="mt-6 max-w-[46ch] text-[0.85rem] leading-relaxed text-ink-3 lg:hidden">
          Sample quotes for this preview. Real reviews will take their place
          after launch.
        </p>
      </div>
    </section>
  );
}
