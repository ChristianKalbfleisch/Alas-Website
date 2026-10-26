"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { BuyRow } from "@/components/cart/buy-row";
import "@/components/cart/commerce.css";
import { AddButton, TweenPrice } from "@/components/cart/controls";
import { flyToCart } from "@/components/cart/fly-to-cart";
import { type Plan, PlanPicker } from "@/components/cart/plan-picker";
import { ProductThumb } from "@/components/cart/product-thumb";
import { RitualCta } from "@/components/cart/ritual-cta";
import { SizeSwitch } from "@/components/cart/size-switch";
import { type ArtImage, art } from "@/data/art";
import { grainsFor, grainsLabel, POINTS } from "@/data/points";
import { getProduct, type Product } from "@/data/products";
import { RITUAL } from "@/data/ritual";
import { useCart } from "@/lib/cart/cart-context";
import { formatPrice } from "@/lib/cart/cart-math";
import {
  complementsOf,
  FLAVOUR_NOTE,
  GREEK_MEANING,
  kindLabel,
  PRICE_SOON,
  REASONS,
  siblingsOf,
  sizeLabel,
  TERMS_LINE,
  upgradeFor,
} from "@/lib/cart/catalogue";
import { EASE, gsap, prefersReducedMotion, useGSAP } from "@/lib/motion/gsap";
import { scrollToTarget } from "@/lib/motion/smooth-scroll";
import { Gallery, type GalleryHandle, type GalleryImage } from "./gallery";
import { HowToStrip, MiniLabel, ProductFaq } from "./landing";

const onWhite = (src: string) =>
  !/sticks-30\.png|sticks-hand|\/art\//.test(src);

/** Product photos first, then one true-to-life scene. */
function galleryFor(product: Product): GalleryImage[] {
  const own = product.images.map((img) => ({
    ...img,
    onWhite: onWhite(img.src),
    noZoom: product.kind === "salt",
  }));
  const extra: Omit<GalleryImage, "onWhite">[] = [];
  if (product.kind === "salt") extra.push(art.photo.fleurMacro);
  if (product.kind === "sticks") {
    extra.push({
      src: "/products/sticks-hand.png",
      width: 1122,
      height: 1402,
      alt: "An ALAS Hydration Stick poured into a glass of water",
    });
  }
  if (product.handle === "welcome-box") {
    extra.push(
      {
        src: "/products/welcome-c.png",
        width: 1536,
        height: 1024,
        alt: "The navy ALAS Welcome Box, open",
      },
      {
        src: "/products/welcome-d.png",
        width: 1536,
        height: 1024,
        alt: "The ALAS canister for daily salt",
      },
      {
        src: "/products/welcome-e.png",
        width: 1402,
        height: 1122,
        alt: "The ALAS spoon",
      },
    );
  }
  return [
    ...own,
    ...extra.map((img) => ({ ...img, onWhite: onWhite(img.src) })),
  ];
}

/** One lifestyle scene per kind, with a single line. */
const SCENE: Record<Product["kind"], { image: ArtImage; line: string }> = {
  salt: { image: art.photo.morning, line: "A pinch in your morning water." },
  sticks: { image: art.photo.runnerBottle, line: "One stick, one bottle." },
  box: { image: art.photo.glass, line: "Everything to begin, in one box." },
};

export function ProductView({ handle }: { handle: string }) {
  const product = getProduct(handle) as Product;
  const siblings = siblingsOf(product);
  const [qty, setQty] = useState(1);
  const [plan, setPlan] = useState<Plan>("once");
  const [addedHere, setAddedHere] = useState(false);
  const gallery = useRef<GalleryHandle>(null);
  const root = useRef<HTMLElement>(null);
  const images = galleryFor(product);
  const scene = SCENE[product.kind];
  const source = () => gallery.current?.current() ?? null;

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from("[data-enter]", {
        y: 30,
        opacity: 0,
        duration: 1.2,
        ease: EASE.out,
        stagger: 0.06,
        delay: 0.1,
      });
    },
    { scope: root, dependencies: [handle] },
  );

  // Pouches can also come as The Ritual (two pouches every month).
  const subscribable = product.kind === "salt";
  const ritual = subscribable && plan === "ritual";
  const shownPrice = ritual ? RITUAL.price : product.price;

  const greek = product.greek
    ? GREEK_MEANING[product.handle]
      ? `${product.greek} · ${GREEK_MEANING[product.handle]}`
      : product.greek
    : null;

  return (
    <main
      ref={root}
      className="bg-chalk pt-28 pb-[calc(var(--section-y)+4rem)] text-ink sm:pt-32 lg:pb-[var(--section-y)]"
    >
      <div className="container-x">
        <nav
          aria-label="Breadcrumb"
          className="rule-label eyebrow justify-between"
          data-enter
        >
          <Link
            href="/#shop"
            className="group inline-flex items-center gap-2 text-ink transition-colors hover:text-ink-2"
          >
            <svg
              viewBox="0 0 16 16"
              className="size-3 transition-transform duration-500 group-hover:-translate-x-1"
              aria-hidden
            >
              <path
                d="M13 8H3M7 4 3 8l4 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
            The range
          </Link>
          <span className="text-ink-3!">/ {kindLabel[product.kind]}</span>
        </nav>

        <div className="mt-8 grid gap-y-10 lg:mt-10 lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
          <div className="lg:col-span-7" data-enter>
            <Gallery ref={gallery} images={images} />
          </div>

          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <p className="eyebrow" data-enter>
                / {kindLabel[product.kind]}
                {REASONS[product.handle] ? (
                  <span className="text-ink-3">
                    {" "}
                    · {REASONS[product.handle]}
                  </span>
                ) : null}
              </p>
              <div
                className="mt-5 flex items-end justify-between gap-6"
                data-enter
              >
                <h1 className="font-display text-[clamp(3rem,2.2rem+3.4vw,5.4rem)] leading-[0.98]!">
                  {product.name}
                </h1>
                <p className="shrink-0 pb-2 text-right font-mono">
                  {shownPrice === null ? (
                    <span className="text-[0.95rem] text-ink-2">
                      {PRICE_SOON}
                    </span>
                  ) : (
                    <TweenPrice value={shownPrice} className="text-[1.35rem]" />
                  )}
                  {ritual && (
                    <span className="mt-1 block text-[10.5px] text-ink-3 uppercase tracking-[0.08em]">
                      a month
                    </span>
                  )}
                </p>
              </div>
              {greek && (
                <p
                  className="font-display mt-3 text-[1.2rem] text-ink-2 italic"
                  data-enter
                >
                  {greek}
                </p>
              )}
              <p className="mt-2 text-[15px] text-ink-2" data-enter>
                {product.subtitle}
              </p>
              {shownPrice !== null && (
                <p data-enter className="mt-3">
                  <Link
                    href="/account"
                    className="font-mono text-[11px] text-ink-3 uppercase tracking-[0.08em] underline decoration-[var(--c-line)] underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
                  >
                    Earns {grainsLabel(grainsFor(shownPrice))}
                    {ritual ? " every month" : ""}
                    {POINTS.live ? "" : " · opening soon"}
                  </Link>
                </p>
              )}

              {siblings.length > 0 && (
                <div className="mt-9" data-enter>
                  <p className="rule-label eyebrow justify-between">
                    <span>/ Size</span>
                    <span className="text-ink-3!">{sizeLabel(product)}</span>
                  </p>
                  <SizeSwitch
                    label="Sizes"
                    className="mt-5"
                    value={product.handle}
                    options={siblings.map((p) => ({
                      value: p.handle,
                      label: p.kind === "sticks" ? String(p.sticks) : p.name,
                      sublabel: p.kind === "sticks" ? "sticks" : sizeLabel(p),
                      tag: p.price === null ? "Price soon" : REASONS[p.handle],
                      href: `/products/${p.handle}`,
                    }))}
                  />
                  {product.flavours && (
                    <p className="mt-5 text-[13px] text-ink-3">
                      {FLAVOUR_NOTE}.
                    </p>
                  )}
                </div>
              )}

              {subscribable && (
                <div className="mt-8" data-enter>
                  <p className="rule-label eyebrow justify-between">
                    <span>/ How you buy</span>
                    <span className="text-ink-3!">
                      {ritual ? "Two pouches, every month" : "Once"}
                    </span>
                  </p>
                  <PlanPicker
                    className="mt-5"
                    value={plan}
                    onChange={setPlan}
                    oncePrice={product.price}
                    onceLabel={sizeLabel(product)}
                  />
                </div>
              )}

              <div id="buy" className="scroll-mt-28" data-enter>
                {ritual ? (
                  <div className="mt-9 border-[var(--c-line)] border-t pt-6">
                    <RitualCta source="ritual-product" className="w-full" />
                    <p className="mt-4 min-h-[2.8em] text-[13px] text-ink-3 leading-snug">
                      {TERMS_LINE}
                    </p>
                  </div>
                ) : (
                  <BuyRow
                    className="mt-9 border-[var(--c-line)] border-t pt-6"
                    product={product}
                    qty={qty}
                    onQty={setQty}
                    source={source}
                    onAdded={() => setAddedHere(true)}
                  />
                )}
              </div>

              <p
                className="mt-2 max-w-[52ch] text-[16px] text-ink-2 leading-relaxed"
                data-enter
              >
                {product.description}
              </p>
            </div>
          </div>
        </div>

        {/* The scene: what the ritual looks like in real life. */}
        <figure className="mt-[clamp(5rem,3rem+6vw,9rem)]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--r-lg)] sm:aspect-[21/9]">
            <Image
              src={scene.image.src}
              alt={scene.image.alt}
              fill
              sizes="(min-width: 1440px) 1344px, 100vw"
              className="object-cover"
            />
          </div>
          <figcaption className="font-display mt-6 text-[length:var(--fs-h3)] text-ink">
            {scene.line}
          </figcaption>
        </figure>

        <div className="mt-[clamp(4.5rem,3rem+5vw,8rem)] grid gap-x-[var(--gutter)] gap-y-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <MiniLabel product={product} />
          </div>
          <div className="lg:col-span-8">
            <HowToStrip product={product} />
          </div>
        </div>

        <div className="mt-[clamp(4.5rem,3rem+5vw,8rem)] grid gap-x-[var(--gutter)] gap-y-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <ProductFaq product={product} />
          </div>
          <div className="lg:col-span-5">
            <Complements handle={product.handle} />
          </div>
        </div>
      </div>

      <StickyBar
        product={product}
        qty={qty}
        ritual={ritual}
        addedHere={addedHere}
        onAdded={() => setAddedHere(true)}
        source={source}
      />
    </main>
  );
}

/** Complements only (sticks with a pouch, a pouch with sticks); boxes as one upgrade line. */
function Complements({ handle }: { handle: string }) {
  const cart = useCart();
  const picks = complementsOf(handle);
  const upgrade = upgradeFor(handle);
  const plates = useRef<(HTMLDivElement | null)[]>([]);
  const upgradePlate = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-10">
      {picks.length > 0 && (
        <div>
          <p className="rule-label eyebrow justify-between">
            <span>/ Pairs well with</span>
          </p>
          <ul className="mt-6 space-y-4">
            {picks.map((p, i) => (
              <li key={p.handle} className="flex items-center gap-4">
                <Link href={`/products/${p.handle}`} className="block shrink-0">
                  <div
                    ref={(el) => {
                      plates.current[i] = el;
                    }}
                    className="relative size-24 overflow-hidden rounded-[18px] bg-lime"
                  >
                    <ProductThumb product={p} sizes="96px" />
                  </div>
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[1.45rem] leading-[1.05]!">
                    <Link
                      href={`/products/${p.handle}`}
                      className="underline-offset-[6px] decoration-1 hover:underline"
                    >
                      {p.kind === "sticks"
                        ? `${p.sticks} Hydration Sticks`
                        : p.name}
                    </Link>
                  </p>
                  <p className="mt-1 text-[14px] text-ink-2">
                    {p.kind === "sticks"
                      ? "For the gym bag and the road."
                      : "A pinch in your water at home."}
                  </p>
                </div>
                <AddButton
                  size="md"
                  label="Add"
                  price={p.price}
                  variant="ghost"
                  ariaLabel={`Add ${p.name} to cart, ${formatPrice(p.price)}`}
                  className="min-w-[9.5rem] shrink-0"
                  onAdd={() =>
                    flyToCart(plates.current[i], () =>
                      cart.add(p.handle, { qty: 1 }),
                    )
                  }
                />
              </li>
            ))}
          </ul>
        </div>
      )}
      {upgrade && (
        <div>
          <p className="rule-label eyebrow justify-between">
            <span>
              /{" "}
              {upgrade.handle === "family-box"
                ? "For the whole house"
                : "The full ritual"}
            </span>
          </p>
          <div className="mt-6 flex items-center gap-4">
            <div
              ref={upgradePlate}
              className="relative size-24 shrink-0 overflow-hidden rounded-[18px] bg-lime"
            >
              <ProductThumb product={upgrade} sizes="96px" />
            </div>
            <p className="min-w-0 flex-1 text-[15px] text-ink-2 leading-snug">
              Make it the{" "}
              <Link
                href={`/products/${upgrade.handle}`}
                className="text-ink underline decoration-[var(--c-line-strong)] underline-offset-4 hover:decoration-ink"
              >
                {upgrade.name}
              </Link>
              :{" "}
              {upgrade.subtitle.charAt(0).toLowerCase() +
                upgrade.subtitle.slice(1)}
              .
            </p>
            <AddButton
              size="md"
              label="Add"
              price={upgrade.price}
              variant="ghost"
              ariaLabel={`Add ${upgrade.name} to cart, ${formatPrice(upgrade.price)}`}
              className="min-w-[9.5rem] shrink-0"
              onAdd={() =>
                flyToCart(upgradePlate.current, () =>
                  cart.add(upgrade.handle, { qty: 1 }),
                )
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** Phones: a glass bar with Add from the first screen; after adding, the way to checkout. */
function StickyBar({
  product,
  qty,
  ritual,
  addedHere,
  onAdded,
  source,
}: {
  product: Product;
  qty: number;
  /** The Ritual is chosen: the bar leads back to its button. */
  ritual: boolean;
  addedHere: boolean;
  onAdded: () => void;
  source: () => HTMLElement | null;
}) {
  const cart = useCart();
  const inCart = addedHere && cart.count > 0;
  const price = product.price;
  return (
    <div
      className="glass fixed inset-x-3 bottom-3 z-[44] flex items-center gap-3 rounded-full py-2 pr-2 pl-5 lg:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {inCart ? (
        <>
          <button
            type="button"
            onClick={cart.open}
            className="min-w-0 flex-1 text-left"
          >
            <span className="block font-mono text-[10.5px] text-ink-2 uppercase tracking-[0.08em]">
              In your cart
            </span>
            <span className="mt-0.5 block font-mono text-[14px] text-ink">
              {formatPrice(cart.subtotal)}
            </span>
          </button>
          <a
            href={cart.checkoutUrl}
            className="grid h-11 shrink-0 place-items-center rounded-full bg-ink px-6 font-medium text-[0.7rem] text-white uppercase tracking-[0.16em] active:scale-95"
          >
            Checkout
          </a>
        </>
      ) : ritual ? (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[1.2rem] leading-none!">
              {RITUAL.name}
            </p>
            <p className="mt-1 font-mono text-[11px] text-ink-2">
              {formatPrice(RITUAL.price)} a month
              <span className="text-ink-3"> · Two pouches</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => scrollToTarget("#buy")}
            className="h-11 shrink-0 rounded-full bg-ink px-5 font-medium text-[0.7rem] text-white uppercase tracking-[0.16em] active:scale-95"
          >
            Join
          </button>
        </>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[1.2rem] leading-none!">
              {product.name}
            </p>
            <p className="mt-1 font-mono text-[11px] text-ink-2">
              {price === null ? PRICE_SOON : formatPrice(price * qty)}
              <span className="text-ink-3"> · Free US shipping</span>
            </p>
          </div>
          <button
            type="button"
            disabled={price === null}
            onClick={() =>
              flyToCart(source(), () => {
                cart.add(product.handle, { qty });
                onAdded();
              })
            }
            className={clsx(
              "h-11 shrink-0 rounded-full bg-ink px-5 font-medium text-[0.7rem] text-white uppercase tracking-[0.16em] active:scale-95 disabled:opacity-45",
            )}
          >
            {price === null ? "Soon" : "Add to cart"}
          </button>
        </>
      )}
      <span className="sr-only" aria-live="polite">
        {inCart
          ? `In your cart, ${formatPrice(cart.subtotal)}. ${TERMS_LINE}`
          : ""}
      </span>
    </div>
  );
}
