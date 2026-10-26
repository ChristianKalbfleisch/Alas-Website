"use client";

import Image from "next/image";
import { useRef } from "react";
import { art } from "@/data/art";
import { EASE, gsap, prefersReducedMotion, useGSAP } from "@/lib/motion/gsap";
import { scrollToTarget } from "@/lib/motion/smooth-scroll";
import { FDA_DISCLAIMER } from "./links";

/** Where the sea meets the sky in sea-horizon.jpg, as a share of its height. */
const HORIZON = 0.502;

/**
 * The last frame: the sea horizon from a stone terrace. ἅλας rises out of the
 * sea as the page reaches its end, clipped by the horizon line. The photograph
 * fills the frame with horizontal cropping only (the frame is never wider than
 * the photo's 2.33:1), so the horizon stays at the same height on every screen.
 */
export function Horizon() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || prefersReducedMotion()) return;
      const word = root.querySelector<HTMLElement>("[data-word]");
      const scene = root.querySelector<HTMLElement>("[data-scene]");
      if (!word || !scene) return;

      // The photograph may drift (image, light scrub); the word never scrubs.
      gsap.fromTo(
        scene,
        { scale: 1.08 },
        {
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top bottom",
            end: "bottom bottom",
            scrub: 0.3,
          },
        },
      );
      gsap.fromTo(
        word,
        { yPercent: 100 },
        {
          yPercent: 0,
          duration: 1.4,
          ease: EASE.out,
          scrollTrigger: {
            trigger: root,
            start: "top 35%",
            toggleActions: "play none none reverse",
          },
        },
      );

      const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
      if (!fine.matches) return;
      const drift = root.querySelector<HTMLElement>("[data-drift]");
      if (!drift) return;
      const toX = gsap.quickTo(drift, "x", { duration: 1.6, ease: "power3" });
      const move = (event: PointerEvent) => {
        const nx = event.clientX / window.innerWidth - 0.5;
        toX(nx * 26);
      };
      root.addEventListener("pointermove", move);
      return () => root.removeEventListener("pointermove", move);
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      className="relative h-[max(43vw,88svh)] min-h-[34rem] overflow-hidden bg-shallow"
    >
      <div data-scene className="absolute inset-0 origin-[50%_50.2%]">
        <Image
          src={art.photo.horizon.src}
          alt={art.photo.horizon.alt}
          fill
          sizes="100vw"
          quality={85}
          className="object-cover"
          style={{ objectPosition: "62% 50%" }}
        />
      </div>
      <div
        className="absolute inset-x-0 top-0 overflow-hidden"
        style={{ height: `${HORIZON * 100}%` }}
      >
        <div data-word className="absolute inset-x-0 bottom-0">
          <div data-drift className="flex justify-center">
            <span
              lang="grc"
              className="font-display block translate-y-[0.06em] select-none text-ink/90 leading-[0.86]"
              style={{ fontSize: "clamp(9.5rem, 6rem + 22vw, 26rem)" }}
            >
              ἅλας
            </span>
          </div>
        </div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[34%] bg-gradient-to-b from-chalk via-chalk/70 to-transparent"
      />

      <div className="container-x absolute inset-x-0 top-[5%] flex flex-col items-center gap-1.5 text-center sm:flex-row sm:items-baseline sm:justify-between sm:text-left">
        <p className="eyebrow text-ink">/ From the Aegean to you</p>
        <p className="text-[0.82rem] text-ink-2">
          <span lang="grc" className="font-display text-[1.05rem] text-ink">
            ἅλας
          </span>{" "}
          (AH-las) means salt, in Greek
        </p>
      </div>

      <div
        className="glass absolute inset-x-[var(--gutter)] bottom-[clamp(1rem,2.5vw,2rem)] rounded-[var(--r-md)] px-5 py-4 text-ink sm:px-7 sm:py-5"
        style={{ background: "rgb(255 255 255 / 0.62)" }}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <p className="eyebrow text-ink">
            Harvested in Greece, packaged in the USA
          </p>
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <p className="eyebrow whitespace-nowrap text-ink">
              © 2026 ALAS Salt Co. LLC
            </p>
            <button
              type="button"
              onClick={() => scrollToTarget(0)}
              className="eyebrow whitespace-nowrap text-ink underline decoration-[var(--c-line-strong)] underline-offset-4 transition-colors hover:decoration-ink"
            >
              Back to top ↑
            </button>
          </div>
        </div>
        <p className="mt-3 max-w-[110ch] text-[0.74rem] leading-relaxed text-ink-2">
          {FDA_DISCLAIMER}
        </p>
      </div>
    </div>
  );
}
