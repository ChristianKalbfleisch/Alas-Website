"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCountdown } from "@/components/campaign/countdown";
import { DealFigure, DealPrice } from "@/components/campaign/deal";
import { earnedTier, openGift, useGift } from "@/components/founding/store";
import { Accordion } from "@/components/ui/accordion";
import { Check, Gift, Minus, Plus, Shield, Truck } from "@/components/ui/icons";
import { CAMPAIGN } from "@/data/campaign";
import { GIFT_START, GIFT_TOP } from "@/data/gift";
import { TERMS } from "@/data/offers";
import { PHOTOS, type Photo } from "@/data/photos";
import { presaleLine } from "@/data/presale";
import {
  canOrder,
  FLAVOUR_NOTE,
  FLAVOURS,
  getProduct,
  inFlavour,
  type PackImage,
  type Product,
  perServing,
  shotFor,
} from "@/data/products";
import { formatPrice } from "@/lib/cart/cart-math";
import { siblingsOf } from "@/lib/cart/catalogue";
import { noteViewed } from "@/lib/cart/shopper";
import { BuyBlock } from "./buy-block";

const DOT = { Classic: "bg-navy", Lemon: "bg-lemon" } as const;

/** One picture in the gallery: the pack on its panel, or a photograph with one line on it. */
type Slide =
  | { kind: "pack"; image: PackImage }
  | { kind: "photo"; photo: Photo; line: string; at?: string };

const shot = (photo: Photo, line: string, at?: string): Slide => ({
  kind: "photo",
  photo,
  line,
  at,
});

/**
 * The pack first, in the amount picked; then photographs that each say one
 * thing; then the other pack views.
 */
function slidesFor(product: Product, qty: number): Slide[] {
  const packs: Slide[] = product.images.map((image, i) => ({
    kind: "pack",
    image: i === 0 ? shotFor(product, qty) : image,
  }));
  const lemon = product.flavour === "Lemon";
  let photos: Slide[];
  if (product.kind === "sticks") {
    photos = lemon
      ? [
          shot(PHOTOS.ledgeLemon, "The same salt, with lemon.", "74% 100%"),
          shot(PHOTOS.lemon, "A bright citrus note."),
        ]
      : [
          shot(PHOTOS.ledgeBottle, "A stick in your bottle.", "86% 100%"),
          shot(PHOTOS.pour, "Tear, pour, stir."),
          shot(
            PHOTOS.toteSticks,
            "For the bag, the desk, the plane.",
            "60% 70%",
          ),
        ];
  } else if (product.kind === "set") {
    photos = [
      shot(PHOTOS.stillSun, "A pouch for home, sticks for the road."),
      shot(PHOTOS.pour, "Tear, pour, stir."),
      shot(PHOTOS.plate, "And on your plate."),
    ];
  } else {
    photos = lemon
      ? [
          shot(PHOTOS.ledgeLemon, "The same salt, with lemon.", "74% 100%"),
          shot(PHOTOS.lemon, "A bright citrus note."),
          shot(PHOTOS.glassPinch, "A pinch in your glass.", "64% 50%"),
          shot(PHOTOS.crystals, "Fine crystals, 0.5 to 2 mm.", "78% 50%"),
        ]
      : [
          shot(PHOTOS.ledgeGlass, "A pinch in your glass.", "80% 100%"),
          shot(PHOTOS.stillSun, "Greek fleur de sel, gathered by hand."),
          shot(PHOTOS.plate, "And on your plate."),
          shot(PHOTOS.crystals, "Fine crystals, 0.5 to 2 mm.", "78% 50%"),
        ];
  }
  return [packs[0], ...photos, ...packs.slice(1)];
}

/**
 * The width a photograph is drawn at in the gallery's square box. A wide
 * photograph fills the box by its height, so it is drawn wider than the box.
 */
const coverSizes = (photo: Photo) => {
  const wider = Math.max(1, photo.src.width / photo.src.height);
  return `(min-width: 50rem) ${Math.ceil(52 * wider)}vw, ${Math.ceil(92 * wider)}vw`;
};

const slideKey = (slide: Slide) =>
  slide.kind === "pack" ? slide.image.src : slide.photo.src.src;
const slideAlt = (slide: Slide) =>
  slide.kind === "pack" ? slide.image.alt : slide.photo.alt;

/** How many of a product its largest picture shows. */
const mostShown = (product: Product) =>
  Math.max(1, ...Object.keys(product.counts ?? {}).map(Number));

function Gallery({ product, qty }: { product: Product; qty: number }) {
  const slides = slidesFor(product, qty);
  const [index, setIndex] = useState(0);
  const slide = slides[Math.min(index, slides.length - 1)];
  // Picking another amount brings the pack back into view.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the amount changes
  useEffect(() => setIndex(0), [qty]);
  return (
    <div className="min-w-0 wide:sticky wide:top-[calc(var(--header-h)+var(--bar-h)+1.5rem)] wide:self-start">
      {slide.kind === "pack" ? (
        <div
          className={clsx(
            "stage aspect-square max-h-[64svh]",
            slide.image.cover && "stage-studio",
          )}
        >
          <Image
            key={slide.image.src}
            src={slide.image.src}
            alt={slide.image.alt}
            width={slide.image.width}
            height={slide.image.height}
            priority
            unoptimized
            sizes="(min-width: 1024px) 52vw, 92vw"
            className={slide.image.cover ? undefined : "p-[7%]"}
          />
          {index === 0 && (
            <span className="chip chip-navy absolute top-4 left-4">
              Up to {GIFT_TOP.percent}% off
            </span>
          )}
          {index === 0 && product.counts && qty > mostShown(product) && (
            <span className="chip chip-paper absolute bottom-4 left-4">
              {mostShown(product)} of {qty} shown
            </span>
          )}
        </div>
      ) : (
        <figure className="photo aspect-square max-h-[64svh] rounded-[var(--radius-card)]!">
          <Image
            key={slide.photo.src.src}
            src={slide.photo.src}
            alt={slide.photo.alt}
            placeholder="blur"
            sizes={coverSizes(slide.photo)}
            style={{ objectPosition: slide.at }}
          />
          <figcaption className="photo-caption t-h3">{slide.line}</figcaption>
        </figure>
      )}
      <ul className="strip mt-3 gap-2.5! px-0! pb-1">
        {slides.map((thumb, i) => (
          <li key={i === 0 ? "pack" : slideKey(thumb)} className="shrink-0">
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}: ${slideAlt(thumb)}`}
              aria-current={i === index}
              className={clsx(
                "stage size-[4.5rem] rounded-xl sm:size-20",
                i === index
                  ? "shadow-[inset_0_0_0_2px_var(--color-navy)]"
                  : "opacity-80 hover:opacity-100",
              )}
            >
              {thumb.kind === "pack" ? (
                <Image
                  src={thumb.image.thumb}
                  alt=""
                  width={192}
                  height={192}
                  unoptimized
                  className="p-2"
                />
              ) : (
                <Image
                  src={thumb.photo.src}
                  alt=""
                  sizes="5rem"
                  className="object-cover!"
                  style={{ objectPosition: thumb.at }}
                />
              )}
            </button>
          </li>
        ))}
      </ul>
      <p className="t-fine mt-3 text-ink-2">
        Pre-production packaging shown. Final packs may vary.
      </p>
    </div>
  );
}

function Choices({ product }: { product: Product }) {
  const sizes = siblingsOf(product);
  if (product.kind === "set") return null;
  return (
    <div className="grid gap-5">
      <div>
        <p className="label">
          Flavour{" "}
          <span className="font-normal text-ink-2">{product.flavour}</span>
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {FLAVOURS.map((flavour) => {
            const target = inFlavour(product, flavour);
            if (!target) return null;
            const chosen = flavour === product.flavour;
            return (
              <Link
                key={flavour}
                href={`/products/${target.handle}`}
                replace
                scroll={false}
                aria-current={chosen ? "true" : undefined}
                className={clsx(
                  "flex min-h-13 items-center justify-center gap-2.5 rounded-xl border px-4 text-[1.0625rem] transition-colors",
                  chosen
                    ? "border-navy font-bold text-navy shadow-[inset_0_0_0_1px_var(--color-navy)]"
                    : "border-line hover:border-ink-3",
                )}
              >
                <span
                  aria-hidden
                  className={clsx(
                    "size-3.5 shrink-0 rounded-full",
                    DOT[flavour],
                  )}
                />
                {flavour}
              </Link>
            );
          })}
        </div>
      </div>
      {sizes.length > 1 && (
        <div>
          <p className="label">Pack size</p>
          <div className="grid grid-cols-3 gap-2.5">
            {sizes.map((size) => {
              const chosen = size.handle === product.handle;
              return (
                <Link
                  key={size.handle}
                  href={`/products/${size.handle}`}
                  replace
                  scroll={false}
                  aria-current={chosen ? "true" : undefined}
                  className={clsx(
                    "rounded-xl border px-2 py-3 text-center transition-colors",
                    chosen
                      ? "border-navy shadow-[inset_0_0_0_1px_var(--color-navy)]"
                      : "border-line hover:border-ink-3",
                  )}
                >
                  <span
                    className={clsx(
                      "block text-[1.0625rem]",
                      chosen && "font-bold",
                    )}
                  >
                    {size.sticks} sticks
                  </span>
                  {size.price !== null && (
                    <span className="t-small t-price block text-ink-2">
                      {formatPrice(size.price)}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Quantity({
  value,
  onChange,
}: {
  value: number;
  onChange: (qty: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="label mb-0">Quantity</p>
      <div className="flex items-center rounded-full border border-line">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, value - 1))}
          aria-label="One fewer"
          className="grid size-12 place-items-center rounded-full hover:bg-mist"
        >
          <Minus size={18} />
        </button>
        <span
          aria-live="polite"
          className="t-price min-w-8 text-center text-[1.125rem]"
        >
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(99, value + 1))}
          aria-label="One more"
          className="grid size-12 place-items-center rounded-full hover:bg-mist"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}

const PERKS = [
  "Founding Member status",
  "Your Welcome Box, free at launch",
  "Better prices than everyone else on later orders",
];

function details(product: Product) {
  const classic = product.flavour === "Classic";
  return [
    {
      id: "what",
      title: "What it is",
      body: (
        <p>
          {product.kind === "set"
            ? "The 390 g Classic pouch, four 2.5 g Classic sticks and a card with three simple rituals. The salt is Greek fleur de sel, hand-harvested from Mediterranean salt pans and dried by the sun."
            : `Greek fleur de sel, hand-harvested from Mediterranean salt pans and dried by the sun. ${FLAVOUR_NOTE[product.flavour]}`}
        </p>
      ),
    },
    {
      id: "use",
      title: "How to use it",
      body: (
        <p>
          {product.kind === "sticks"
            ? "Tear one stick into your bottle, shake and drink. One stick is 2.5 g."
            : "A pinch in your first glass of water, or over your food just before you eat. The serving on the label is 1/4 teaspoon (1.5 g); a pouch holds about 260."}
        </p>
      ),
    },
    {
      id: "ingredients",
      title: "Ingredients",
      body: (
        <p>
          {classic
            ? "Sea salt (fleur de sel). Nothing else. Nutrition Facts are on the back of the pack."
            : "Greek fleur de sel with lemon. The full ingredient list and Nutrition Facts are printed on the pack."}
        </p>
      ),
    },
    {
      id: "shipping",
      title: "Shipping and returns",
      body: (
        <p>
          {presaleLine()} {TERMS.shipping}. {TERMS.returns}.
        </p>
      ),
    },
  ];
}

/** One product: its pictures, its choices and the one way to buy it. */
export function ProductView({ handle }: { handle: string }) {
  const product = getProduct(handle);
  const [qty, setQty] = useState(1);
  const [barOn, setBarOn] = useState(false);
  const buy = useRef<HTMLDivElement>(null);
  const gift = useGift();
  const claimed = gift.joined;
  const earned = earnedTier(gift).percent;
  const over = useCountdown()?.over ?? false;
  const live = CAMPAIGN !== null && !over;

  useEffect(() => {
    noteViewed(handle);
  }, [handle]);

  // The bar at the foot of the screen shows whenever the buy button is out of view.
  useEffect(() => {
    const el = buy.current;
    if (!el) return;
    const seen = new IntersectionObserver(([entry]) => {
      setBarOn(!entry.isIntersecting);
    });
    seen.observe(el);
    return () => seen.disconnect();
  }, []);

  if (!product) return null;
  const sellable = canOrder(product);

  return (
    <>
      <section className="wrap grid gap-8 pt-5 pb-16 sm:pt-8 wide:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] wide:gap-16 wide:pb-24">
        <Gallery key={product.handle} product={product} qty={qty} />

        <div>
          <h1 className="t-h2">{product.name}</h1>
          <p className="t-lead mt-2 text-ink-2">
            {product.subtitle}
            {perServing(product) && ` \u00b7 ${perServing(product)}`}
          </p>
          {product.price !== null && (
            <div className="mt-5 grid gap-2">
              <DealPrice price={product.price * qty} size="lg" />
              <button
                type="button"
                onClick={() => openGift("product")}
                className="link t-body justify-self-start text-left text-sea"
              >
                {claimed
                  ? earned < GIFT_TOP.percent
                    ? `Your ${earned}% off is added at checkout. Build it to ${GIFT_TOP.percent}%.`
                    : `Your ${earned}% off is added at checkout.`
                  : live && CAMPAIGN
                    ? `${CAMPAIGN.name}: start at ${GIFT_START.percent}% off, build it to ${GIFT_TOP.percent}%. Ends ${CAMPAIGN.endsLabel}.`
                    : `Founding Members save up to ${GIFT_TOP.percent}%`}
              </button>
            </div>
          )}
          <p className="t-body mt-5 text-ink-2">{product.description}</p>

          <div className="mt-7 grid gap-6">
            <Choices product={product} />
            {sellable && <Quantity value={qty} onChange={setQty} />}
            <div ref={buy}>
              <BuyBlock
                key={product.handle}
                product={product}
                qty={qty}
                size="lg"
                buyNow
              />
            </div>
          </div>

          <ul className="t-small mt-6 grid gap-2.5 text-ink">
            <li className="flex items-center gap-2.5">
              <Truck size={22} className="shrink-0 text-sea" />
              {TERMS.shipping}
            </li>
            <li className="flex items-center gap-2.5">
              <Shield size={22} className="shrink-0 text-sea" />
              {TERMS.returns}
            </li>
          </ul>

          <div className="mt-8 rounded-[var(--radius-card)] bg-navy p-6 text-white sm:p-7">
            <h2 className="flex items-center gap-3 text-[1.25rem] font-bold">
              <Gift size={24} className="text-wave" />
              Included with your pre{"\u2011"}order
            </h2>
            <ul className="mt-4 grid gap-2.5">
              {PERKS.map((perk) => (
                <li key={perk} className="t-body flex items-start gap-2.5">
                  <Check
                    size={20}
                    strokeWidth={2}
                    className="mt-0.5 shrink-0 text-wave"
                  />
                  {perk}
                </li>
              ))}
              <li className="t-body flex items-start gap-2.5">
                <Check
                  size={20}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0 text-wave"
                />
                <span>
                  Up to {GIFT_TOP.percent}% off this pre-order.{" "}
                  {!claimed && (
                    <button
                      type="button"
                      onClick={() => openGift("product")}
                      className="link font-bold"
                    >
                      Claim it
                    </button>
                  )}
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <Accordion items={details(product)} />
          </div>
        </div>
      </section>

      {sellable && (
        <div
          aria-hidden={!barOn}
          inert={!barOn}
          data-buy-bar={barOn}
          className={clsx(
            "fixed inset-x-0 bottom-0 z-30 border-line border-t bg-paper px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgb(1_21_36/0.08)] transition-transform duration-300",
            barOn ? "translate-y-0" : "translate-y-full",
          )}
        >
          <div className="mx-auto flex max-w-[60rem] items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[1.0625rem] leading-tight font-bold">
                {product.name}
              </p>
              <p className="t-small text-ink-2">{product.subtitle}</p>
            </div>
            <p className="t-price shrink-0 text-[1.125rem] font-bold">
              <DealFigure price={product.price * qty} />
            </p>
            <div className="shrink-0">
              <BuyBlock product={product} qty={qty} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
