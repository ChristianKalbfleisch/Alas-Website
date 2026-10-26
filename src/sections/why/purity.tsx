"use client";

import Image from "next/image";
import { type CSSProperties, useRef } from "react";
import { RevealMedia } from "@/components/motion/reveal-media";
import { RevealText } from "@/components/motion/reveal-text";
import { art } from "@/data/art";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion/gsap";
import { PURITY } from "./copy";
import { exitAtTop, riseIn } from "./motion";

const SIZES = "(min-width: 1440px) 1344px, 94vw";

/**
 * Two real macro photographs split by a hairline: refined table salt on the
 * left, Aegean fleur de sel on the right. The line sweeps to the centre as the
 * picture arrives (image scrub ≤ 0.3) and follows a fine pointer on hover.
 */
export function Purity() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || prefersReducedMotion()) return;
      const q = gsap.utils.selector(root);
      const media = q("[data-split]")[0] as HTMLElement | undefined;
      if (!media) return;

      riseIn(q("[data-caption]"), "top 92%", 0.1);
      exitAtTop(q("[data-exit]"));

      const state = { scroll: 50, hover: 50, mix: 0 };
      const apply = () => {
        const v = state.scroll + (state.hover - state.scroll) * state.mix;
        media.style.setProperty("--split", `${v.toFixed(2)}%`);
      };
      gsap.fromTo(
        state,
        { scroll: 0 },
        {
          scroll: 50,
          ease: "power2.inOut",
          onUpdate: apply,
          scrollTrigger: {
            trigger: media,
            start: "top 85%",
            end: "center 58%",
            scrub: 0.3,
          },
        },
      );

      // The two tags appear once the line has settled, never half-faded.
      gsap.fromTo(
        q("[data-tag]"),
        { opacity: 0, y: 6 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.06,
          scrollTrigger: {
            trigger: media,
            start: "center 60%",
            toggleActions: "play none none reverse",
          },
        },
      );

      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        return;
      }
      const toHover = gsap.quickTo(state, "hover", {
        duration: 0.7,
        ease: "power3.out",
        onUpdate: apply,
      });
      const at = (event: PointerEvent) => {
        const r = media.getBoundingClientRect();
        return gsap.utils.clamp(
          8,
          92,
          ((event.clientX - r.left) / r.width) * 100,
        );
      };
      const onMove = (event: PointerEvent) => toHover(at(event));
      const onEnter = (event: PointerEvent) => {
        state.hover = state.scroll;
        toHover(at(event));
        gsap.to(state, {
          mix: 1,
          duration: 0.6,
          ease: "power2.out",
          onUpdate: apply,
        });
      };
      const onLeave = () => {
        gsap.to(state, {
          mix: 0,
          duration: 1.1,
          ease: "power3.inOut",
          onUpdate: apply,
        });
      };
      media.addEventListener("pointerenter", onEnter);
      media.addEventListener("pointermove", onMove);
      media.addEventListener("pointerleave", onLeave);
      return () => {
        media.removeEventListener("pointerenter", onEnter);
        media.removeEventListener("pointermove", onMove);
        media.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="container-x py-12 lg:py-16">
      <div
        data-exit
        className="grid gap-4 lg:grid-cols-12 lg:items-end lg:gap-6"
      >
        <div className="lg:col-span-7">
          <p className="eyebrow">{PURITY.label}</p>
          <RevealText
            as="h3"
            by="words"
            stagger={0.05}
            className="font-display mt-4 text-[length:var(--fs-h2)] text-ink lg:mt-5"
          >
            {PURITY.title}
          </RevealText>
        </div>
        <RevealText
          as="p"
          delay={0.15}
          className="max-w-[30ch] text-[16px] text-ink-2 leading-relaxed lg:col-span-4 lg:col-start-9 lg:pb-2 lg:text-[17px]"
        >
          {PURITY.lead}
        </RevealText>
      </div>

      <div data-exit className="mt-7 lg:mt-10">
        <RevealMedia from="bottom">
          <div
            data-split
            className="relative aspect-[4/5] w-full cursor-ew-resize select-none overflow-hidden bg-stone sm:aspect-[16/9] lg:aspect-[5/2]"
            style={{ "--split": "50%" } as CSSProperties}
          >
            <Image
              src={art.photo.fleurMacro.src}
              alt={art.photo.fleurMacro.alt}
              fill
              sizes={SIZES}
              quality={85}
              className="object-cover"
            />
            <div
              className="absolute inset-0"
              style={{ clipPath: "inset(0 calc(100% - var(--split)) 0 0)" }}
            >
              <Image
                src={art.photo.tableSalt.src}
                alt={art.photo.tableSalt.alt}
                fill
                sizes={SIZES}
                quality={85}
                className="object-cover"
              />
            </div>

            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 w-px bg-white shadow-[0_0_0_0.5px_rgb(18_49_77/0.16),0_0_18px_rgb(255_255_255/0.7)]"
              style={{ left: "var(--split)" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute top-4 lg:top-6"
              style={{ left: "var(--split)" }}
            >
              <span className="-translate-x-[calc(100%+12px)] absolute top-0">
                <span
                  data-tag
                  className="glass eyebrow block whitespace-nowrap rounded-full px-3 py-[0.45rem] text-ink! leading-none motion-reduce:opacity-100"
                >
                  {PURITY.refined.tag}
                </span>
              </span>
              <span className="absolute top-0 left-3">
                <span
                  data-tag
                  className="glass eyebrow block whitespace-nowrap rounded-full px-3 py-[0.45rem] text-ink! leading-none motion-reduce:opacity-100"
                >
                  {PURITY.unrefined.tag}
                </span>
              </span>
            </div>
          </div>
        </RevealMedia>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 sm:gap-12 lg:mt-8">
        <div data-caption className="border-[var(--c-line)] border-t pt-4">
          <p className="eyebrow">{PURITY.refined.name}</p>
          <p className="mt-2 max-w-[42ch] text-[15px] text-ink-2 leading-relaxed">
            {PURITY.refined.body}
          </p>
        </div>
        <div data-caption className="border-[var(--c-line)] border-t pt-4">
          <p className="eyebrow text-ink!">{PURITY.unrefined.name}</p>
          <p className="mt-2 max-w-[46ch] text-[15px] text-ink leading-relaxed">
            {PURITY.unrefined.body}
          </p>
        </div>
      </div>
    </div>
  );
}
