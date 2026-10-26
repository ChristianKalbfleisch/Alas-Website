"use client";

import clsx from "clsx";
import Image from "next/image";
import { type CSSProperties, useRef } from "react";
import { RevealMedia } from "@/components/motion/reveal-media";
import { RevealText } from "@/components/motion/reveal-text";
import { art } from "@/data/art";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion/gsap";
import { FACTS, OPENER, PHOTO_LABELS } from "./copy";
import { riseIn } from "./motion";

type Pt = { x: number; y: number };

/* Points in the glass photograph (4:5), in % of its width and height. */
const FOCUS: Pt = { x: 40, y: 64 }; // where the camera leans in
const WATER: Pt = { x: 36, y: 63 };
const WATER_CHIP: Pt = { x: 36, y: 41 };
const SALT: Pt = { x: 68, y: 78.2 };
const SALT_CHIP: Pt = { x: 68, y: 89 };
const SURFACE_Y = 53.4; // the waterline inside the glass
const CROP_TOP = 0.17; // the square frame trims this much sky off the 4:5 photo
const PUSH = 0.08; // how far the camera leans in as the scene passes
const CHIP_GAP = 15; // px between a chip's centre and its leader
const ASPECT = 1.25; // photo height / width

/* A pinch of the real crystal sprites. x and size in % of photo width, d in s. */
const PINCH = [
  { x: 34.5, size: 5.2, d: 0, sink: 64, rot: 24, art: 0 },
  { x: 38.2, size: 4, d: 0.07, sink: 67, rot: -40, art: 1 },
  { x: 36, size: 4.6, d: 0.13, sink: 62, rot: 70, art: 2 },
  { x: 40.4, size: 3.6, d: 0.2, sink: 65.5, rot: -15, art: 3 },
  { x: 31.8, size: 3.9, d: 0.26, sink: 68, rot: 45, art: 4 },
  { x: 42, size: 4.3, d: 0.33, sink: 63, rot: -60, art: 5 },
  { x: 37, size: 3.3, d: 0.4, sink: 66.5, rot: 10, art: 1 },
  { x: 33, size: 3, d: 0.48, sink: 65, rot: -25, art: 3 },
  { x: 39.2, size: 2.8, d: 0.55, sink: 69, rot: 35, art: 0 },
] as const;

/** Position that rides the camera push (CSS var --s) without scaling its content. */
function at(p: Pt, dy = 0): CSSProperties {
  const extra = dy ? ` + ${dy}px` : "";
  return {
    left: `calc(${FOCUS.x}% + ${(p.x - FOCUS.x).toFixed(2)}% * var(--s))`,
    top: `calc(${FOCUS.y}% + ${(p.y - FOCUS.y).toFixed(2)}% * var(--s)${extra})`,
  };
}

/** Vertical hairline between two points that share x, trimmed clear of the chip. */
function lead(top: Pt, bottom: Pt, trimTop: number, trimBottom: number) {
  return {
    ...at(top, trimTop),
    height: `calc(${(bottom.y - top.y).toFixed(2)}% * var(--s) - ${trimTop + trimBottom}px)`,
  } satisfies CSSProperties;
}

function Chip({
  text,
  name,
  className,
  style,
}: {
  text: string;
  name: string;
  className?: string;
  style: CSSProperties;
}) {
  return (
    <div
      className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute whitespace-nowrap"
      style={style}
    >
      <span
        data-chip={name}
        className={clsx(
          "glass eyebrow block rounded-full px-3 py-[0.45rem] text-ink! leading-none",
          className,
        )}
      >
        {text}
      </span>
    </div>
  );
}

function Dot({ name, style }: { name: string; style: CSSProperties }) {
  return (
    <div
      className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute"
      style={style}
    >
      <span
        data-dot={name}
        className="block size-[9px] rounded-full bg-white opacity-0 shadow-[0_0_0_1px_rgb(18_49_77/0.28),0_0_14px_rgb(255_255_255/0.9)] motion-reduce:opacity-100"
      />
    </div>
  );
}

export function GlassScene() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || prefersReducedMotion()) return;
      const q = gsap.utils.selector(root);
      const one = (sel: string) => q(sel)[0] as HTMLElement;
      const frame = one("[data-frame]");
      const grains = q("[data-grain]");
      const ripples = q("[data-ripple]");

      riseIn(q("[data-fact]"), "top 92%", 0.09);

      // Shared exit once the stage unpins: each block fades, drifts up 24 px and
      // settles to 0.98 as its centre passes the top 15% (toggled, not scrubbed).
      const sticky = one("[data-sticky]");
      const topIn = (el: HTMLElement) => {
        let y = 0;
        let node: HTMLElement | null = el;
        while (node && node !== sticky) {
          y += node.offsetTop;
          node = node.offsetParent as HTMLElement | null;
        }
        return y;
      };
      for (const block of q("[data-block]") as HTMLElement[]) {
        gsap.to(block, {
          opacity: 0,
          y: -24,
          scale: 0.98,
          duration: 0.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: root,
            start: () => {
              const vh = window.innerHeight;
              const d = topIn(block) + block.offsetHeight / 2 - 0.15 * vh;
              return `bottom ${(((vh - Math.max(0, d)) / vh) * 100).toFixed(2)}%`;
            },
            toggleActions: "play none none reverse",
          },
        });
      }

      // Image only: the camera leans in as the scene passes (scrub ≤ 0.3).
      gsap.fromTo(
        frame,
        { "--s": 1 },
        {
          "--s": 1 + PUSH,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.3,
          },
        },
      );

      // Labels draw on once the photo is in view.
      const labelsIn = gsap.timeline({
        paused: true,
        defaults: { ease: "power2.out" },
      });
      labelsIn
        .fromTo(
          q("[data-dot]"),
          { opacity: 0, scale: 0 },
          { opacity: 1, scale: 1, duration: 0.3, stagger: 0.08 },
          0,
        )
        .fromTo(
          q("[data-lead]"),
          { scaleY: 0 },
          { scaleY: 1, duration: 0.5, stagger: 0.08 },
          0.1,
        )
        .fromTo(
          q("[data-chip='before'], [data-chip='salt']"),
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 },
          0.3,
        );
      gsap.timeline({
        scrollTrigger: {
          trigger: frame,
          start: "top 72%",
          onEnter: () => labelsIn.play(),
          onLeaveBack: () => labelsIn.reverse(),
        },
      });

      // The pinch: real crystals fall in, break the surface and dissolve.
      const pinch = gsap.timeline({ paused: true });
      grains.forEach((grain, i) => {
        const c = PINCH[i];
        const toSurface = (-(SURFACE_Y + 9) * ASPECT * 100) / c.size;
        const toSink = ((c.sink - SURFACE_Y) * ASPECT * 100) / c.size;
        pinch.fromTo(
          grain,
          {
            yPercent: toSurface,
            rotation: c.rot,
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
          },
          {
            yPercent: 0,
            rotation: c.rot + 70,
            duration: 0.85,
            ease: "power2.in",
          },
          c.d,
        );
        // Through the water: slower, turning, shrinking as it dissolves.
        pinch.to(
          grain,
          {
            yPercent: toSink,
            rotation: c.rot + 170,
            scale: 0.4,
            duration: 2.4,
            ease: "power1.out",
          },
          c.d + 0.85,
        );
        pinch.to(
          grain,
          {
            opacity: 0,
            filter: "blur(1.4px)",
            duration: 1.5,
            ease: "power1.in",
          },
          c.d + 1.75,
        );
        pinch.fromTo(
          ripples[i],
          { scale: 0.15, opacity: 0 },
          { scale: 0.5, opacity: 1, duration: 0.14, ease: "power1.out" },
          c.d + 0.82,
        );
        pinch.to(
          ripples[i],
          { scale: 1, opacity: 0, duration: 1.1, ease: "power2.out" },
          c.d + 0.96,
        );
      });

      // Label switch at a set point: plain water becomes water with salt.
      const after = gsap.timeline({ paused: true });
      after
        .to(
          q("[data-chip='salt'], [data-dot='salt']"),
          { opacity: 0, duration: 0.4, ease: "power2.out" },
          0,
        )
        .to(
          "[data-lead='salt']",
          { scaleY: 0, duration: 0.4, ease: "power2.in" },
          0,
        )
        .to(
          "[data-chip='before']",
          { opacity: 0, y: -10, duration: 0.3, ease: "power2.in" },
          1.25,
        )
        .fromTo(
          "[data-chip='after']",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
          1.5,
        );

      gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top 8%",
          onEnter: () => {
            labelsIn.progress(1);
            pinch.restart();
            after.play();
          },
          onLeaveBack: () => {
            pinch.pause(0);
            after.reverse();
          },
        },
      });

      // A light, magnetic tilt toward the cursor on fine pointers.
      const tilt = one("[data-tilt]");
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        return;
      }
      gsap.set(tilt, { transformPerspective: 1400 });
      const rx = gsap.quickTo(tilt, "rotationX", {
        duration: 0.9,
        ease: "power3.out",
      });
      const ry = gsap.quickTo(tilt, "rotationY", {
        duration: 0.9,
        ease: "power3.out",
      });
      const onMove = (event: PointerEvent) => {
        const r = tilt.getBoundingClientRect();
        const px = (event.clientX - r.left) / r.width - 0.5;
        const py = (event.clientY - r.top) / r.height - 0.5;
        ry(gsap.utils.clamp(-0.6, 0.6, px) * 5);
        rx(gsap.utils.clamp(-0.6, 0.6, py) * -4);
      };
      const onLeave = () => {
        rx(0);
        ry(0);
      };
      tilt.addEventListener("pointermove", onMove);
      tilt.addEventListener("pointerleave", onLeave);
      return () => {
        tilt.removeEventListener("pointermove", onMove);
        tilt.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      className="relative h-[125svh] motion-reduce:h-auto"
      data-why-glass
    >
      <div
        data-sticky
        className="sticky top-0 flex h-[100svh] flex-col justify-start overflow-hidden pt-[76px] pb-4 motion-reduce:static motion-reduce:h-auto motion-reduce:py-16 lg:justify-center lg:pt-8 lg:pb-0"
      >
        <div
          data-stage
          className="container-x grid w-full items-center gap-x-12 gap-y-5 lg:grid-cols-12 lg:grid-rows-[auto_auto] lg:gap-y-10"
        >
          <div data-block className="lg:col-span-5 lg:self-end">
            <p className="rule-label eyebrow">{OPENER.label}</p>
            <RevealText
              as="h2"
              by="words"
              stagger={0.06}
              className="font-display mt-5 text-[clamp(2.5rem,1.3rem+3.7vw,5.4rem)] text-ink lg:mt-9"
            >
              {OPENER.statement[0]} <em>{OPENER.statement[1]}</em>{" "}
              {OPENER.statement[2]}
            </RevealText>
          </div>

          <ol
            data-block
            className="order-3 grid gap-3 lg:order-none lg:col-span-5 lg:col-start-1 lg:row-start-2 lg:gap-4 lg:self-start"
          >
            {FACTS.map((fact) => (
              <li
                key={fact.n}
                data-fact
                className="grid grid-cols-[2.6rem_1fr] border-[var(--c-line)] border-t pt-3 lg:grid-cols-[3rem_1fr] lg:pt-4"
              >
                <span className="eyebrow pt-[0.2rem]">{fact.n}</span>
                <span className="text-[14.5px] text-ink-2 leading-snug lg:text-[16.5px] lg:leading-relaxed">
                  {fact.text}
                </span>
              </li>
            ))}
          </ol>

          <div
            data-block
            className="flex justify-center lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:justify-end"
          >
            <div data-tilt className="w-full will-change-transform lg:w-auto">
              <div
                data-frame
                className="relative mx-auto aspect-square w-[min(100%,calc(100svh-470px))] overflow-hidden bg-stone lg:h-[min(76svh,740px)] lg:w-auto"
                style={{ "--s": 1 } as CSSProperties}
              >
                {/* The full 4:5 photograph; the frame shows a square of it. */}
                <div
                  className="absolute inset-x-0 aspect-[4/5]"
                  style={{ top: `-${(CROP_TOP * 125).toFixed(2)}%` }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      transform: "scale(var(--s))",
                      transformOrigin: `${FOCUS.x}% ${FOCUS.y}%`,
                    }}
                  >
                    <RevealMedia className="absolute inset-0" from="bottom">
                      <div className="absolute inset-0">
                        <Image
                          src={art.photo.glass.src}
                          alt={art.photo.glass.alt}
                          fill
                          sizes="(min-width: 1024px) 52vw, 92vw"
                          quality={85}
                          className="object-cover"
                        />
                      </div>
                    </RevealMedia>

                    {PINCH.map((c, i) => (
                      <div
                        key={`ripple-${c.x}`}
                        className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute aspect-[7/1] w-[13%]"
                        style={{ left: `${c.x}%`, top: `${SURFACE_Y}%` }}
                      >
                        <span
                          data-ripple={i}
                          className="block size-full rounded-[50%] opacity-0 shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.95),0_0_10px_rgb(255_255_255/0.6)]"
                        />
                      </div>
                    ))}
                    {PINCH.map((c, i) => (
                      <div
                        key={`grain-${c.x}`}
                        className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute aspect-square motion-reduce:hidden"
                        style={{
                          left: `${c.x}%`,
                          top: `${SURFACE_Y}%`,
                          width: `${c.size}%`,
                        }}
                      >
                        <div
                          data-grain={i}
                          className="size-full opacity-0 drop-shadow-[0_1px_1.5px_rgb(18_49_77/0.35)]"
                        >
                          <Image
                            src={art.three.crystals[c.art].src}
                            alt=""
                            width={art.three.crystals[c.art].width}
                            height={art.three.crystals[c.art].height}
                            sizes="40px"
                            className="size-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Labels ride the camera but never scale. */}
                  <div
                    className="-translate-x-1/2 pointer-events-none absolute w-px"
                    style={lead(WATER_CHIP, WATER, CHIP_GAP, 7)}
                  >
                    <span
                      data-lead="water"
                      className="block size-full origin-bottom bg-white/90 shadow-[0_0_0_0.5px_rgb(18_49_77/0.18)] motion-reduce:[transform:none]!"
                      style={{ transform: "scaleY(0)" }}
                    />
                  </div>
                  <div
                    className="-translate-x-1/2 pointer-events-none absolute w-px"
                    style={lead(SALT, SALT_CHIP, 7, CHIP_GAP)}
                  >
                    <span
                      data-lead="salt"
                      className="block size-full origin-top bg-white/90 shadow-[0_0_0_0.5px_rgb(18_49_77/0.22)] motion-reduce:[transform:none]!"
                      style={{ transform: "scaleY(0)" }}
                    />
                  </div>
                  <Dot name="water" style={at(WATER)} />
                  <Dot name="salt" style={at(SALT)} />
                  <Chip
                    name="before"
                    text={PHOTO_LABELS.before}
                    style={at(WATER_CHIP)}
                    className="opacity-0 motion-reduce:opacity-100"
                  />
                  <Chip
                    name="after"
                    text={PHOTO_LABELS.after}
                    style={at(WATER_CHIP)}
                    className="opacity-0 motion-reduce:hidden"
                  />
                  <Chip
                    name="salt"
                    text={PHOTO_LABELS.salt}
                    style={at(SALT_CHIP)}
                    className="opacity-0 motion-reduce:opacity-100"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
