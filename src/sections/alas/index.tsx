"use client";

import Image from "next/image";
import { useRef } from "react";
import { Logo } from "@/components/ui/logo";
import { art } from "@/data/art";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { FORMS, type Form, GLYPHS } from "./glyphs";
import { AlasStill } from "./still";
import "./alas.css";

type Metrics = Record<Form, { w: number; x: number[] }>;

/** Pin length in viewport heights: the chapter is 1 + PIN_VH screens long. */
const PIN_VH = 0.55;
/** Pin progress where the stage switches to the word, then to the sea. */
const SWITCH = [0.12, 0.58] as const;
const STATES = ["logo", "word", "sea"] as const;
const ARCH_CLOSED = "inset(100% 0% 0% 0% round 999px 999px 0px 0px)";
const ARCH_OPEN = "inset(0% 0% 0% 0% round 999px 999px 0px 0px)";

const stateAt = (p: number) => (p < SWITCH[0] ? 0 : p < SWITCH[1] ? 1 : 2);

export default function AlasSection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const section = root.current;
        const stage = section?.querySelector<HTMLElement>("[data-stage]");
        const word = section?.querySelector<HTMLElement>("[data-word]");
        if (!section || !stage || !word) return;

        const q = gsap.utils.selector(stage);
        const glyph = (id: string) =>
          q(`[data-glyph="${id}"]`)[0] as HTMLElement;
        const byId = new Map(GLYPHS.map((g) => [g.id, g]));

        // Glyph slots come from hidden rows of the real text, so kerning is the
        // font's own. Re-measured after every refresh (resize, late fonts).
        let metrics: Metrics | null = null;
        const measure = (): Metrics => {
          const out = {} as Metrics;
          for (const form of Object.keys(FORMS) as Form[]) {
            const row = q(`[data-row="${form}"]`)[0] as HTMLElement;
            const box = row.getBoundingClientRect();
            out[form] = {
              w: box.width,
              x: [...row.children].map(
                (c) => c.getBoundingClientRect().left - box.left,
              ),
            };
          }
          return out;
        };
        const X = (id: string, form: Form) => {
          metrics ??= measure();
          const i = byId.get(id)?.at[form];
          if (i === undefined) return 0;
          return metrics[form].x[i] - metrics[form].w / 2;
        };

        // Three states on one paused timeline. Scroll only decides which state
        // to show; the timeline glides there in well under a second, so nothing
        // is ever left half-faded where the reader stops.
        const tl = gsap.timeline({
          paused: true,
          defaults: { ease: "power2.out" },
        });
        const later = { immediateRender: false } as const;

        // logo → ἅλας: the lockup dissolves, the Greek resolves where it stood,
        // the breathing mark and accent settle last.
        tl.fromTo(
          q("[data-mark]"),
          { autoAlpha: 1, scale: 1, filter: "blur(0px)" },
          {
            autoAlpha: 0,
            scale: 1.06,
            filter: "blur(10px)",
            duration: 0.45,
            ease: "power2.in",
          },
          0,
        );
        tl.fromTo(
          q('[data-beat="0"]'),
          { autoAlpha: 1, y: 0 },
          { autoAlpha: 0, y: -10, duration: 0.3, ease: "power2.in" },
          0,
        );
        GLYPHS.filter((g) => !g.marks).forEach((g, i) => {
          tl.fromTo(
            glyph(g.id),
            {
              x: () => X(g.id, "hal"),
              autoAlpha: 0,
              scale: 0.94,
              filter: "blur(10px)",
            },
            {
              x: () => X(g.id, "hal"),
              autoAlpha: 1,
              scale: 1,
              filter: "blur(0px)",
              duration: 0.5,
            },
            0.22 + i * 0.05,
          );
        });
        tl.fromTo(
          glyph("m"),
          { x: () => X("m", "hal"), autoAlpha: 0, yPercent: -14 },
          {
            x: () => X("m", "hal"),
            autoAlpha: 1,
            yPercent: 0,
            duration: 0.35,
          },
          0.6,
        );
        tl.fromTo(
          q('[data-beat="1"]'),
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.45 },
          0.45,
        );
        tl.addLabel("word", 0.95);

        // ἅλας → ἅλς: the second alpha dissolves, ς closes the gap and the sea
        // rises in the arch behind the word.
        const W = 0.95;
        tl.fromTo(
          glyph("a2"),
          { autoAlpha: 1, scale: 1, filter: "blur(0px)" },
          {
            autoAlpha: 0,
            scale: 0.85,
            filter: "blur(10px)",
            duration: 0.3,
            ease: "power2.in",
            ...later,
          },
          W,
        );
        for (const id of ["a1", "m", "l", "s"]) {
          tl.fromTo(
            glyph(id),
            { x: () => X(id, "hal") },
            {
              x: () => X(id, "hals"),
              duration: 0.55,
              ease: "power3.inOut",
              ...later,
            },
            W + 0.08,
          );
        }
        tl.fromTo(
          q("[data-arch]"),
          { clipPath: ARCH_CLOSED },
          { clipPath: ARCH_OPEN, duration: 0.7, ease: "power3.inOut" },
          W,
        );
        tl.fromTo(
          q("[data-arch-img]"),
          { scale: 1.16 },
          { scale: 1.02, duration: 0.9 },
          W,
        );
        tl.fromTo(
          q('[data-beat="1"]'),
          { autoAlpha: 1, y: 0 },
          {
            autoAlpha: 0,
            y: -12,
            duration: 0.25,
            ease: "power2.in",
            ...later,
          },
          W,
        );
        tl.fromTo(
          q('[data-beat="2"]'),
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.45 },
          W + 0.3,
        );
        tl.addLabel("sea", W + 0.85);

        let state = 0;
        let glide: gsap.core.Tween | null = null;
        const show = (next: number) => {
          if (next === state) return;
          state = next;
          glide?.kill();
          const target = tl.labels[STATES[next]] ?? 0;
          glide = tl.tweenTo(target, {
            duration: Math.min(Math.abs(target - tl.time()), 0.95),
            ease: "none",
          });
        };
        const settle = () => {
          glide?.kill();
          tl.seek(tl.labels[STATES[state]] ?? 0);
        };

        const pin = ScrollTrigger.create({
          trigger: stage,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * PIN_VH)}`,
          pin: true,
          anticipatePin: 1,
          onUpdate: (self) => show(stateAt(self.progress)),
          onRefresh: (self) => {
            // New sizes: re-measure, rebuild the glyph slots, land on the state.
            metrics = null;
            glide?.kill();
            tl.invalidate().seek(0);
            state = stateAt(self.progress);
            settle();
          },
        });
        state = stateAt(pin.progress);
        settle();

        // Shared exit: the word and its line fade, drift up and settle back
        // to 98 % as they pass through the top of the screen.
        const exit = q("[data-exit]")[0] as HTMLElement | undefined;
        if (exit) {
          ScrollTrigger.create({
            trigger: exit,
            start: "center 15%",
            pinnedContainer: stage,
            onEnter: () =>
              gsap.to(exit, {
                autoAlpha: 0,
                y: -24,
                scale: 0.98,
                duration: 0.5,
                ease: "power2.out",
                overwrite: true,
              }),
            onLeaveBack: () =>
              gsap.to(exit, {
                autoAlpha: 1,
                y: 0,
                scale: 1,
                duration: 0.5,
                ease: "power2.out",
                overwrite: true,
              }),
          });
        }

        // Sunlight on a lime-washed wall follows the pointer; the arch and the
        // letters drift apart a few pixels, so the window reads as depth.
        const sun = q("[data-sun]")[0] as HTMLElement | undefined;
        let onMove: ((e: PointerEvent) => void) | null = null;
        if (sun && window.matchMedia("(pointer: fine)").matches) {
          const to = (el: Element | undefined, prop: "x" | "y", d = 1.4) =>
            el ? gsap.quickTo(el, prop, { duration: d, ease: "power3" }) : null;
          const sunX = to(sun, "x");
          const sunY = to(sun, "y");
          const archX = to(q("[data-arch]")[0], "x", 1.8);
          const archY = to(q("[data-arch]")[0], "y", 1.8);
          const wordX = to(q("[data-rise]")[0], "x", 1.8);
          const wordY = to(q("[data-rise]")[0], "y", 1.8);
          onMove = (e: PointerEvent) => {
            const r = stage.getBoundingClientRect();
            const nx = (e.clientX - r.left) / r.width - 0.5;
            const ny = (e.clientY - r.top) / r.height - 0.5;
            sunX?.(e.clientX - r.left);
            sunY?.(e.clientY - r.top);
            archX?.(nx * 22);
            archY?.(ny * 14);
            wordX?.(nx * -8);
            wordY?.(ny * -5);
          };
          stage.addEventListener("pointermove", onMove);
        }

        return () => {
          glide?.kill();
          if (onMove) stage.removeEventListener("pointermove", onMove);
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="alas"
      data-section="alas"
      aria-labelledby="alas-title"
      className="alas-section"
    >
      <div className="alas-motion">
        <div data-stage className="alas-stage">
          <div data-sun aria-hidden className="alas-sun" />

          <div className="alas-top">
            <div className="container-x">
              <p className="rule-label eyebrow">/ The word</p>
            </div>
          </div>

          <h2 id="alas-title" className="sr-only">
            <span lang="grc">ἅλας</span>. Greek for salt.
          </h2>

          {/* The brand lockup, in the hero's exact box, before it becomes Greek. */}
          <div className="alas-mark-pos">
            <div data-mark className="alas-mark">
              <Logo className="block w-full text-ink" title="" />
            </div>
            <p data-beat="0" className="eyebrow alas-mark-cap">
              / Our name, in Greek
            </p>
          </div>

          <div data-exit className="alas-exit">
            <div data-word aria-hidden className="font-display alas-word">
              <div data-arch className="alas-arch">
                <div data-arch-img className="alas-arch-img">
                  <Image
                    src={art.photo.horizon.src}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 30vw, 52vw"
                    quality={75}
                    className="alas-arch-photo"
                  />
                </div>
              </div>

              <div data-rise className="alas-rise">
                <div className="alas-anchor">
                  <div className="alas-rows">
                    {(Object.keys(FORMS) as Form[]).map((form) => (
                      <div key={form} data-row={form}>
                        {FORMS[form].map((ch, i) => (
                          // biome-ignore lint/suspicious/noArrayIndexKey: fixed glyph rows
                          <span key={i}>{ch}</span>
                        ))}
                      </div>
                    ))}
                  </div>
                  {GLYPHS.map((g) => (
                    <span
                      key={g.id}
                      data-glyph={g.id}
                      className={`alas-glyph ${g.marks ? "alas-marks" : ""}`}
                    >
                      {g.ch}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <ol className="alas-beats">
              <li data-beat="1" className="alas-beat">
                <p className="font-display alas-statement">Greek for salt.</p>
                <p className="eyebrow">/ Say it: AH-las</p>
              </li>
              <li data-beat="2" className="alas-beat">
                <p className="font-display alas-statement">
                  Salt and sea, one word.
                </p>
                <p className="alas-small">
                  In the oldest Greek, <span lang="grc">ἅλς</span> meant both.
                  <br />
                  Sea salt still does.
                </p>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <AlasStill />
    </section>
  );
}
