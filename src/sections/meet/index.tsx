"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import "@/components/cart/commerce.css";
import { AddButton } from "@/components/cart/controls";
import { flyToCart } from "@/components/cart/fly-to-cart";
import { PouchStack } from "@/components/cart/product-thumb";
import { RitualCta } from "@/components/cart/ritual-cta";
import { RevealText } from "@/components/motion/reveal-text";
import { getProduct, isPriced } from "@/data/products";
import { RITUAL, RITUAL_SAVE_PERCENT } from "@/data/ritual";
import { useCart } from "@/lib/cart/cart-context";
import { formatPrice } from "@/lib/cart/cart-math";
import { AUDIENCES } from "@/lib/cart/catalogue";
import { scrollToTarget } from "@/lib/motion/smooth-scroll";
import { Exit } from "@/sections/shop/exit";
import { Rise } from "@/sections/shop/rise";

type Entry = { handle: string; step: string; title: string; line: string };

/** Three ways in, from the catalogue's own words and real prices: try, start, every month. */
const ENTRIES: Entry[] = [
  {
    handle: "sticks-5",
    step: "Try",
    title: "5 Hydration Sticks",
    line: "Single-serve sticks for the gym bag, the desk and the plane.",
  },
  {
    handle: "mikro",
    step: "Start",
    title: "Mikró",
    line: "One 390 g pouch. A pinch in your water.",
  },
  {
    handle: "ritual",
    step: "Every month",
    title: "The Ritual",
    line: `Two pouches every month, ${formatPrice(RITUAL.price)}. Save ${RITUAL_SAVE_PERCENT}%.`,
  },
];

const targetName = (target: string) =>
  target === "ritual" ? RITUAL.name : getProduct(target)?.name;

const STONE =
  "radial-gradient(90% 70% at 70% 14%, rgb(255 251 242 / 0.95), rgb(255 251 242 / 0) 70%), linear-gradient(180deg, #f1ece4 0%, #ebe4d9 62%, #f3eee7 100%)";

/** Meet the salt: one screen, three one-tap first steps, five ways to find yours. */
export default function MeetSection() {
  const [audience, setAudience] = useState<string | null>(null);
  const picked = AUDIENCES.find((a) => a.key === audience) ?? null;
  const target = picked?.target ?? null;

  return (
    <section
      id="meet"
      data-section="meet"
      className="relative bg-chalk py-[clamp(3.25rem,1.5rem+7vh,8.5rem)] text-ink"
    >
      <div className="container-x">
        <Rise>
          <p className="rule-label eyebrow justify-between">
            <span>/ Meet the salt</span>
            <span className="text-ink-3!">Three ways in</span>
          </p>
        </Rise>

        <div className="mt-7 flex flex-col gap-6 lg:mt-9 lg:flex-row lg:items-end lg:justify-between">
          <Exit>
            <RevealText
              as="h2"
              by="words"
              className="font-display text-[length:var(--fs-h2)]"
            >
              Meet the <em>salt.</em>
            </RevealText>
          </Exit>
          <Rise>
            <p className="eyebrow hidden text-ink-3! sm:block">
              / What brings you here
            </p>
            {/* biome-ignore lint/a11y/useSemanticElements: a row of toggle chips */}
            <div
              role="group"
              aria-label="What brings you here"
              className="-mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] [scrollbar-width:none] sm:mx-0 sm:mt-3 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
            >
              {AUDIENCES.map((a) => {
                const on = a.key === audience;
                return (
                  <button
                    key={a.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setAudience(on ? null : a.key)}
                    className={clsx(
                      "h-10 shrink-0 rounded-full px-4 font-mono text-[11px] uppercase tracking-[0.08em] transition-[background-color,color,box-shadow] duration-500 ease-[var(--ease-out)]",
                      on
                        ? "bg-ink text-white shadow-[0_10px_24px_-10px_rgb(18_49_77_/_0.6)]"
                        : "text-ink-2 shadow-[inset_0_0_0_1px_var(--c-line-strong)] hover:bg-white/70 hover:text-ink",
                    )}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
          </Rise>
        </div>

        <p className="sr-only" aria-live="polite">
          {picked
            ? `${picked.label}: we suggest ${targetName(picked.target)}.`
            : ""}
        </p>

        <Rise
          className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-[clamp(1rem,0.4rem+1.6vw,2.25rem)] lg:mt-10"
          stagger={0.1}
        >
          {ENTRIES.map((entry) => (
            <EntryCard
              key={entry.handle}
              entry={entry}
              state={!target ? "idle" : target === entry.handle ? "on" : "off"}
              note={target === entry.handle ? picked?.label : undefined}
            />
          ))}
        </Rise>
      </div>
    </section>
  );
}

function EntryCard({
  entry,
  state,
  note,
}: {
  entry: Entry;
  state: "idle" | "on" | "off";
  note?: string;
}) {
  const cart = useCart();
  const plate = useRef<HTMLDivElement>(null);
  const ritual = entry.handle === "ritual";
  const found = ritual ? undefined : getProduct(entry.handle);
  const product = found && isPriced(found) ? found : null;
  const href = product ? `/products/${product.handle}` : "#club";

  const image = product?.images[0];
  const plateClass = clsx(
    "relative aspect-square overflow-hidden rounded-[18px] sm:aspect-[16/11] sm:rounded-[var(--r-lg)]",
    state === "on" && "shadow-[inset_0_0_0_1.5px_var(--c-ink)]",
  );
  const plateInner = (
    <>
      {ritual || product?.kind === "salt" ? (
        <PouchStack
          count={ritual ? RITUAL.pouches : 1}
          sizes="(min-width: 640px) 14vw, 30vw"
          className="origin-[50%_88%] scale-[0.64]"
        />
      ) : (
        image && (
          <div className="cm-multiply absolute inset-[8%] transition-transform duration-[1.2s] ease-[var(--ease-out)] group-hover:scale-[1.04]">
            <Image
              src={image.src}
              width={image.width}
              height={image.height}
              alt=""
              sizes="(min-width: 640px) 30vw, 36vw"
              className="cm-whiten cm-feather h-full w-full object-contain"
            />
          </div>
        )
      )}
      {ritual && (
        <span className="absolute top-3 right-3 rounded-full bg-ink px-2.5 py-1.5 font-mono text-[9.5px] text-white uppercase leading-none tracking-[0.08em] max-sm:hidden sm:top-4 sm:right-4">
          Save {RITUAL_SAVE_PERCENT}%
        </span>
      )}
      <span
        className={clsx(
          "glass absolute top-3 left-3 rounded-full max-sm:hidden px-2.5 py-1.5 font-mono text-[9.5px] text-ink uppercase leading-none tracking-[0.08em] transition-[opacity,transform] duration-500 ease-[var(--ease-out)] sm:top-4 sm:left-4",
          note ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
        )}
        aria-hidden={!note}
      >
        For {note?.toLowerCase() ?? "you"}
      </span>
    </>
  );

  return (
    <article
      className={clsx(
        "group relative flex gap-4 rounded-[var(--r-lg)] p-3 transition-[opacity,transform,box-shadow,background-color] duration-500 ease-[var(--ease-out)] sm:flex-col sm:gap-0 sm:p-0",
        state === "on" &&
          "-translate-y-1.5 bg-white/70 shadow-[0_24px_60px_-28px_rgb(18_49_77_/_0.45),inset_0_0_0_1.5px_var(--c-ink)] sm:bg-transparent sm:shadow-none",
        state === "off" && "opacity-55",
        state === "idle" &&
          "shadow-[inset_0_0_0_1px_var(--c-line)] sm:shadow-none",
      )}
    >
      {product ? (
        <Link
          href={href}
          aria-label={`${entry.title}, details`}
          className="block w-[30%] shrink-0 sm:w-full"
        >
          <div ref={plate} className={plateClass} style={{ background: STONE }}>
            {plateInner}
          </div>
        </Link>
      ) : (
        <div className="block w-[30%] shrink-0 sm:w-full">
          <div ref={plate} className={plateClass} style={{ background: STONE }}>
            {plateInner}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col justify-center sm:mt-5 sm:justify-start sm:px-1">
        <p className="eyebrow text-ink-3!">/ {entry.step}</p>
        <h3 className="font-display mt-1.5 text-[1.55rem] leading-[1.05]! sm:text-[1.8rem]">
          {entry.title}
        </h3>
        <p className="mt-1.5 hidden text-[14px] text-ink-2 leading-snug sm:block">
          {entry.line}
        </p>
        {ritual ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 sm:mt-4">
            <RitualCta
              source="ritual-meet"
              size="md"
              className="sm:min-w-[15rem]"
            />
            <button
              type="button"
              onClick={() => scrollToTarget("#club")}
              className="eyebrow hidden text-ink! underline decoration-[var(--c-line-strong)] underline-offset-[6px] hover:decoration-ink sm:inline"
            >
              What is in it
            </button>
          </div>
        ) : (
          product && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 sm:mt-4">
              <AddButton
                size="md"
                label="Add"
                price={product.price}
                ariaLabel={`Add ${entry.title} to cart, ${formatPrice(product.price)}`}
                variant={state === "on" ? "solid" : "ghost"}
                className="sm:min-w-[9.5rem]"
                onAdd={() =>
                  flyToCart(plate.current, () =>
                    cart.add(product.handle, { qty: 1 }),
                  )
                }
              />
              <Link
                href={href}
                className="eyebrow hidden text-ink! underline decoration-[var(--c-line-strong)] underline-offset-[6px] hover:decoration-ink sm:inline"
              >
                Details
              </Link>
            </div>
          )
        )}
      </div>
    </article>
  );
}
