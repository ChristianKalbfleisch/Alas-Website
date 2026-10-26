"use client";

import Image from "next/image";
import { useRef } from "react";
import { AddButton } from "@/components/cart/controls";
import { flyToCart } from "@/components/cart/fly-to-cart";
import { RevealText } from "@/components/motion/reveal-text";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { getProduct, isPriced } from "@/data/products";
import { formatPrice, useCart } from "@/lib/cart/cart-context";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion/gsap";
import { LABELS, SPORTS_DRINK } from "./copy";
import { exitAtTop, riseIn } from "./motion";

const found = getProduct("sticks-5");
const sticks = found && isPriced(found) ? found : undefined;

const paper =
  "bg-white shadow-[inset_0_0_0_1px_var(--c-line),0_40px_80px_-50px_rgb(18_49_77/0.3)]";
const gloss =
  "pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent_30%,rgb(255_255_255/0.32)_50%,transparent_70%)] opacity-0";

export function Labels() {
  const rootRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const cart = useCart();

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || prefersReducedMotion()) return;
      const q = gsap.utils.selector(root);
      const card = q("[data-card]")[0] as HTMLElement;

      riseIn(q("[data-rise]"), "top 88%", 0.12);
      riseIn(q("[data-line]"), "top 90%", 0.06);
      exitAtTop(q("[data-exit]"));

      // Turn it over like a pack in your hand: lift, tilt, flip, settle.
      const flip = gsap.timeline({ paused: true });
      flip
        .to(card, { rotationY: 180, duration: 1.15, ease: "power3.inOut" }, 0)
        .to(
          card,
          {
            keyframes: [
              { z: 80, rotationX: 7, duration: 0.55, ease: "power2.out" },
              { z: 0, rotationX: 0, duration: 0.6, ease: "power2.inOut" },
            ],
          },
          0,
        )
        .to(
          q("[data-card-shadow]"),
          {
            keyframes: [
              { scaleX: 0.78, opacity: 0.45, duration: 0.55 },
              { scaleX: 1, opacity: 1, duration: 0.6 },
            ],
          },
          0,
        )
        .fromTo(
          q("[data-gloss]"),
          { xPercent: -70, opacity: 0 },
          {
            keyframes: [
              { xPercent: 0, opacity: 1, duration: 0.55, ease: "power1.in" },
              { xPercent: 70, opacity: 0, duration: 0.6, ease: "power1.out" },
            ],
          },
          0,
        );
      gsap.timeline({
        scrollTrigger: {
          trigger: card,
          start: "center 64%",
          onEnter: () => flip.play(),
          onLeaveBack: () => flip.reverse(),
        },
      });
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="container-x pt-10 pb-20 lg:pt-14 lg:pb-28">
      <div data-exit className="text-center">
        <p className="eyebrow">{LABELS.label}</p>
        <RevealText
          as="h3"
          by="words"
          stagger={0.06}
          className="font-display mt-4 text-[length:var(--fs-h2)] text-ink lg:mt-5"
        >
          {LABELS.title}
        </RevealText>
      </div>

      <div className="mx-auto mt-9 grid max-w-[1040px] items-center gap-10 lg:mt-14 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)] lg:gap-16">
        {/* A generic sports drink label: ingredient types, not one brand. */}
        <div data-exit>
          <article data-rise className={`${paper} p-6 sm:p-8`}>
            <div className="flex items-center justify-between gap-4">
              <p className="eyebrow text-ink-3!">{LABELS.drink}</p>
              <p className="eyebrow text-ink-3!">/ Back</p>
            </div>
            <div className="my-4 h-px bg-[var(--c-line)] sm:my-5" />
            <p className="eyebrow text-ink-3!">{LABELS.ingredients}</p>
            <ul className="mt-3 font-mono text-[12px] text-ink-2 uppercase leading-[2] tracking-[0.06em] sm:text-[13px] sm:leading-[2.2]">
              {SPORTS_DRINK.map((item) => (
                <li key={item} data-line>
                  {item}
                </li>
              ))}
            </ul>
          </article>
          <p className="mt-3 font-mono text-[10px] text-ink-3 uppercase tracking-[0.06em]">
            {LABELS.drinkNote}
          </p>
        </div>

        <div className="flex flex-col items-center">
          <div data-exit className="w-full max-w-[min(420px,78vw)]">
            <div data-rise className="relative [perspective:1600px]">
              <div
                data-card
                className="relative aspect-[3/4] w-full [transform-style:preserve-3d] motion-reduce:[transform:rotateY(180deg)]!"
              >
                {/* Front: the pack as you pick it up. */}
                <div className="absolute inset-0 overflow-hidden rounded-[var(--r-md)] bg-[radial-gradient(120%_90%_at_28%_12%,#21496f_0%,#12314d_55%,#0b223a_100%)] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14)] [backface-visibility:hidden]">
                  <div className="absolute inset-x-0 top-[7%] h-px bg-white/12" />
                  <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
                    <Logo
                      className="h-[clamp(4.5rem,3rem+5vw,7.5rem)] text-white"
                      title="ALAS Salt Co."
                    />
                    <div className="h-px w-12 bg-white/30" />
                    <p className="font-mono text-[11px] text-white/80 uppercase tracking-[0.14em]">
                      {LABELS.front}
                    </p>
                  </div>
                  <span data-gloss className={gloss} />
                </div>

                {/* Back: everything that is in it. */}
                <div
                  className={`absolute inset-0 overflow-hidden rounded-[var(--r-md)] ${paper} [backface-visibility:hidden]`}
                  style={{ transform: "rotateY(180deg)" }}
                >
                  <div className="flex h-full flex-col p-6 sm:p-9">
                    <div className="flex items-center justify-between">
                      <Logo className="h-8 text-ink" title="ALAS" />
                      <p className="eyebrow">/ Back</p>
                    </div>
                    <div className="my-5 h-px bg-[var(--c-line)]" />
                    <p className="eyebrow text-ink!">{LABELS.ingredients}</p>
                    <p className="font-display mt-3 text-[clamp(2.2rem,1.5rem+2vw,3.4rem)] text-ink">
                      {LABELS.alas}
                    </p>
                    <p className="mt-auto font-mono text-[10.5px] text-ink-3 uppercase tracking-[0.08em]">
                      {LABELS.alasNote}
                    </p>
                  </div>
                  <span data-gloss className={gloss} />
                </div>
              </div>
              <div
                data-card-shadow
                aria-hidden
                className="-z-10 absolute inset-x-[8%] -bottom-5 h-10 rounded-[50%] bg-[rgb(18_49_77/0.22)] blur-xl"
              />
            </div>
          </div>

          {sticks && (
            <div
              data-exit
              className="mt-10 flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-5"
            >
              <div data-rise className="flex items-center gap-3">
                <div
                  ref={thumbRef}
                  className="relative h-12 w-[60px] shrink-0 mix-blend-multiply"
                >
                  <Image
                    src={sticks.images[0].src}
                    alt=""
                    fill
                    sizes="60px"
                    className="object-contain"
                  />
                </div>
                <AddButton
                  size="md"
                  label={`Try five sticks · ${formatPrice(sticks.price)}`}
                  ariaLabel={`Add ${sticks.name}, ${sticks.subtitle}, to cart, ${formatPrice(sticks.price)}`}
                  className="min-w-[15.5rem]"
                  onAdd={() =>
                    flyToCart(thumbRef.current, () =>
                      cart.add(sticks.handle, { qty: 1 }),
                    )
                  }
                />
              </div>
              <div data-rise>
                <Button href="#quiz" variant="ghost" size="md">
                  {LABELS.quiz}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
