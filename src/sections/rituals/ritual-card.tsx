"use client";

import Image from "next/image";
import { useRef } from "react";
import { Parallax } from "@/components/motion/parallax";
import { RevealMedia } from "@/components/motion/reveal-media";
import { RevealText } from "@/components/motion/reveal-text";
import { Button } from "@/components/ui/button";
import { getProduct, isPriced } from "@/data/products";
import { formatPrice, useCart } from "@/lib/cart/cart-context";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion/gsap";
import type { Ritual } from "./rituals";

/** One ritual: photograph, mono label, serif name, plain line, when, and the product that fits. */
export function RitualCard({ ritual }: { ritual: Ritual }) {
  const ref = useRef<HTMLElement>(null);
  const { add, open } = useCart();
  const found = ritual.product ? getProduct(ritual.product) : undefined;
  const product = found && isPriced(found) ? found : undefined;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      // Images may scrub: the photo drifts inside its frame.
      gsap.fromTo(
        el.querySelector("[data-drift]"),
        { yPercent: -4 },
        {
          yPercent: 4,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    },
    { scope: ref },
  );

  return (
    <li className={ritual.place}>
      <article ref={ref} className="group">
        <div data-exit>
          <Parallax amount={ritual.drift}>
            {/* clip-path, not overflow, so the drifting photo never leaks a seam. */}
            <div className="[clip-path:inset(0_round_var(--r-sm))]">
              <RevealMedia className={`relative ${ritual.frame} bg-stone`}>
                <div
                  data-drift
                  className="absolute inset-x-0 -top-[6%] -bottom-[6%]"
                >
                  <div className="absolute inset-0 transition-transform duration-[1600ms] ease-[var(--ease-out)] group-hover:scale-[1.035]">
                    <Image
                      src={ritual.photo.src}
                      alt={ritual.photo.alt}
                      fill
                      quality={85}
                      sizes={ritual.sizes}
                      className="object-cover"
                      style={{ objectPosition: ritual.focus }}
                    />
                  </div>
                </div>
              </RevealMedia>
            </div>
          </Parallax>
        </div>

        <div data-exit className="mt-8 max-w-[30rem]">
          <p className="eyebrow">
            {ritual.n} / {ritual.label}
          </p>
          <RevealText
            as="h3"
            by="words"
            stagger={0.05}
            className="font-display mt-3 text-ink [font-size:var(--fs-h3)]"
          >
            {ritual.name}
          </RevealText>
          <p className="mt-3 text-[15px] text-ink-2 leading-relaxed">
            {ritual.line}
          </p>
          <dl className="mt-5 grid grid-cols-[4rem_1fr] gap-x-3 border-[var(--c-line)] border-t pt-4">
            <dt className="eyebrow pt-[3px]">When</dt>
            <dd className="text-[14px] text-ink-2 leading-relaxed">
              {ritual.when}
            </dd>
          </dl>
          {product && (
            <div className="mt-4 flex items-center gap-3 border-[var(--c-line)] border-t pt-4">
              <div className="size-14 shrink-0 bg-chalk">
                <Image
                  src={product.images[0].src}
                  alt=""
                  width={product.images[0].width}
                  height={product.images[0].height}
                  sizes="56px"
                  className="size-full object-contain mix-blend-multiply [filter:brightness(1.025)]"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[14px] text-ink">
                  {product.name}
                </p>
                <p className="eyebrow mt-0.5 text-ink-3">
                  {product.sticks
                    ? `${product.sticks} sticks`
                    : `${product.pouches} ${product.pouches === 1 ? "pouch" : "pouches"}`}{" "}
                  · {formatPrice(product.price)}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  add(product.handle);
                  open();
                }}
                aria-label={`Add ${product.name}, ${formatPrice(product.price)}, to cart`}
              >
                Add
              </Button>
            </div>
          )}
        </div>
      </article>
    </li>
  );
}
