"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DealPrice } from "@/components/campaign/deal";
import { openGift } from "@/components/founding/store";
import { useMember } from "@/components/founding/use-member";
import { Accordion } from "@/components/ui/accordion";
import { Check, Gift, Minus, Plus, Shield, Truck } from "@/components/ui/icons";
import { rangeLine } from "@/data/offer-lines";
import { TERMS } from "@/data/offers";
import { presaleLine } from "@/data/presale";
import {
  canOrder,
  FLAVOUR_NOTE,
  FLAVOURS,
  getProduct,
  inFlavour,
  POUCH_SERVINGS,
  type Product,
  perServing,
} from "@/data/products";
import { siblingsOf } from "@/lib/cart/catalogue";
import { noteViewed } from "@/lib/cart/shopper";
import { AmountTile } from "./amount-tile";
import { BuyBar } from "./buy-bar";
import { BuyBlock } from "./buy-block";
import { Gallery } from "./gallery";

const DOT = { Classic: "bg-navy", Lemon: "bg-lemon" } as const;

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
            {sizes.map((size) => (
              <AmountTile
                key={size.handle}
                href={`/products/${size.handle}`}
                chosen={size.handle === product.handle}
                figure={size.sticks ?? 0}
                unit="sticks"
                price={size.price}
              />
            ))}
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
  "Early access to the Welcome Box",
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
            ? "The 390 g Classic pouch, four 2.5 g Classic sticks and a card on how to use them. The salt is Greek fleur de sel, hand-harvested from Mediterranean salt pans and dried by the sun."
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
            : `A pinch in your first glass of water, or over your food just before you eat. ${
                classic
                  ? `The serving on the label is 1/4 teaspoon (1.5 g); a pouch holds roughly ${POUCH_SERVINGS}.`
                  : "Serving size and nutrition are printed on the Lemon pack."
              }`}
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
  const { offer, mine } = useMember();
  const top = offer.top.percent;

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
              <DealPrice price={product.price} qty={qty} size="lg" />
              <button
                type="button"
                onClick={() => openGift("product")}
                className="link t-body justify-self-start text-left text-sea"
              >
                {mine !== null
                  ? mine < top
                    ? `Your ${mine}% off is added at checkout. Build it to ${top}%.`
                    : `Your ${mine}% off is added at checkout.`
                  : offer.campaign
                    ? `${offer.campaign.name}: start at ${offer.start.percent}% off, build it to ${top}%. Ends ${offer.campaign.endsLabel}.`
                    : rangeLine(offer)}
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
                  Up to {top}% off this pre-order.{" "}
                  {mine === null && (
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

      {sellable && <BuyBar product={product} qty={qty} on={barOn} />}
    </>
  );
}
