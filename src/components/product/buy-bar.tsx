"use client";

import clsx from "clsx";
import { useEffect, useRef } from "react";
import { DealFigure } from "@/components/campaign/deal";
import type { OrderableProduct } from "@/data/products";
import { BuyBlock } from "./buy-block";

/** Tells the rest of the page how tall the bar stands while it shows. */
const HEIGHT = "--buy-bar-h";

type BuyBarProps = {
  product: OrderableProduct;
  qty: number;
  /** The page's own buy button is out of view. */
  on: boolean;
};

/**
 * The bar that follows at the foot of a product page while its buy button is
 * out of view. On a phone the name has a column of its own, whatever the price
 * comes to: whole, on two lines if it needs them, with the pack's count for
 * sticks, and the price under it. On a computer the count stands once, in the
 * line under the name. While the bar shows, the page knows its height, so the
 * welcome-back reminder stands above it and never on it (globals.css).
 */
export function BuyBar({ product, qty, on }: BuyBarProps) {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bar.current;
    if (!on || !el) return;
    const root = document.documentElement;
    const tell = () => root.style.setProperty(HEIGHT, `${el.offsetHeight}px`);
    tell();
    const sized = new ResizeObserver(tell);
    sized.observe(el);
    return () => {
      sized.disconnect();
      root.style.removeProperty(HEIGHT);
    };
  }, [on]);

  return (
    <div
      ref={bar}
      aria-hidden={!on}
      inert={!on}
      data-buy-bar={on}
      className={clsx(
        "fixed inset-x-0 bottom-0 z-30 border-line border-t bg-paper px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgb(1_21_36/0.08)] transition-transform duration-300",
        on ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="mx-auto grid max-w-[60rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="min-w-0 max-sm:self-end">
          <p
            data-buy-bar-name
            className="text-[1.0625rem] leading-tight font-bold text-balance"
          >
            {product.name}
            {product.kind === "sticks" && (
              <span className="sm:hidden">, {product.sticks}</span>
            )}
          </p>
          <p className="t-small text-ink-2 max-sm:hidden">{product.subtitle}</p>
        </div>
        <p
          data-buy-bar-price
          className="t-price text-[1.0625rem] font-bold max-sm:col-start-1 max-sm:row-start-2 max-sm:self-start sm:text-[1.125rem]"
        >
          <DealFigure price={product.price} qty={qty} />
        </p>
        <div className="max-sm:col-start-2 max-sm:row-span-2 max-sm:row-start-1">
          <BuyBlock product={product} qty={qty} />
        </div>
      </div>
    </div>
  );
}
