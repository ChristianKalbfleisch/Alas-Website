"use client";

import clsx from "clsx";
import Image from "next/image";
import {
  type CSSProperties,
  forwardRef,
  type PointerEvent,
  useImperativeHandle,
  useRef,
} from "react";
import "@/components/cart/commerce.css";
import { POUCH_CUTOUT } from "@/data/products";
import { EASE, gsap, prefersReducedMotion, useGSAP } from "@/lib/motion/gsap";
import { LeafShadow } from "./leaf-shadow";

type Slot = { x: number; y: number; s: number };

/** Pouch positions in units of one pouch width; y < 0 sits further back. */
const LAYOUTS: Record<number, Slot[]> = {
  1: [{ x: 0, y: 0, s: 1 }],
  2: [
    { x: -0.37, y: 0, s: 0.97 },
    { x: 0.43, y: -0.05, s: 0.86 },
  ],
  4: [
    { x: -0.98, y: 0, s: 0.9 },
    { x: -0.25, y: -0.045, s: 0.82 },
    { x: 0.42, y: -0.085, s: 0.75 },
    { x: 1.03, y: -0.12, s: 0.69 },
  ],
};
const RATIO = POUCH_CUTOUT.height / POUCH_CUTOUT.width;
const MAX = 4;

type Placed = {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  occ: number;
};

function place(count: number, width: number, height: number) {
  const slots = LAYOUTS[count] ?? LAYOUTS[1];
  // Kept modest so the pack reads as a pack, not as a label to study.
  const pw = Math.min((0.47 * height) / RATIO, 0.34 * width);
  const left = Math.min(...slots.map((s) => s.x - s.s / 2));
  const right = Math.max(...slots.map((s) => s.x + s.s / 2));
  const center = (left + right) / 2;
  const fit = Math.min(1, (0.85 * width) / ((right - left) * pw));
  const placed: Placed[] = [];
  for (let i = 0; i < MAX; i++) {
    const slot = slots[Math.min(i, slots.length - 1)];
    const hidden = i >= slots.length;
    placed.push({
      x: (slot.x - center) * pw * fit,
      y: slot.y * pw * fit,
      scale: slot.s * fit * (hidden ? 0.94 : 1),
      opacity: hidden ? 0 : 1,
      occ: 0,
    });
  }
  // Ambient occlusion: how much of each pouch sits behind the one in front.
  for (let i = 1; i < slots.length; i++) {
    const front = placed[i - 1];
    const back = placed[i];
    const frontRight = front.x + (front.scale * pw) / 2;
    const backLeft = back.x - (back.scale * pw) / 2;
    back.occ = Math.max(
      0,
      Math.min(1, (frontRight - backLeft) / (back.scale * pw)),
    );
  }
  return { pw, placed };
}

export type PouchStageHandle = { front: () => HTMLElement | null };

type PouchStageProps = {
  count: number;
  caption: string;
  className?: string;
};

/**
 * A sunlit studio sweep with real cut-out pouches. Pouches slide out from behind
 * each other as the size grows; each has a contact shadow, a soft reflection on
 * the glossy floor and occlusion shading where it sits behind a neighbour.
 */
export const PouchStage = forwardRef<PouchStageHandle, PouchStageProps>(
  function PouchStage({ count, caption, className }, handle) {
    const stage = useRef<HTMLDivElement>(null);
    const group = useRef<HTMLDivElement>(null);
    const outers = useRef<(HTMLDivElement | null)[]>([]);
    const inners = useRef<(HTMLDivElement | null)[]>([]);
    const glow = useRef<HTMLDivElement>(null);
    const leaf = useRef<HTMLDivElement>(null);
    const ready = useRef(false);
    const pointer = useRef<{
      inner: gsap.QuickToFunc[];
      glowX?: gsap.QuickToFunc;
      glowY?: gsap.QuickToFunc;
      leafX?: gsap.QuickToFunc;
    }>({ inner: [] });

    useImperativeHandle(handle, () => ({
      front: () => outers.current[0]?.querySelector("img[data-main]") ?? null,
    }));

    // Layout: initial placement, then animated transitions on size change.
    useGSAP(
      () => {
        const el = stage.current;
        if (!el) return;
        const apply = (animate: boolean) => {
          const { width, height } = el.getBoundingClientRect();
          if (!width) return;
          const { pw, placed } = place(count, width, height);
          el.style.setProperty("--pw", `${pw}px`);
          placed.forEach((p, i) => {
            const node = outers.current[i];
            if (!node) return;
            const vars = {
              x: p.x,
              y: p.y,
              scale: p.scale,
              opacity: p.opacity,
              "--occ": `${(p.occ * 100).toFixed(1)}%`,
            };
            if (!animate || prefersReducedMotion()) {
              gsap.set(node, vars);
              return;
            }
            const entering =
              p.opacity === 1 &&
              Number(gsap.getProperty(node, "opacity")) < 0.5;
            gsap.to(node, {
              ...vars,
              duration: p.opacity === 0 ? 0.55 : 1.05,
              ease: p.opacity === 0 ? "power3.inOut" : EASE.out,
              delay: entering ? 0.04 + i * 0.07 : 0,
              overwrite: "auto",
            });
          });
        };
        apply(ready.current);
        if (!ready.current) {
          ready.current = true;
          group.current?.setAttribute("data-reveal", "done");
        }
        const observer = new ResizeObserver(() => apply(false));
        observer.observe(el);
        return () => observer.disconnect();
      },
      { dependencies: [count], scope: stage },
    );

    // Entrance, then pointer: pouches lean towards the cursor by depth; a warm light follows it.
    useGSAP(
      () => {
        if (prefersReducedMotion()) return;
        const el = stage.current;
        const backdrop = el?.querySelectorAll("[data-backdrop]");
        const pouches = inners.current.filter(Boolean);
        if (el) {
          const tl = gsap.timeline({
            scrollTrigger: { trigger: el, start: "top 82%", once: true },
          });
          tl.fromTo(
            el,
            { clipPath: "inset(18% 0% 0% 0% round 28px)" },
            {
              clipPath: "inset(0% 0% 0% 0% round 28px)",
              duration: 1.5,
              ease: EASE.out,
            },
            0,
          );
          if (backdrop?.length) {
            tl.fromTo(
              backdrop,
              { scale: 1.12 },
              { scale: 1, duration: 1.9, ease: EASE.out },
              0,
            );
          }
          tl.fromTo(
            pouches,
            { y: 90, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.5, ease: EASE.out, stagger: 0.08 },
            0.15,
          );
        }
        pointer.current.inner = inners.current.map((node) =>
          node
            ? gsap.quickTo(node, "x", { duration: 0.9, ease: "power3.out" })
            : () => gsap.timeline(),
        ) as gsap.QuickToFunc[];
        if (glow.current) {
          pointer.current.glowX = gsap.quickTo(glow.current, "x", {
            duration: 1.2,
            ease: "power3.out",
          });
          pointer.current.glowY = gsap.quickTo(glow.current, "y", {
            duration: 1.2,
            ease: "power3.out",
          });
        }
        if (leaf.current) {
          pointer.current.leafX = gsap.quickTo(leaf.current, "x", {
            duration: 1.6,
            ease: "power3.out",
          });
          gsap.fromTo(
            leaf.current,
            { yPercent: -6 },
            {
              yPercent: 6,
              ease: "none",
              scrollTrigger: {
                trigger: stage.current,
                start: "top bottom",
                end: "bottom top",
                scrub: 1,
              },
            },
          );
        }
      },
      { scope: stage },
    );

    const onMove = (event: PointerEvent<HTMLDivElement>) => {
      const el = stage.current;
      if (!el || event.pointerType === "touch") return;
      const rect = el.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      for (const [i, to] of pointer.current.inner.entries())
        to?.(nx * (9 - i * 2));
      pointer.current.glowX?.(event.clientX - rect.left - rect.width * 0.7);
      pointer.current.glowY?.(
        (event.clientY - rect.top - rect.height * 0.25) * 0.6,
      );
      pointer.current.leafX?.(-nx * 8);
    };
    const onLeave = () => {
      for (const to of pointer.current.inner) to?.(0);
      pointer.current.glowX?.(0);
      pointer.current.glowY?.(0);
      pointer.current.leafX?.(0);
    };

    return (
      <div
        ref={stage}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className={clsx(
          "relative isolate overflow-hidden rounded-[var(--r-lg)]",
          className,
        )}
      >
        {/* Studio sweep: lime-washed wall curving into a pale glossy floor. */}
        <div
          aria-hidden
          data-backdrop
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, #f2ede5 0%, #ede6dc 48%, #e6ded2 60%, #efe9e0 71%, #f6f2ec 86%, #f8f5f0 100%)`,
          }}
        />
        {/* Sun from the upper right, falling across wall and floor. */}
        <div
          aria-hidden
          data-backdrop
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 60% at 78% 12%, rgb(255 249 236 / 0.95) 0%, rgb(255 249 236 / 0) 70%), radial-gradient(60% 34% at 55% 86%, rgb(255 255 255 / 0.7) 0%, rgb(255 255 255 / 0) 70%)",
          }}
        />
        <div
          ref={leaf}
          aria-hidden
          className="-left-[6%] -top-[8%] absolute w-[78%] opacity-[0.12] mix-blend-multiply"
        >
          <LeafShadow className="h-auto w-full" />
        </div>
        <div
          ref={glow}
          aria-hidden
          className="absolute top-[-10%] right-[-20%] size-[70%] rounded-full opacity-70 mix-blend-soft-light"
          style={{
            background:
              "radial-gradient(closest-side, rgb(255 244 214 / 0.9), rgb(255 244 214 / 0))",
          }}
        />
        {/* Fine plaster grain so the light has something to fall on. */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07] mix-blend-multiply"
          style={{ backgroundImage: GRAIN, backgroundSize: "180px 180px" }}
        />

        <div ref={group} data-reveal="pending" className="absolute inset-0">
          {Array.from({ length: MAX }, (_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: four fixed pouch slots
              key={i}
              ref={(node) => {
                outers.current[i] = node;
              }}
              className="absolute bottom-[15%] left-1/2 will-change-transform"
              style={
                {
                  width: "var(--pw, 30%)",
                  marginLeft: "calc(var(--pw, 30%) / -2)",
                  zIndex: 10 - i,
                  transformOrigin: "50% 100%",
                  opacity: i === 0 ? 1 : 0,
                } as CSSProperties
              }
            >
              <div
                ref={(node) => {
                  inners.current[i] = node;
                }}
                className="relative"
              >
                {/* Reflection on the glossy floor. */}
                <div
                  aria-hidden
                  className="absolute top-[96.4%] left-0 w-full -scale-y-100 opacity-[0.17]"
                  style={{
                    maskImage:
                      "linear-gradient(to top, #000 0%, rgb(0 0 0 / 0.4) 12%, transparent 30%)",
                    WebkitMaskImage:
                      "linear-gradient(to top, #000 0%, rgb(0 0 0 / 0.4) 12%, transparent 30%)",
                    filter: "blur(1.2px)",
                  }}
                >
                  <Image
                    src={POUCH_CUTOUT.src}
                    width={POUCH_CUTOUT.width}
                    height={POUCH_CUTOUT.height}
                    alt=""
                    sizes="(min-width: 1024px) 300px, 40vw"
                    className={clsx("cm-pouch-clip", "h-auto w-full")}
                  />
                </div>
                {/* Contact shadow, tight and dark, then a wide soft ambient one. */}
                <span
                  aria-hidden
                  className="-translate-y-1/2 absolute top-[97.6%] left-[4%] h-[4.5%] w-[92%] rounded-[50%]"
                  style={{
                    background:
                      "radial-gradient(closest-side, rgb(8 16 28 / 0.62), rgb(8 16 28 / 0))",
                  }}
                />
                <span
                  aria-hidden
                  className="-translate-y-1/2 absolute top-[97%] left-[-14%] h-[16%] w-[128%] rounded-[50%]"
                  style={{
                    background:
                      "radial-gradient(closest-side, rgb(8 16 28 / 0.17), rgb(8 16 28 / 0))",
                  }}
                />
                <Image
                  data-main=""
                  src={POUCH_CUTOUT.src}
                  width={POUCH_CUTOUT.width}
                  height={POUCH_CUTOUT.height}
                  alt={i === 0 ? POUCH_CUTOUT.alt : ""}
                  sizes="(min-width: 1024px) 300px, 40vw"
                  className={clsx("cm-pouch-clip", "relative h-auto w-full")}
                />
                {i > 0 && (
                  // Occlusion: darker where this pouch sits in its neighbour's shade.
                  <Image
                    aria-hidden
                    src={POUCH_CUTOUT.src}
                    width={POUCH_CUTOUT.width}
                    height={POUCH_CUTOUT.height}
                    alt=""
                    sizes="(min-width: 1024px) 300px, 40vw"
                    className={clsx(
                      "cm-pouch-clip",
                      "absolute inset-0 h-auto w-full",
                    )}
                    style={{
                      filter: "brightness(0)",
                      opacity: 0.55,
                      maskImage:
                        "linear-gradient(90deg, #000 0%, #000 var(--occ, 0%), rgb(0 0 0 / 0.16) calc(var(--occ, 0%) + 24%), rgb(0 0 0 / 0.1) 100%)",
                      WebkitMaskImage:
                        "linear-gradient(90deg, #000 0%, #000 var(--occ, 0%), rgb(0 0 0 / 0.16) calc(var(--occ, 0%) + 24%), rgb(0 0 0 / 0.1) 100%)",
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="eyebrow absolute bottom-4 left-5 z-20 text-ink-2! sm:bottom-5 sm:left-6">
          {caption}
        </p>
      </div>
    );
  },
);

const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.1 0 0 0 0 0.2 0 0 0 0 0.3 0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>",
)}")`;
