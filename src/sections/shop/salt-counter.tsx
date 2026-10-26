"use client";

import { useRef, useState } from "react";
import { BuyRow } from "@/components/cart/buy-row";
import { TweenPrice } from "@/components/cart/controls";
import { type Plan, PlanPicker } from "@/components/cart/plan-picker";
import { RitualCta } from "@/components/cart/ritual-cta";
import { RollingWord } from "@/components/cart/rolling-word";
import { SizeSwitch } from "@/components/cart/size-switch";
import { RITUAL } from "@/data/ritual";
import {
  FLAVOUR_NOTE,
  GREEK_MEANING,
  PRICE_SOON,
  REASONS,
  saltRange,
  sizeLabel,
  TERMS_LINE,
} from "@/lib/cart/catalogue";
import { PouchStage, type PouchStageHandle } from "./pouch-stage";
import { Rise } from "./rise";

/** The Ritual ships the two-pouch size. */
const RITUAL_INDEX = Math.max(
  0,
  saltRange.findIndex((p) => p.pouches === RITUAL.pouches),
);

/** 01: Aegean Mineral Salt. One switch, three sizes, the pouches stack; one time or The Ritual. */
export function SaltCounter() {
  const [index, setIndex] = useState(0);
  const [plan, setPlan] = useState<Plan>("once");
  const [qty, setQty] = useState(1);
  const stage = useRef<PouchStageHandle>(null);
  const product = saltRange[index];
  const pouches = product.pouches ?? 1;
  const ritual = plan === "ritual";
  const shownPrice = ritual ? RITUAL.price : product.price;

  const choosePlan = (next: Plan) => {
    setPlan(next);
    if (next === "ritual") setIndex(RITUAL_INDEX);
  };
  const chooseSize = (handle: string) => {
    setIndex(saltRange.findIndex((p) => p.handle === handle));
    setPlan("once");
  };

  return (
    <div
      id="shop-salt"
      className="grid scroll-mt-28 gap-y-10 lg:grid-cols-12 lg:gap-x-[var(--gutter)]"
    >
      <PouchStage
        ref={stage}
        count={pouches}
        caption={`/ ${sizeLabel(product)} · 390 g ${pouches > 1 ? "each" : ""}${ritual ? " · every month" : ""}`}
        className="aspect-[4/5] sm:aspect-[5/4] lg:col-span-7 lg:aspect-auto lg:min-h-[min(46rem,82vh)]"
      />

      <Rise className="flex flex-col lg:col-span-5 lg:pt-1">
        <p className="rule-label eyebrow justify-between" data-rise>
          <span>/ 01 Aegean Mineral Salt</span>
          <span className="text-ink-3">Harvested in Greece</span>
        </p>

        <div className="mt-8" data-rise>
          <div className="flex items-end justify-between gap-6">
            <RollingWord
              as="p"
              words={saltRange.map((p) => p.name)}
              index={index}
              className="font-display -mb-[0.12em] pb-[0.12em] text-[clamp(3.6rem,2.4rem+4.4vw,6.4rem)] text-ink leading-[1]!"
            />
            <p className="shrink-0 pb-3 text-right font-mono text-ink">
              {shownPrice === null ? (
                <span className="text-[0.95rem] text-ink-2">{PRICE_SOON}</span>
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
          <RollingWord
            as="p"
            words={saltRange.map(
              (p) =>
                `${p.greek} · ${GREEK_MEANING[p.handle]} · ${p.subtitle.split(" · ")[0]}`,
            )}
            index={index}
            className="mt-3 text-[15px] text-ink-2"
          />
        </div>

        <div className="mt-9" data-rise>
          <p className="rule-label eyebrow justify-between">
            <span>/ Size</span>
            <span className="text-ink-3">{sizeLabel(product)}</span>
          </p>
          <SizeSwitch
            label="Size"
            className="mt-5"
            value={product.handle}
            onChange={chooseSize}
            options={saltRange.map((p) => ({
              value: p.handle,
              label: p.name,
              sublabel: sizeLabel(p),
              tag: p.price === null ? "Price soon" : REASONS[p.handle],
            }))}
          />
          <p className="mt-5 text-[13px] text-ink-3">{FLAVOUR_NOTE}.</p>
        </div>

        <div className="mt-8" data-rise>
          <p className="rule-label eyebrow justify-between">
            <span>/ How you buy</span>
            <span className="text-ink-3">
              {ritual ? "Every month" : "Once"}
            </span>
          </p>
          <PlanPicker
            className="mt-5"
            value={plan}
            onChange={choosePlan}
            oncePrice={product.price}
            onceLabel={sizeLabel(product)}
          />
        </div>

        <div className="mt-9 border-[var(--c-line)] border-t pt-6" data-rise>
          {ritual ? (
            <>
              <RitualCta source="ritual-shop" className="w-full" />
              <p className="mt-4 min-h-[2.8em] text-[13px] text-ink-3 leading-snug">
                {TERMS_LINE}
              </p>
            </>
          ) : (
            <BuyRow
              product={product}
              qty={qty}
              onQty={setQty}
              source={() => stage.current?.front() ?? null}
            />
          )}
        </div>
      </Rise>
    </div>
  );
}
