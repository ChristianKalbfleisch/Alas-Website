"use client";

import Image from "next/image";
import { useRef } from "react";
import { art } from "@/data/art";
import {
  gsap,
  prefersReducedMotion,
  ScrollTrigger,
  useGSAP,
} from "@/lib/motion/gsap";

const BEATS = [
  {
    n: "01",
    title: "The sea",
    line: "Seawater fills shallow pans by the shore.",
  },
  {
    n: "02",
    title: "Sun and wind",
    line: "All summer, sun and wind dry it slowly, over weeks.",
  },
  {
    n: "03",
    title: "The flower of salt",
    line: "Crystals bloom on the surface. Fleur de sel, the flower of salt.",
  },
  {
    n: "04",
    title: "Raked by hand, late summer",
    line: "Hand-harvested. Sun-dried. Nothing added.",
    note: "Wooden tools · No anti-caking agents, no additives",
  },
];

/** Film progress where each beat takes over. Text switches only here. */
const AT = [0, 0.22, 0.47, 0.73];

const CSS = `
@media (prefers-reduced-motion: no-preference) {
  [data-origin-film] [data-cap]:not([data-cap="0"]),
  [data-origin-film] [data-num]:not([data-num="0"]) { opacity: 0; visibility: hidden; }
}
`;

export function HarvestFilm() {
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = track.current;
      if (!root || prefersReducedMotion()) return;
      const q = (sel: string) => root.querySelector(sel) as HTMLElement;
      const qa = (sel: string) =>
        Array.from(root.querySelectorAll<HTMLElement>(sel));

      /* ---- Images and light: scrubbed, lightly smoothed. ---- */
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.3,
        },
      });
      // 01 The sea: a slow settle into the pans.
      tl.fromTo(
        q("[data-pans]"),
        { scale: 1.06 },
        { scale: 1, duration: 0.3, ease: "power1.out" },
        0,
      );
      // 02 Sun and wind: warm light rises over the scene.
      tl.fromTo(
        q("[data-sun]"),
        { opacity: 0 },
        { opacity: 1, duration: 0.2, ease: "power2.inOut" },
        0.16,
      );
      // Into the water of the nearest pan (no blur: never past the photo's own pixels).
      tl.to(
        q("[data-pans]"),
        { scale: 1.32, duration: 0.18, ease: "power2.in" },
        0.3,
      );
      // 03 The flower of salt: the crystals rise over the pan as a clean wipe.
      tl.fromTo(
        q("[data-bloom]"),
        { clipPath: "inset(100% 0% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 0.12, ease: "none" },
        0.36,
      );
      tl.fromTo(
        q("[data-bloom-img]"),
        { yPercent: 8 },
        { yPercent: 0, duration: 0.12, ease: "none" },
        0.36,
      );
      tl.fromTo(
        q("[data-wipe-line='macro']"),
        { top: "100%", opacity: 1 },
        { top: "0%", duration: 0.12, ease: "none" },
        0.36,
      );
      tl.to(
        q("[data-wipe-line='macro']"),
        { opacity: 0, duration: 0.01 },
        0.48,
      );
      tl.to(q("[data-sun]"), { opacity: 0.3, duration: 0.14 }, 0.48);
      // 04 By hand: the photo rises as a clean wipe from below (never a
      // half-dissolve, so any stop point reads as a deliberate split).
      tl.fromTo(
        q("[data-hands]"),
        { clipPath: "inset(100% 0% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 0.12, ease: "none" },
        0.63,
      );
      tl.fromTo(
        q("[data-hands-img]"),
        { yPercent: 8 },
        { yPercent: 0, duration: 0.12, ease: "none" },
        0.63,
      );
      tl.fromTo(
        q("[data-wipe-line='hands']"),
        { top: "100%", opacity: 1 },
        { top: "0%", duration: 0.12, ease: "none" },
        0.63,
      );
      tl.to(
        q("[data-wipe-line='hands']"),
        { opacity: 0, duration: 0.01 },
        0.75,
      );
      tl.fromTo(
        q("[data-progress]"),
        { scaleX: 0 },
        { scaleX: 1, duration: 1 },
        0,
      );

      /* ---- Words: never scrubbed. They switch at set points. ---- */
      // One beat on screen at a time: what is showing leaves first, then the next
      // arrives. Each switch cancels the last, so a fast flick can never leave two
      // captions layered on top of each other.
      const caps = qa("[data-cap]");
      const nums = qa("[data-num]");
      const words = qa("[data-word]");
      const OUT = 0.18;
      const visible = (el: Element) =>
        Number(gsap.getProperty(el, "opacity")) > 0.01;
      let beat = 0;
      const setBeat = (next: number) => {
        if (next === beat) return;
        const dir = next > beat ? 1 : -1;
        beat = next;
        const incoming = [caps[next], nums[next]];
        const others = [...caps, ...nums].filter(
          (el) => !incoming.includes(el),
        );
        const arriving = visible(caps[next]);
        gsap.killTweensOf([...caps, ...nums, ...words]);
        const leaving = others.filter(visible);
        gsap.set(
          others.filter((el) => !leaving.includes(el)),
          { autoAlpha: 0 },
        );
        if (leaving.length) {
          gsap.to(leaving, {
            autoAlpha: 0,
            y: -14 * dir,
            duration: OUT,
            ease: "power1.in",
          });
        }
        const delay = leaving.length && !arriving ? OUT : 0;
        if (arriving) {
          gsap.to(incoming, {
            autoAlpha: 1,
            y: 0,
            duration: 0.35,
            ease: "power2.out",
          });
        } else {
          gsap.fromTo(
            incoming,
            { autoAlpha: 0, y: 18 * dir },
            { autoAlpha: 1, y: 0, duration: 0.45, delay, ease: "power2.out" },
          );
        }
        if (next === 3) {
          gsap.fromTo(
            words,
            { autoAlpha: 0, yPercent: 60 },
            {
              autoAlpha: 1,
              yPercent: 0,
              duration: 0.55,
              delay: delay + 0.03,
              stagger: 0.07,
              ease: "power3.out",
            },
          );
        }
      };
      const syncer = ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        onUpdate(self) {
          const p = self.progress;
          let next = 0;
          AT.forEach((at, i) => {
            if (p >= at) next = i;
          });
          setBeat(next);
        },
      });
      return () => syncer.kill();
    },
    { scope: track },
  );

  return (
    <div
      ref={track}
      data-origin-film
      className="relative h-[170svh] motion-reduce:h-auto"
    >
      <style href="origin-film" precedence="default">
        {CSS}
      </style>
      <div className="sticky top-0 h-[100svh] min-h-[560px] overflow-hidden motion-reduce:hidden">
        {/* Media, back to front. All real photographs, never upscaled. */}
        <div data-pans className="absolute inset-0 origin-[30%_82%]">
          <Image
            src={art.photo.saltPans.src}
            alt={art.photo.saltPans.alt}
            fill
            sizes="(max-aspect-ratio: 16/9) 235vh, 132vw"
            quality={85}
            className="object-cover object-[66%_50%]"
          />
        </div>
        <div
          data-sun
          aria-hidden
          className="absolute inset-0 opacity-0 mix-blend-screen"
          style={{
            background:
              "radial-gradient(90% 75% at 86% -8%, rgb(255 214 150 / 0.62), rgb(255 205 140 / 0.22) 42%, rgb(255 205 140 / 0) 72%)",
          }}
        />
        <div
          data-bloom
          className="absolute inset-0"
          style={{ clipPath: "inset(100% 0% 0% 0%)" }}
        >
          <div data-bloom-img className="absolute -inset-y-[5%] inset-x-0">
            <Image
              src={art.photo.fleurMacro.src}
              alt={art.photo.fleurMacro.alt}
              fill
              sizes="(max-aspect-ratio: 3/2) 165vh, 100vw"
              quality={85}
              className="object-cover object-[50%_48%]"
            />
          </div>
        </div>
        <div
          data-hands
          className="absolute inset-0"
          style={{ clipPath: "inset(100% 0% 0% 0%)" }}
        >
          <div data-hands-img className="absolute -inset-y-[5%] inset-x-0">
            <Image
              src={art.photo.hands.src}
              alt={art.photo.hands.alt}
              fill
              sizes="(max-aspect-ratio: 4/5) 92vh, 104vw"
              quality={85}
              className="object-cover object-[50%_42%] md:object-[50%_58%]"
            />
          </div>
        </div>
        {/* A chalk hairline rides each wipe's edge. */}
        <div
          data-wipe-line="macro"
          aria-hidden
          className="absolute inset-x-0 h-px bg-white/80 shadow-[0_0_14px_rgb(255_255_255_/_0.7)]"
          style={{ top: "100%" }}
        />
        <div
          data-wipe-line="hands"
          aria-hidden
          className="absolute inset-x-0 h-px bg-white/80 shadow-[0_0_14px_rgb(255_255_255_/_0.7)]"
          style={{ top: "100%" }}
        />

        {/* Chalk at both edges, so the film arrives and leaves without a seam. */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[12%] bg-gradient-to-b from-[var(--c-chalk)] to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[58%] bg-[linear-gradient(0deg,var(--c-chalk)_0%,rgb(250_248_244_/_0.9)_22%,rgb(250_248_244_/_0.55)_52%,rgb(250_248_244_/_0)_100%)] max-md:h-[64%]"
        />

        <ol className="sr-only">
          {BEATS.map((beat) => (
            <li key={beat.n}>
              {beat.title}: {beat.line}
            </li>
          ))}
        </ol>
        <div
          aria-hidden
          className="absolute right-[var(--gutter)] bottom-[max(11vh,88px)] left-[var(--gutter)] md:right-auto md:w-[min(48vw,660px)]"
        >
          <p className="eyebrow flex items-center gap-4 text-ink-2">
            <span>/ How it is made</span>
            <span className="relative inline-grid text-ink tabular-nums">
              {BEATS.map((beat, i) => (
                <span key={beat.n} data-num={i} className="[grid-area:1/1]">
                  {beat.n}
                </span>
              ))}
            </span>
            <span>/ 04</span>
            <span className="relative h-px flex-1 bg-[var(--c-line-strong)]">
              <span
                data-progress
                className="absolute inset-0 origin-left scale-x-0 bg-ink"
              />
            </span>
          </p>
          <div className="mt-5 grid">
            {BEATS.map((beat, i) => (
              <div key={beat.n} data-cap={i} className="[grid-area:1/1]">
                <p className="eyebrow text-ink-2">/ {beat.title}</p>
                {beat.note ? (
                  <>
                    <p className="mt-3 font-display text-[clamp(2rem,1.3rem+2.4vw,3.6rem)] text-ink leading-[1.04]">
                      {beat.line.split(" ").map((word, w) => (
                        <span
                          // biome-ignore lint/suspicious/noArrayIndexKey: static words
                          key={w}
                          className="inline-block overflow-hidden pb-[0.06em] align-bottom"
                        >
                          <span data-word className="inline-block">
                            {word}
                          </span>
                          {w < beat.line.split(" ").length - 1 ? " " : ""}
                        </span>
                      ))}
                    </p>
                    <p className="eyebrow mt-4 text-ink-3">{beat.note}</p>
                  </>
                ) : (
                  <p className="mt-3 font-display text-[clamp(1.6rem,1.15rem+1.5vw,2.75rem)] text-ink leading-[1.08] [text-wrap:balance]">
                    {beat.line}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reduced motion: the same four beats as one calm editorial row. */}
      <div className="container-x hidden pt-16 pb-[var(--section-y)] motion-reduce:block">
        <p className="rule-label eyebrow text-ink-2">/ How it is made</p>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {[
            { img: art.photo.saltPans, beat: BEATS[0], extra: BEATS[1] },
            { img: art.photo.fleurMacro, beat: BEATS[2] },
            { img: art.photo.hands, beat: BEATS[3] },
          ].map(({ img, beat, extra }) => (
            <figure key={beat.n}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--r-md)]">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 767px) 100vw, 30vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-4">
                <p className="eyebrow text-ink-2">
                  {beat.n} / {beat.title}
                </p>
                <p className="mt-2 font-display text-[1.45rem] text-ink leading-snug">
                  {beat.line}
                  {extra ? ` ${extra.line}` : ""}
                </p>
                {beat.note ? (
                  <p className="eyebrow mt-2 text-ink-3">{beat.note}</p>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
