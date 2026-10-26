"use client";

import Image from "next/image";
import { useRef } from "react";
import { RitualCta, useRitualJoined } from "@/components/cart/ritual-cta";
import { RevealText } from "@/components/motion/reveal-text";
import { art } from "@/data/art";
import { POUCH_CUTOUT } from "@/data/products";
import { RITUAL, RITUAL_SAVE_PERCENT, ritualLive } from "@/data/ritual";
import { formatPrice } from "@/lib/cart/cart-math";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion/gsap";

/** The owners' words for The Ritual, with the terms they set after the preview. */
const INCLUDED = [
  { label: "Every month", text: "Two 390 g pouches of Aegean salt" },
  { label: "First order", text: "The Welcome Box" },
  {
    label: "In print",
    text: "The Ritual Guide. One mineral. Multiple rituals.",
  },
] as const;

/**
 * 11 / The Ritual. A hairline horizon opens into the sunlit sea; a pouch stands on
 * the stone ledge in the same light; a liquid glass card gives the terms and asks
 * for one email (or, once the plan is live in Shopify, starts the subscription).
 * Images scrub lightly; text only switches.
 */
export function ClubScene() {
  const root = useRef<HTMLDivElement>(null);
  const win = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLDivElement>(null);
  const pouch = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const [joined] = useRitualJoined();

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const opening = {
        trigger: win.current,
        start: "top 88%",
        end: "top 15%",
        scrub: 0.3,
      };
      gsap.fromTo(
        win.current,
        { clipPath: "inset(49.7% 0% 49.7% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          ease: "power2.inOut",
          scrollTrigger: opening,
        },
      );
      gsap.fromTo(
        photo.current,
        { scale: 1.16 },
        { scale: 1.02, ease: "none", scrollTrigger: opening },
      );
      // The pouch is set down on the ledge once the horizon has opened.
      gsap.from(pouch.current, {
        y: -18,
        autoAlpha: 0,
        duration: 1.1,
        ease: "expo.out",
        scrollTrigger: {
          trigger: win.current,
          start: "top 30%",
          toggleActions: "play none none reverse",
        },
      });
      gsap.from(card.current, {
        y: 36,
        autoAlpha: 0,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: {
          trigger: card.current,
          start: "top 88%",
          toggleActions: "play none none reverse",
        },
      });
      // Shared exit: the window leaves as it passes the top of the screen.
      gsap.to(win.current, {
        autoAlpha: 0,
        y: -24,
        scale: 0.98,
        duration: 0.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: win.current,
          start: "bottom 15%",
          toggleActions: "play none none reverse",
        },
      });
    },
    { scope: root },
  );

  return (
    <div ref={root}>
      <div className="container-x">
        <div className="rule-label">
          <p className="eyebrow">/ The Ritual</p>
          <p className="eyebrow ml-auto !text-ink-3">
            Founding members · Opening soon
          </p>
        </div>
      </div>

      <div
        ref={win}
        className="relative mt-10 h-[78svh] min-h-[560px] overflow-hidden sm:mt-14 md:h-[min(100svh,960px)] md:min-h-[680px]"
      >
        <div className="absolute inset-x-0 -top-[8%] bottom-0">
          <div
            ref={photo}
            className="absolute inset-0 origin-bottom will-change-transform"
          >
            <Image
              src={art.photo.horizon.src}
              alt={art.photo.horizon.alt}
              fill
              sizes="100vw"
              className="object-cover object-[50%_60%]"
            />
            {/* Set on the stone ledge, in the photograph's own light. */}
            <div
              ref={pouch}
              className="absolute right-[9%] bottom-[5%] h-[29%] md:right-[17%] md:h-[31%]"
              style={{
                aspectRatio: `${POUCH_CUTOUT.width} / ${POUCH_CUTOUT.height}`,
              }}
            >
              <span
                aria-hidden
                className="absolute -bottom-[3%] left-[-14%] h-[9%] w-[128%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(52_44_30_/_0.55),rgb(52_44_30_/_0.22)_55%,transparent)] mix-blend-multiply blur-[2px]"
              />
              <span
                aria-hidden
                className="absolute -bottom-[1.5%] left-[4%] h-[4%] w-[92%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(30_24_16_/_0.7),transparent)] mix-blend-multiply"
              />
              <Image
                src={POUCH_CUTOUT.src}
                alt={POUCH_CUTOUT.alt}
                fill
                quality={95}
                sizes="(min-width: 768px) 260px, 140px"
                className="object-contain object-bottom brightness-[1.04] contrast-[1.03] saturate-[0.95]"
                style={{
                  // Follow the pouch silhouette: trims the cut-out remnants at its base.
                  clipPath:
                    "polygon(7% 1.7%, 93% 1.7%, 96.5% 4%, 97.5% 15%, 96.5% 30%, 94.8% 50%, 93.5% 65%, 92.6% 80%, 92.2% 89%, 88.5% 95.5%, 84% 96.6%, 15% 96.6%, 11% 95.5%, 10% 89%, 9.6% 80%, 9.3% 75%, 8.7% 65%, 7.2% 50%, 5.2% 30%, 3.7% 15%, 3.9% 4%)",
                }}
              />
            </div>
          </div>
        </div>

        <div className="container-x relative z-10 pt-[11svh] md:pt-[13svh]">
          <RevealText
            as="h2"
            start="top 70%"
            className="font-display text-[length:var(--fs-display)] text-ink leading-[0.9]"
          >
            The Ritual.
          </RevealText>
          <RevealText
            start="top 75%"
            delay={0.15}
            className="mt-4 font-display text-[length:var(--fs-h3)] text-ink md:mt-6"
          >
            The Aegean, every month.
          </RevealText>
        </div>

        <p className="eyebrow absolute right-[var(--gutter)] bottom-5 z-10 hidden !text-ink/70 md:block">
          / Midday, from a stone terrace
        </p>
      </div>

      <div className="container-x relative z-20 mt-6 md:-mt-[30svh]">
        <div
          ref={card}
          className="glass max-w-[640px] rounded-[24px] p-6 sm:rounded-[28px] sm:p-10"
          style={{
            background:
              "linear-gradient(180deg, rgb(255 255 255 / 0.82) 0%, rgb(255 255 255 / 0.7) 100%)",
          }}
        >
          <div className="flex items-start justify-between gap-6 border-[var(--c-line)] border-b pb-5">
            <div>
              <p className="eyebrow">/ Founding members</p>
              <h3 className="mt-3 font-display text-[2.1rem] leading-[1.02] sm:text-[2.7rem]">
                Be among the first.
              </h3>
            </div>
            <div className="shrink-0 text-right">
              <p className="eyebrow !text-[10px]">Save</p>
              <p className="font-display text-[2.6rem] leading-none sm:text-[3.4rem]">
                {RITUAL_SAVE_PERCENT}%
              </p>
            </div>
          </div>

          <p className="mt-5 flex items-baseline gap-3 font-mono text-ink">
            <span className="text-[1.25rem]">{formatPrice(RITUAL.price)}</span>
            <span className="text-[12px] text-ink-3 uppercase tracking-[0.08em]">
              a month ·{" "}
              <span className="line-through decoration-1">
                {formatPrice(RITUAL.retail)}
              </span>
            </span>
          </p>
          <p className="mt-3 max-w-[46ch] text-[15px] text-ink-2 leading-relaxed">
            The Ritual is our subscription: two pouches every month for{" "}
            {formatPrice(RITUAL.price)}, instead of {formatPrice(RITUAL.retail)}{" "}
            for two bought one at a time.
            {ritualLive()
              ? " Start today."
              : " It opens soon. Join now and you are in from the very beginning."}
          </p>

          <ul className="mt-6">
            {INCLUDED.map((item) => (
              <li
                key={item.label}
                className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-4 border-[var(--c-line)] border-t py-3 last:border-b sm:grid-cols-[8rem_minmax(0,1fr)]"
              >
                <span className="eyebrow">{item.label}</span>
                <span className="font-display text-[1.15rem] leading-snug sm:text-[1.25rem]">
                  {item.text}
                </span>
              </li>
            ))}
          </ul>

          {joined && !ritualLive() ? (
            <div className="mt-8" aria-live="polite">
              <p className="eyebrow">/ You are in</p>
              <p className="mt-2 font-display text-[1.8rem] leading-tight">
                Welcome, from the beginning.
              </p>
              <p className="mt-2 text-[15px] text-ink-2">
                We will write to you when The Ritual opens. You were here first.
              </p>
            </div>
          ) : (
            <RitualCta source="club" mode="open" className="mt-8" />
          )}
        </div>
      </div>
    </div>
  );
}
