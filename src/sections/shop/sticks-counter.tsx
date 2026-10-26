"use client";

import Image from "next/image";
import { type PointerEvent, useRef, useState } from "react";
import { BuyRow } from "@/components/cart/buy-row";
import "@/components/cart/commerce.css";
import { TweenPrice } from "@/components/cart/controls";
import { RollingWord } from "@/components/cart/rolling-word";
import { SizeSwitch } from "@/components/cart/size-switch";
import type { Product } from "@/data/products";
import {
  FLAVOUR_NOTE,
  REASONS,
  sizeLabel,
  stickRange,
} from "@/lib/cart/catalogue";
import { EASE, gsap, prefersReducedMotion, useGSAP } from "@/lib/motion/gsap";
import { Rise } from "./rise";

/** The flat-lay photo of each pack, shot on white (drops out on the stone). */
const flatLay = (p: Product) =>
  p.images.find((img) => !img.src.endsWith("sticks-30.png")) ?? p.images[0];

/** One line per size, taken from the catalogue descriptions. */
const LINES: Record<string, string> = {
  "sticks-5": "For the gym bag, the desk and the plane.",
  "sticks-15": "Two weeks of training days.",
  "sticks-30": "A month of sticks.",
};

/** 02: Hydration Sticks. Same switch; the pack changes on a pale water-blue plate. */
export function SticksCounter() {
  const [index, setIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const stage = useRef<HTMLDivElement>(null);
  const plate = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const product = stickRange[index];

  useGSAP(
    () => {
      const el = stage.current;
      if (!el) return;
      const shots = el.querySelectorAll<HTMLElement>("[data-shot]");
      const instant = first.current || prefersReducedMotion();
      first.current = false;
      shots.forEach((shot, i) => {
        const on = i === index;
        const vars = {
          opacity: on ? 1 : 0,
          scale: on ? 1 : i < index ? 0.94 : 1.06,
          rotation: on ? 0 : i < index ? -3 : 3,
        };
        if (instant) gsap.set(shot, vars);
        else
          gsap.to(shot, {
            ...vars,
            duration: on ? 1.1 : 0.6,
            ease: on ? EASE.out : "power2.inOut",
            overwrite: "auto",
          });
      });
    },
    { dependencies: [index], scope: stage },
  );

  useGSAP(
    () => {
      const el = stage.current;
      if (!el || prefersReducedMotion()) return;
      gsap.fromTo(
        el,
        { clipPath: "inset(18% 0% 0% 0% round 28px)" },
        {
          clipPath: "inset(0% 0% 0% 0% round 28px)",
          duration: 1.5,
          ease: EASE.out,
          scrollTrigger: { trigger: el, start: "top 82%", once: true },
        },
      );
      gsap.fromTo(
        plate.current,
        { scale: 1.1, y: 30 },
        {
          scale: 1,
          y: 0,
          duration: 1.8,
          ease: EASE.out,
          scrollTrigger: { trigger: el, start: "top 82%", once: true },
        },
      );
    },
    { scope: stage },
  );

  const tilt = useRef<{ x?: gsap.QuickToFunc; y?: gsap.QuickToFunc }>({});
  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const el = plate.current;
    if (!el || event.pointerType === "touch" || prefersReducedMotion()) return;
    tilt.current.x ??= gsap.quickTo(el, "x", {
      duration: 1,
      ease: "power3.out",
    });
    tilt.current.y ??= gsap.quickTo(el, "y", {
      duration: 1,
      ease: "power3.out",
    });
    const rect = el.getBoundingClientRect();
    tilt.current.x((event.clientX - rect.left - rect.width / 2) * 0.025);
    tilt.current.y((event.clientY - rect.top - rect.height / 2) * 0.025);
  };
  const onLeave = () => {
    tilt.current.x?.(0);
    tilt.current.y?.(0);
  };

  return (
    <div
      id="shop-sticks"
      className="grid scroll-mt-28 gap-y-10 lg:grid-cols-12 lg:gap-x-[var(--gutter)]"
    >
      <div
        ref={stage}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="relative isolate aspect-[4/5] overflow-hidden rounded-[var(--r-lg)] sm:aspect-[5/4] lg:order-2 lg:col-span-7 lg:aspect-auto lg:min-h-[min(40rem,74vh)]"
        style={{
          background:
            "radial-gradient(80% 70% at 30% 20%, rgb(255 255 255 / 0.85) 0%, rgb(255 255 255 / 0) 70%), linear-gradient(170deg, #eef6f6 0%, #e3f0f2 55%, #dcecef 100%)",
        }}
      >
        <RollingWord
          words={stickRange.map((p) => String(p.sticks))}
          index={index}
          className="absolute right-[4%] bottom-[-7%] font-display text-[clamp(11rem,7rem+15vw,22rem)] text-[rgb(18_49_77_/_0.075)] leading-[0.8]!"
        />
        <div
          ref={plate}
          className="cm-multiply absolute inset-[7%] sm:inset-[9%]"
        >
          {stickRange.map((p, i) => {
            const img = flatLay(p);
            return (
              <div
                key={p.handle}
                data-shot
                className="absolute inset-0"
                style={{ opacity: i === 0 ? 1 : 0 }}
              >
                <Image
                  src={img.src}
                  width={img.width}
                  height={img.height}
                  alt={i === index ? img.alt : ""}
                  aria-hidden={i !== index}
                  data-active={i === index ? "" : undefined}
                  sizes="(min-width: 1024px) 50vw, 90vw"
                  className="cm-whiten cm-feather h-full w-full object-contain"
                />
              </div>
            );
          })}
        </div>
        <p className="eyebrow absolute bottom-4 left-5 z-20 text-ink-2! sm:bottom-5 sm:left-6">
          / {sizeLabel(product)}
        </p>
      </div>

      <Rise className="flex flex-col lg:order-1 lg:col-span-5 lg:pt-1">
        <p className="rule-label eyebrow justify-between" data-rise>
          <span>/ 02 Hydration Sticks</span>
          <span className="text-ink-3">Best for the gym bag</span>
        </p>
        <div className="mt-8" data-rise>
          <div className="flex items-end justify-between gap-6">
            <h3 className="font-display text-[clamp(2.6rem,1.9rem+2.6vw,4.4rem)] text-ink leading-[1]!">
              One stick.
              <br />
              One bottle.
            </h3>
            <TweenPrice
              value={product.price}
              className="shrink-0 pb-2 font-mono text-[1.35rem] text-ink"
            />
          </div>
          <RollingWord
            as="p"
            words={stickRange.map((p) => LINES[p.handle] ?? p.description)}
            index={index}
            className="mt-4 text-[15px] text-ink-2"
          />
        </div>

        <div className="mt-9" data-rise>
          <p className="rule-label eyebrow justify-between">
            <span>/ Size</span>
            <span className="text-ink-3">{sizeLabel(product)}</span>
          </p>
          <SizeSwitch
            label="Pack size"
            className="mt-5"
            value={product.handle}
            onChange={(handle) =>
              setIndex(stickRange.findIndex((p) => p.handle === handle))
            }
            options={stickRange.map((p) => ({
              value: p.handle,
              label: String(p.sticks),
              sublabel: "sticks",
              tag: REASONS[p.handle],
            }))}
          />
          <p className="mt-5 text-[13px] text-ink-3">{FLAVOUR_NOTE}.</p>
        </div>

        <div data-rise>
          <BuyRow
            className="mt-9 border-[var(--c-line)] border-t pt-6"
            product={product}
            qty={qty}
            onQty={setQty}
            source={() =>
              stage.current?.querySelector<HTMLElement>("img[data-active]") ??
              null
            }
          />
        </div>
      </Rise>
    </div>
  );
}
