"use client";

import Image from "next/image";
import { useRef } from "react";
import { RevealText } from "@/components/motion/reveal-text";
import { Button } from "@/components/ui/button";
import { EASE, gsap, prefersReducedMotion, useGSAP } from "@/lib/motion/gsap";
import { CLOSING_LINE, FRAME_FOCUS, type HowToFrames, STEPS } from "./steps";

/*
  Pinned for 140 vh on desktop, so the chapter is 2.5 screens. Only images and light
  scrub (0.3): the print opening and closing, one shared push-in, the crossfades.
  Every piece of text switches at a set point with a 0.5 s ease-out, in both directions,
  so wherever you stop there is no half-faded or overlapping state.
*/
const BOUNDS = [0.12, 0.33, 0.54, 0.75, 0.86]; // step i holds from BOUNDS[i] to BOUNDS[i + 1]
const XFADE = 0.07;
const INTRO_OUT = 0.04;
const CAPTION_ON = 0.08;
const CAPTION_OFF = 0.86;
const CLOSING_AT = 0.9;
const SWITCH = { duration: 0.5, ease: "power3.out" } as const;
const CLOSING_WORDS = [
  { id: "one-a", word: "One" },
  { id: "stick", word: "stick." },
  { id: "one-b", word: "One" },
  { id: "glass", word: "glass." },
];

const stepAt = (p: number) =>
  p < BOUNDS[1] ? 0 : p < BOUNDS[2] ? 1 : p < BOUNDS[3] ? 2 : 3;

export function HowToScene({ frames }: { frames: HowToFrames }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el || prefersReducedMotion()) return;
      const q = gsap.utils.selector(el);
      const stage = q("[data-stage]")[0] as HTMLElement;
      const win = q("[data-window]")[0] as HTMLElement;
      const slot = q("[data-slot]")[0] as HTMLElement;
      const glint = q("[data-glint]")[0] as HTMLElement;
      const frameEls = q("[data-frame]");
      const lines = q("[data-line]");
      const labels = q("[data-label]");
      const fills = q("[data-fill]");
      const intro = q("[data-intro]");
      const caption = q("[data-caption]");
      const closing = q("[data-closing]");
      const words = q("[data-word]");
      const closingRest = q("[data-closing-rest]");

      const mm = gsap.matchMedia();
      mm.add(
        { desktop: "(min-width: 768px)", mobile: "(max-width: 767.98px)" },
        (ctx) => {
          const desktop = Boolean(ctx.conditions?.desktop);
          gsap.set(frameEls.slice(1), { opacity: 0 });
          gsap.set(fills, { scaleX: 0, transformOrigin: "0% 50%" });
          gsap.set(lines, { yPercent: 110 });
          if (desktop) {
            gsap.set(caption, { autoAlpha: 0, y: 16 });
            gsap.set(words, { yPercent: 110 });
            gsap.set(closingRest, { autoAlpha: 0, y: 16 });
          }

          // Text lives in discrete states and only changes when a threshold is crossed.
          const shown = {
            line: -1,
            step: -1,
            intro: true,
            caption: !desktop,
            closing: false,
          };
          const time = (instant: boolean) => (instant ? 0 : SWITCH.duration);

          const setLine = (next: number, instant: boolean) => {
            const prev = shown.line;
            if (next === prev) return;
            shown.line = next;
            lines.forEach((line, i) => {
              if (i !== next && i !== prev) {
                gsap.set(line, { yPercent: 110, overwrite: true });
              }
            });
            if (instant || prev < 0) {
              if (prev >= 0)
                gsap.set(lines[prev], { yPercent: 110, overwrite: true });
              gsap.set(lines[next], { yPercent: 0, overwrite: true });
              return;
            }
            const dir = next > prev ? 1 : -1;
            gsap.to(lines[prev], {
              yPercent: -110 * dir,
              ...SWITCH,
              overwrite: true,
            });
            gsap.fromTo(
              lines[next],
              { yPercent: 110 * dir },
              { yPercent: 0, ...SWITCH, overwrite: true },
            );
          };

          const setStep = (next: number, instant: boolean) => {
            if (next === shown.step) return;
            shown.step = next;
            labels.forEach((label, i) => {
              gsap.to(label, {
                opacity: i === next ? 1 : i < next ? 0.62 : 0.4,
                duration: time(instant),
                ease: SWITCH.ease,
                overwrite: true,
              });
            });
            fills.forEach((fill, i) => {
              gsap.to(fill, {
                scaleX: i <= next ? 1 : 0,
                duration: time(instant),
                ease: SWITCH.ease,
                overwrite: true,
              });
            });
          };

          const apply = (p: number, instant = false) => {
            const step = stepAt(p);
            setStep(step, instant);
            setLine(!desktop && p >= CLOSING_AT ? STEPS.length : step, instant);
            if (!desktop) return;

            const introOn = p < INTRO_OUT;
            if (introOn !== shown.intro) {
              shown.intro = introOn;
              gsap.to(intro, {
                autoAlpha: introOn ? 1 : 0,
                y: introOn ? 0 : -24,
                duration: time(instant),
                ease: SWITCH.ease,
                overwrite: true,
              });
            }
            const captionOn = p >= CAPTION_ON && p < CAPTION_OFF;
            if (captionOn !== shown.caption) {
              shown.caption = captionOn;
              gsap.to(caption, {
                autoAlpha: captionOn ? 1 : 0,
                y: captionOn ? 0 : p >= CAPTION_OFF ? -16 : 16,
                duration: time(instant),
                ease: SWITCH.ease,
                overwrite: true,
              });
            }
            const closingOn = p >= CLOSING_AT;
            if (closingOn !== shown.closing) {
              shown.closing = closingOn;
              gsap.set(closing, { autoAlpha: 1 });
              gsap.to(words, {
                yPercent: closingOn ? 0 : 110,
                duration: instant ? 0 : 0.6,
                ease: SWITCH.ease,
                stagger: closingOn && !instant ? 0.07 : 0,
                overwrite: true,
              });
              gsap.to(closingRest, {
                autoAlpha: closingOn ? 1 : 0,
                y: closingOn ? 0 : 16,
                duration: time(instant),
                delay: closingOn && !instant ? 0.25 : 0,
                ease: SWITCH.ease,
                overwrite: true,
              });
            }
          };

          // Images and light: the only things that scrub.
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: stage,
              start: "top top",
              end: desktop ? "+=140%" : "+=120%",
              pin: true,
              scrub: 0.3,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => apply(self.progress),
              onRefresh: (self) => apply(self.progress, true),
            },
          });
          tl.to({}, { duration: 1 }, 0);
          tl.fromTo(
            q("[data-push]"),
            { scale: 1 },
            { scale: 1.12, duration: 0.92 },
            0.04,
          );
          for (let i = 1; i < frameEls.length; i++) {
            const at = BOUNDS[i] - XFADE / 2;
            tl.to(
              frameEls[i],
              { opacity: 1, duration: XFADE, ease: EASE.inOut },
              at,
            );
            tl.to(
              q("[data-flash]"),
              { opacity: 0.1, duration: XFADE / 2, ease: "sine.inOut" },
              at,
            );
            tl.to(
              q("[data-flash]"),
              { opacity: 0, duration: XFADE / 2, ease: "sine.inOut" },
              at + XFADE / 2,
            );
          }
          apply(tl.scrollTrigger?.progress ?? 0, true);
          if (!desktop) return;

          // Desktop: the print opens to full bleed, then closes again at the end.
          const inset = () => {
            const scale = slot.offsetWidth / stage.clientWidth;
            return {
              x: slot.offsetLeft,
              y: slot.offsetTop,
              scale,
              radius: `${22 / scale}px`,
            };
          };
          const toInset = {
            x: () => inset().x,
            y: () => inset().y,
            scale: () => inset().scale,
            "--win-r": () => inset().radius,
          };
          gsap.set(win, { transformOrigin: "0% 0%" });
          tl.fromTo(
            win,
            toInset,
            {
              x: 0,
              y: 0,
              scale: 1,
              "--win-r": "0px",
              duration: BOUNDS[0],
              ease: EASE.inOut,
            },
            0,
          );
          tl.to(
            win,
            { ...toInset, duration: 1 - BOUNDS[4], ease: EASE.inOut },
            BOUNDS[4],
          );

          // Light follows the hand: a soft sun glint over the photograph.
          if (!window.matchMedia("(pointer: fine)").matches) return;
          const gx = gsap.quickTo(glint, "x", {
            duration: 0.9,
            ease: "power3",
          });
          const gy = gsap.quickTo(glint, "y", {
            duration: 0.9,
            ease: "power3",
          });
          let lit = false;
          const move = (event: PointerEvent) => {
            const rect = win.getBoundingClientRect();
            const scale = rect.width / win.offsetWidth || 1;
            gx((event.clientX - rect.left) / scale);
            gy((event.clientY - rect.top) / scale);
            if (lit) return;
            lit = true;
            gsap.to(glint, { opacity: 1, duration: 0.6, overwrite: "auto" });
          };
          const leave = () => {
            lit = false;
            gsap.to(glint, { opacity: 0, duration: 0.8, overwrite: "auto" });
          };
          stage.addEventListener("pointermove", move);
          stage.addEventListener("pointerleave", leave);
          return () => {
            stage.removeEventListener("pointermove", move);
            stage.removeEventListener("pointerleave", leave);
          };
        },
      );
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="motion-reduce:hidden">
      <ol className="sr-only">
        {STEPS.map((step) => (
          <li key={step.n}>{step.line}</li>
        ))}
        <li>{CLOSING_LINE}</li>
      </ol>

      <div
        data-stage
        className="relative flex h-[100svh] min-h-[600px] w-full flex-col gap-6 overflow-hidden bg-chalk px-[var(--gutter)] pt-24 pb-28 md:block md:p-0"
      >
        <div className="md:absolute md:inset-x-0 md:top-[6.75rem] md:z-[2] md:px-[var(--gutter)]">
          <p className="rule-label eyebrow">/ How to use</p>
        </div>
        <div
          data-intro
          className="md:absolute md:top-[28%] md:left-[var(--gutter)] md:w-[calc(50%-var(--gutter)*2-2rem)]"
        >
          <RevealText
            as="h2"
            by="words"
            stagger={0.06}
            className="font-display text-ink [font-size:var(--fs-h2)] md:[font-size:var(--fs-h1)]"
          >
            Tear, pour, stir, drink.
          </RevealText>
          <RevealText
            as="p"
            delay={0.2}
            className="mt-8 hidden max-w-[21rem] text-[15px] text-ink-2 leading-relaxed md:block"
          >
            Everything you need is already in the stick. No scoop, no measuring.
          </RevealText>
        </div>

        {/* Desktop: where the print rests before it opens and after it closes. */}
        <div
          data-slot
          aria-hidden
          className="pointer-events-none invisible absolute top-[28%] right-[var(--gutter)] hidden h-1/2 w-1/2 md:block"
        />

        <div
          data-window
          className="relative min-h-0 w-full flex-1 overflow-hidden bg-shallow will-change-transform [--win-r:var(--r-md)] [clip-path:inset(0_round_var(--win-r))] md:absolute md:inset-0 md:z-[1] md:h-full md:origin-top-left md:[--win-r:44px] md:[transform:translate(calc(50%-var(--gutter)),28%)_scale(0.5)]"
        >
          <div
            data-push
            className="absolute inset-0 will-change-transform"
            style={{ transformOrigin: FRAME_FOCUS }}
          >
            {frames.map((frame, i) => (
              <div
                key={frame.src}
                data-frame
                className="absolute inset-0"
                aria-hidden={i > 0}
              >
                <Image
                  src={frame.src}
                  alt={i === 0 ? frame.alt : ""}
                  fill
                  quality={85}
                  sizes="100vw"
                  className="object-cover"
                  style={{ objectPosition: FRAME_FOCUS }}
                />
              </div>
            ))}
          </div>
          <div
            data-flash
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[#fff8ec] opacity-0"
          />
          <div
            data-glint
            aria-hidden
            className="pointer-events-none absolute top-[-35vmax] left-[-35vmax] size-[70vmax] rounded-full opacity-0 mix-blend-soft-light [background:radial-gradient(closest-side,rgb(255_246_226/0.8),rgb(255_246_226/0)_100%)]"
          />
        </div>

        {/* Over the open sky on desktop; under the photo on mobile. */}
        <div
          data-caption
          aria-hidden
          className="md:invisible md:absolute md:top-[24%] md:left-[var(--gutter)] md:z-[2] md:w-[min(34rem,38%)]"
        >
          <div className="grid grid-cols-4 gap-2 md:gap-3">
            {STEPS.map((step) => (
              <div key={step.n} data-label className="opacity-40">
                <p className="eyebrow whitespace-nowrap text-ink">
                  {step.n} / {step.label}
                </p>
                <div className="mt-2.5 h-px w-full overflow-hidden bg-[rgb(18_49_77/0.18)]">
                  <div data-fill className="h-full w-full bg-ink" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid overflow-hidden md:mt-8">
            {[...STEPS.map((step) => step.line), CLOSING_LINE].map(
              (line, i) => (
                <p
                  key={line}
                  data-line
                  className={`font-display pb-[0.08em] text-ink [grid-area:1/1] [font-size:var(--fs-h3)] leading-[1.1] md:[font-size:var(--fs-h2)] ${
                    i === STEPS.length ? "md:hidden" : ""
                  }`}
                >
                  {line}
                </p>
              ),
            )}
          </div>
        </div>

        <div
          data-closing
          className="invisible hidden md:absolute md:top-[28%] md:left-[var(--gutter)] md:block md:w-[calc(50%-var(--gutter)*2-2rem)]"
        >
          <p className="font-display text-ink [font-size:var(--fs-h1)]">
            {CLOSING_WORDS.map(({ id, word }, i) => (
              <span key={id}>
                <span className="-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-bottom">
                  <span data-word className="inline-block">
                    {word}
                  </span>
                </span>
                {i === 1 ? <br /> : " "}
              </span>
            ))}
          </p>
          <div data-closing-rest>
            <p className="mt-8 max-w-[21rem] text-[15px] text-ink-2 leading-relaxed">
              Hydration Sticks come in packs of 5, 15 and 30. For the gym bag,
              the desk drawer and the carry-on.
            </p>
            <Button href="#shop" size="lg" className="mt-8">
              Shop the sticks
            </Button>
          </div>
        </div>
      </div>

      <div className="px-[var(--gutter)] pt-2 pb-[var(--section-y)] md:hidden">
        <Button href="#shop" size="lg">
          Shop the sticks
        </Button>
      </div>
      <div aria-hidden className="hidden h-[10vh] md:block" />
    </div>
  );
}
