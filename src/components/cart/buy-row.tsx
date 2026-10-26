"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/data/products";
import { useCart } from "@/lib/cart/cart-context";
import { PRICE_SOON, TERMS_LINE } from "@/lib/cart/catalogue";
import { AddButton, QtyStepper } from "./controls";
import { flyToCart } from "./fly-to-cart";

/** Sequential swap: the outgoing line leaves fast, then the incoming one arrives. */
const swapTiming = (show: boolean) => ({
  transitionDuration: show ? "0.45s" : "0.22s",
  transitionDelay: show ? "0.22s" : "0s",
  transitionTimingFunction: show
    ? "cubic-bezier(0.22, 1, 0.36, 1)"
    : "cubic-bezier(0.55, 0, 1, 0.45)",
});

type BuyRowProps = {
  product: Product;
  qty: number;
  onQty: (qty: number) => void;
  /** The image that flies to the cart. */
  source: () => HTMLElement | null;
  /** Called once the item lands in the cart. */
  onAdded?: () => void;
  className?: string;
};

/**
 * Quantity, Add to cart, and one quiet line beneath: the terms by default,
 * then for a few seconds after adding, what just went in.
 */
export function BuyRow({
  product,
  qty,
  onQty,
  source,
  onAdded,
  className,
}: BuyRowProps) {
  const cart = useCart();
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (product.price === null) {
    return (
      <div className={className}>
        <AddButton
          onAdd={() => {}}
          disabled
          label={PRICE_SOON}
          className="w-full"
          ariaLabel={`${product.name}: new price soon`}
        />
        <p className="mt-4 min-h-[2.8em] text-[13px] text-ink-3 leading-snug">
          This size returns with its new price soon. {TERMS_LINE}
        </p>
      </div>
    );
  }
  const price = product.price;

  const buy = () => {
    const name =
      product.kind === "sticks"
        ? `${product.subtitle} ${product.name}`
        : product.name;
    flyToCart(source(), () => {
      cart.add(product.handle, { qty });
      onAdded?.();
    });
    setNotice(`${qty > 1 ? `${qty} × ` : ""}${name} added to your cart.`);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), 4200);
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <QtyStepper value={qty} onChange={onQty} />
        <AddButton
          onAdd={buy}
          price={price * qty}
          className="min-w-0 flex-1"
          ariaLabel={`Add ${product.name} to cart`}
        />
      </div>
      <p className="relative mt-4 min-h-[2.8em] text-[13px] leading-snug">
        <span
          className={clsx(
            "absolute inset-x-0 top-0 text-ink-3 transition-[opacity,transform]",
            notice ? "-translate-y-2 opacity-0" : "translate-y-0 opacity-100",
          )}
          style={swapTiming(!notice)}
        >
          {TERMS_LINE}
        </span>
        <span
          aria-live="polite"
          className={clsx(
            "absolute inset-x-0 top-0 text-ink transition-[opacity,transform]",
            notice ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
          )}
          style={swapTiming(Boolean(notice))}
        >
          {notice}
          {notice && (
            <button
              type="button"
              onClick={cart.open}
              className="ml-2 text-ink underline decoration-[var(--c-line-strong)] underline-offset-4 hover:decoration-ink"
            >
              View cart
            </button>
          )}
        </span>
      </p>
    </div>
  );
}
