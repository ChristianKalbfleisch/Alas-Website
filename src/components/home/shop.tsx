"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Countdown, useCountdown } from "@/components/campaign/countdown";
import { DealFigure, DealNote, DealPrice } from "@/components/campaign/deal";
import { WaterLight } from "@/components/home/water-light";
import { BuyBlock } from "@/components/product/buy-block";
import { FlavourSwitch } from "@/components/product/flavour-switch";
import { PackShot } from "@/components/product/pack-shot";
import { Check } from "@/components/ui/icons";
import { CAMPAIGN } from "@/data/campaign";
import { GIFT_TOP } from "@/data/gift";
import { PHOTOS } from "@/data/photos";
import {
  FLAVOUR_NOTE,
  type Flavour,
  getProduct,
  type Product,
  perServing,
  products,
  shotFor,
} from "@/data/products";

const SIZES = "(min-width: 1024px) 30vw, (min-width: 640px) 60vw, 92vw";

const find = (handle: string): Product => {
  const product = getProduct(handle);
  if (!product) throw new Error(`Unknown product ${handle}`);
  return product;
};

function Card({
  children,
  badge,
  onNear,
}: {
  children: React.ReactNode;
  /** A label that sits across the card's top edge. */
  badge?: string;
  /** Called when a pointer, a finger or the keyboard first reaches the card. */
  onNear?: () => void;
}) {
  return (
    <article
      onPointerEnter={onNear}
      onTouchStart={onNear}
      onFocus={onNear}
      className="rise relative flex flex-col rounded-[var(--radius-panel)] bg-paper p-4 shadow-[var(--shadow-card)] sm:p-5"
    >
      {badge && (
        <span className="chip chip-sea absolute top-0 left-7 z-10 -translate-y-1/2">
          {badge}
        </span>
      )}
      {children}
    </article>
  );
}

/** The offer, on the corner of every pack picture. */
function Saving() {
  return (
    <span className="chip chip-navy absolute top-3.5 left-3.5">
      Up to {GIFT_TOP.percent}% off
    </span>
  );
}

const PROMISES = ["Free US shipping", "30-day guarantee", "Free Welcome Box"];

/** What every order comes with, said once under the three cards. */
function Promises() {
  return (
    <ul className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2">
      {PROMISES.map((line) => (
        <li key={line} className="t-body flex items-center gap-2 text-ink">
          <Check size={18} strokeWidth={2.25} className="shrink-0 text-sea" />
          {line}
        </li>
      ))}
    </ul>
  );
}

function Heading({ product, qty = 1 }: { product: Product; qty?: number }) {
  const each = perServing(product);
  return (
    <div className="mt-5 px-1">
      <h3 className="t-h3">
        <Link href={`/products/${product.handle}`} className="hover:text-sea">
          {product.name}
        </Link>
      </h3>
      <p className="t-small mt-1 text-ink-2">
        {product.subtitle}
        {each && ` \u00b7 ${each}`}
      </p>
      {product.price !== null && (
        <div className="mt-3 grid justify-items-start gap-1.5">
          <DealPrice price={product.price * qty} />
          <DealNote />
        </div>
      )}
    </div>
  );
}

type TileProps = {
  chosen: boolean;
  onChoose: () => void;
  figure: number;
  unit: string;
  price: number | null;
};

/** One choice of how many: the number, what it counts, and the price. */
function Tile({ chosen, onChoose, figure, unit, price }: TileProps) {
  return (
    <button
      type="button"
      aria-pressed={chosen}
      onClick={onChoose}
      className={clsx(
        "rounded-xl border px-2 py-2.5 text-center transition-colors",
        chosen
          ? "border-navy shadow-[inset_0_0_0_1px_var(--color-navy)]"
          : "border-line hover:border-ink-3",
      )}
    >
      <span
        className={clsx(
          "block text-[1.25rem] leading-tight",
          chosen && "font-bold",
        )}
      >
        {figure}
      </span>
      <span className="t-small block text-ink-2">{unit}</span>
      {price !== null && (
        <span className="t-small t-price block text-ink">
          <DealFigure price={price} bare />
        </span>
      )}
    </button>
  );
}

/**
 * Fetches a card's other pictures the first time a visitor goes near it, so
 * the picture changes at once when another amount or flavour is picked.
 */
function useWarmPictures(sources: string[]) {
  const done = useRef(false);
  return () => {
    if (done.current) return;
    done.current = true;
    for (const src of sources) new window.Image().src = src;
  };
}

const POUCHES = [1, 2, 3] as const;
const POUCH_HANDLES = ["classic-pouch", "lemon-pouch"];

function PouchCard() {
  const [flavour, setFlavour] = useState<Flavour>("Classic");
  const [qty, setQty] = useState<(typeof POUCHES)[number]>(1);
  const product = find(flavour === "Classic" ? "classic-pouch" : "lemon-pouch");
  const warm = useWarmPictures(
    POUCH_HANDLES.flatMap((handle) =>
      POUCHES.map((count) => shotFor(find(handle), count).src),
    ),
  );
  return (
    <Card onNear={warm}>
      <Link
        href={`/products/${product.handle}`}
        aria-label={product.name}
        className="relative block"
      >
        <PackShot image={shotFor(product, qty)} ratio="5 / 4" sizes={SIZES} />
        <Saving />
      </Link>
      <Heading product={product} qty={qty} />
      <p className="t-body mt-3 px-1 text-ink-2">{FLAVOUR_NOTE[flavour]}</p>
      <div className="mt-auto grid gap-3 pt-5">
        <fieldset className="m-0 grid min-w-0 grid-cols-3 gap-2.5 border-0 p-0">
          <legend className="sr-only">Number of pouches</legend>
          {POUCHES.map((count) => (
            <Tile
              key={count}
              chosen={count === qty}
              onChoose={() => setQty(count)}
              figure={count}
              unit={count === 1 ? "pouch" : "pouches"}
              price={product.price === null ? null : product.price * count}
            />
          ))}
        </fieldset>
        <FlavourSwitch
          label="Pouch flavour"
          value={flavour}
          onChange={setFlavour}
        />
        <BuyBlock key={product.handle} product={product} qty={qty} />
      </div>
    </Card>
  );
}

const COUNTS = [5, 15, 30] as const;

function SticksCard() {
  const [flavour, setFlavour] = useState<Flavour>("Classic");
  const [count, setCount] = useState<(typeof COUNTS)[number]>(15);
  const range = products.filter(
    (p) => p.kind === "sticks" && p.flavour === flavour,
  );
  const product = range.find((p) => p.sticks === count) ?? range[0];
  const warm = useWarmPictures(
    products.filter((p) => p.kind === "sticks").map((p) => p.images[0].src),
  );
  return (
    <Card onNear={warm}>
      <Link
        href={`/products/${product.handle}`}
        aria-label={product.name}
        className="relative block"
      >
        <PackShot image={product.images[0]} ratio="5 / 4" sizes={SIZES} />
        <Saving />
      </Link>
      <Heading product={product} />
      <p className="t-body mt-3 px-1 text-ink-2">
        One stick, one bottle. For the gym bag, the desk and the plane.
      </p>
      <div className="mt-auto grid gap-3 pt-5">
        <fieldset className="m-0 grid min-w-0 grid-cols-3 gap-2.5 border-0 p-0">
          <legend className="sr-only">Number of sticks</legend>
          {range.map((option) => (
            <Tile
              key={option.handle}
              chosen={option.sticks === count}
              onChoose={() =>
                setCount(option.sticks as (typeof COUNTS)[number])
              }
              figure={option.sticks ?? 0}
              unit="sticks"
              price={option.price}
            />
          ))}
        </fieldset>
        <FlavourSwitch
          label="Sticks flavour"
          value={flavour}
          onChange={setFlavour}
        />
        <BuyBlock key={product.handle} product={product} />
      </div>
    </Card>
  );
}

const SET_HOLDS = [
  { figure: 1, unit: "pouch", note: "390 g" },
  { figure: 4, unit: "sticks", note: "2.5 g each" },
  { figure: 1, unit: "card", note: "three rituals" },
];

function SetCard() {
  const product = find("discover-set");
  return (
    <Card badge="Best way to start">
      <Link
        href={`/products/${product.handle}`}
        aria-label={product.name}
        className="relative block"
      >
        <PackShot image={product.images[0]} ratio="5 / 4" sizes={SIZES} />
        <Saving />
      </Link>
      <Heading product={product} />
      <p className="t-body mt-3 px-1 text-ink-2">
        Everything to start, in one box.
      </p>
      <div className="mt-auto grid gap-3 pt-5">
        <ul className="grid grid-cols-3 gap-2.5">
          {SET_HOLDS.map((held) => (
            <li
              key={held.unit}
              className="rounded-xl bg-mist px-2 py-2.5 text-center"
            >
              <span className="block text-[1.25rem] leading-tight">
                {held.figure}
              </span>
              <span className="t-small block text-ink-2">{held.unit}</span>
              <span className="t-small block text-ink">{held.note}</span>
            </li>
          ))}
        </ul>
        <p className="t-small grid min-h-12 place-items-center rounded-xl border border-line px-3 text-center text-ink">
          The first 100 are hand-numbered
        </p>
        <BuyBlock product={product} />
      </div>
    </Card>
  );
}

/** The offer's end, beside the shop's heading while the campaign runs. */
function Deadline() {
  const over = useCountdown()?.over ?? false;
  if (!CAMPAIGN || over) return null;
  return (
    <div>
      <p className="t-small mb-2.5 text-ink">
        {CAMPAIGN.name} prices end {CAMPAIGN.endsLabel}
      </p>
      <Countdown tone="paper" />
    </div>
  );
}

/**
 * The shop: three cards, each one buyable where it stands, laid over sunlit
 * shallow water whose light moves slowly.
 */
export function Shop() {
  return (
    <section
      id="shop"
      aria-labelledby="shop-title"
      className="section relative isolate overflow-clip bg-mist"
    >
      <Image
        src={PHOTOS.caustics.src}
        alt=""
        placeholder="blur"
        sizes="100vw"
        className="absolute inset-0 -z-10 size-full object-cover opacity-85"
      />
      <WaterLight className="absolute inset-0 -z-10 size-full opacity-0 transition-opacity duration-1000 data-[on=true]:opacity-85" />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[13rem] bg-[linear-gradient(to_bottom,var(--color-paper)_0%,rgb(255_255_255/0.7)_40%,rgb(255_255_255/0)_100%)]"
      />
      <div className="wrap">
        <div className="grid gap-6 wide:grid-cols-[minmax(0,1fr)_auto] wide:items-end wide:gap-12">
          <div className="max-w-[42rem]">
            <h2 id="shop-title" className="t-h2">
              Choose your salt.
            </h2>
            <p className="t-lead mt-4 text-ink">
              One salt in two flavours. A pouch for the kitchen, sticks for
              everywhere else, or the set that has both.
            </p>
          </div>
          <Deadline />
        </div>
        <div className="mt-10 grid gap-5 min-[45rem]:grid-cols-3 min-[45rem]:gap-4 wide:mt-12 wide:gap-5 xl:gap-6">
          <PouchCard />
          <SticksCard />
          <SetCard />
        </div>
        <Promises />
        <p className="t-fine mt-5 text-ink-2">
          Pre-production packaging shown. Final packs may vary.
        </p>
      </div>
    </section>
  );
}
