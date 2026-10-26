"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { type PointerEvent, useRef } from "react";
import "@/components/cart/commerce.css";
import { AddButton } from "@/components/cart/controls";
import { flyToCart } from "@/components/cart/fly-to-cart";
import type { Product } from "@/data/products";
import { useCart } from "@/lib/cart/cart-context";
import { formatPrice } from "@/lib/cart/cart-math";
import { boxRange, PRICE_SOON, REASONS } from "@/lib/cart/catalogue";
import { gsap, prefersReducedMotion } from "@/lib/motion/gsap";
import { Rise } from "./rise";

/** Plain reasons, built only from the catalogue's own words. */
const WHY: Record<string, string> = {
  "welcome-box":
    "Everything to begin in one navy box: salt, sticks, a canister, a bottle and a spoon.",
  "family-box":
    "Three pouches and the full set of tools. One box for the whole house.",
};

/** 03: The boxes. The Welcome Box is the featured plate for first-timers. */
export function BoxPlates() {
  const [welcome, family] = boxRange;
  return (
    <div id="shop-boxes" className="scroll-mt-28">
      <Rise>
        <p className="rule-label eyebrow justify-between">
          <span>/ 03 The boxes</span>
          <span className="text-ink-3">Start here if you are new</span>
        </p>
      </Rise>
      <Rise
        className="mt-10 grid gap-x-[var(--gutter)] gap-y-16 lg:grid-cols-12"
        stagger={0.14}
      >
        <Plate product={welcome} className="lg:col-span-7" featured />
        <Plate product={family} className="lg:col-span-5 lg:pt-[18%]" />
      </Rise>
    </div>
  );
}

function Plate({
  product,
  featured,
  className,
}: {
  product: Product;
  featured?: boolean;
  className?: string;
}) {
  const cart = useCart();
  const frame = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLDivElement>(null);
  const motion = useRef<{
    rx?: gsap.QuickToFunc;
    ry?: gsap.QuickToFunc;
  }>({});
  const image = product.images[0];

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const el = frame.current;
    if (!el || event.pointerType === "touch" || prefersReducedMotion()) return;
    const rect = el.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width;
    const ny = (event.clientY - rect.top) / rect.height;
    el.style.setProperty("--lx", `${nx * 100}%`);
    el.style.setProperty("--ly", `${ny * 100}%`);
    motion.current.rx ??= gsap.quickTo(el, "rotationX", {
      duration: 0.9,
      ease: "power3.out",
    });
    motion.current.ry ??= gsap.quickTo(el, "rotationY", {
      duration: 0.9,
      ease: "power3.out",
    });
    motion.current.rx((0.5 - ny) * 5);
    motion.current.ry((nx - 0.5) * 6);
  };
  const onLeave = () => {
    motion.current.rx?.(0);
    motion.current.ry?.(0);
  };

  return (
    <article className={clsx("group", className)}>
      <div className="[perspective:1400px]">
        <div
          ref={frame}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          className={clsx(
            "relative isolate overflow-hidden rounded-[var(--r-lg)] bg-lime will-change-transform",
            featured
              ? "aspect-[5/4]"
              : "aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]",
          )}
          style={{
            background:
              "radial-gradient(90% 70% at 70% 15%, rgb(255 251 242 / 0.9), rgb(255 251 242 / 0) 70%), linear-gradient(180deg, #f1ece4 0%, #ebe4d9 62%, #f2ede6 100%)",
          }}
        >
          <div
            ref={photo}
            className="cm-multiply absolute inset-[6%] transition-transform duration-[1.4s] ease-[var(--ease-out)] group-hover:scale-[1.035]"
          >
            <Image
              src={image.src}
              width={image.width}
              height={image.height}
              alt={image.alt}
              sizes={
                featured
                  ? "(min-width: 1024px) 56vw, 92vw"
                  : "(min-width: 1024px) 40vw, 92vw"
              }
              className="cm-whiten cm-feather h-full w-full object-contain"
            />
          </div>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-700 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(420px circle at var(--lx, 50%) var(--ly, 30%), rgb(255 255 255 / 0.85), transparent 70%)",
            }}
          />
          {REASONS[product.handle] && (
            <span className="glass absolute top-4 left-4 rounded-full px-3.5 py-2 font-mono text-[10.5px] text-ink uppercase leading-none tracking-[0.08em] sm:top-5 sm:left-5">
              {REASONS[product.handle]}
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h3 className="font-display text-[length:var(--fs-h3)] text-ink leading-[1.05]!">
            <Link
              href={`/products/${product.handle}`}
              className="underline-offset-[6px] decoration-1 hover:underline"
            >
              {product.name}
            </Link>
          </h3>
          <p className="mt-2 max-w-[44ch] text-[15px] text-ink-2 leading-relaxed">
            {WHY[product.handle] ?? product.subtitle}
          </p>
        </div>
        <p className="shrink-0 pt-1 font-mono text-[1.05rem] text-ink">
          {product.price === null ? (
            <span className="text-[0.85rem] text-ink-2">{PRICE_SOON}</span>
          ) : (
            formatPrice(product.price)
          )}
        </p>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <AddButton
          size="md"
          label={product.price === null ? PRICE_SOON : "Add to cart"}
          disabled={product.price === null}
          ariaLabel={
            product.price === null
              ? `${product.name}: new price soon`
              : `Add ${product.name} to cart`
          }
          variant={featured ? "solid" : "ghost"}
          className="min-w-[13rem]"
          onAdd={() =>
            flyToCart(photo.current, () => cart.add(product.handle, { qty: 1 }))
          }
        />
        <Link
          href={`/products/${product.handle}`}
          className="eyebrow text-ink! underline decoration-[var(--c-line-strong)] underline-offset-[6px] transition-colors hover:decoration-ink"
        >
          / What is inside
        </Link>
      </div>
    </article>
  );
}
