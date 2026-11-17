"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Close } from "@/components/ui/icons";
import { getProduct, isPriced } from "@/data/products";
import { useCart } from "@/lib/cart/cart-context";
import { formatPrice } from "@/lib/cart/cart-math";
import { noteBought, startVisit, useShopper } from "@/lib/cart/shopper";
import { type Welcome, welcomeFor } from "@/lib/cart/shopper-logic";

const SHOWN = "alas-welcome-shown";
const SHOW_AFTER_MS = 1400;
const HIDE_AFTER_MS = 14_000;

const priced = (handle: string) => {
  const product = getProduct(handle);
  return Boolean(product && isPriced(product));
};

/**
 * Counts visits and, on a return visit, offers the one shortcut that fits: the
 * waiting cart, or the product they bought or looked at. Once per visit,
 * quietly, bottom right.
 */
export function WelcomeBack() {
  const cart = useCart();
  const memory = useShopper();
  const [welcome, setWelcome] = useState<Welcome | null>(null);
  const live = useRef({ memory, count: cart.count });
  live.current = { memory, count: cart.count };

  useEffect(() => {
    startVisit();
    const show = window.setTimeout(() => {
      try {
        if (window.sessionStorage.getItem(SHOWN)) return;
      } catch {
        return;
      }
      const next = welcomeFor(live.current.memory, live.current.count, priced);
      if (!next || next.kind === "chapter") return;
      window.sessionStorage.setItem(SHOWN, "1");
      setWelcome(next);
    }, SHOW_AFTER_MS);
    return () => window.clearTimeout(show);
  }, []);

  useEffect(() => {
    if (!welcome) return;
    const hide = window.setTimeout(() => setWelcome(null), HIDE_AFTER_MS);
    return () => window.clearTimeout(hide);
  }, [welcome]);

  if (!welcome || welcome.kind === "chapter") return null;
  const product =
    welcome.kind === "cart" ? undefined : getProduct(welcome.handle);

  let heading = "";
  let detail = "";
  let action = null;
  if (welcome.kind === "cart") {
    heading = "Your cart is waiting";
    detail = `${cart.count} ${cart.count === 1 ? "item" : "items"} · ${formatPrice(cart.subtotal)}`;
    action = (
      <Button
        size="sm"
        href={cart.checkoutUrl}
        onClick={() => noteBought(cart.lines.map((l) => l.handle))}
      >
        Checkout
      </Button>
    );
  } else if (product && isPriced(product)) {
    heading = welcome.kind === "again" ? "Buy it again" : "Still thinking?";
    const name =
      product.kind === "sticks"
        ? `${product.sticks} ${product.name}`
        : product.name;
    detail = `${name} · ${formatPrice(product.price)}`;
    action = (
      <Button
        size="sm"
        href={cart.buyNowUrl(product.handle)}
        onClick={() => noteBought([product.handle])}
      >
        Buy now
      </Button>
    );
  } else {
    return null;
  }

  return (
    <aside
      aria-label="Pick up where you left off"
      data-welcome={welcome.kind}
      className="welcome-back fixed right-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-3 z-30 flex animate-[pop-in_0.4s_var(--ease-out)] items-center gap-3 rounded-2xl border border-line bg-paper p-3 pl-5 shadow-[var(--shadow-pop)] sm:right-6 sm:bottom-6 sm:left-auto sm:w-[26rem]"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[1.0625rem] leading-tight font-bold">{heading}</p>
        <p className="t-small t-price truncate text-ink-2">
          {detail}
          {welcome.kind === "viewed" && product && (
            <>
              {" · "}
              <Link
                href={`/products/${product.handle}`}
                onClick={() => setWelcome(null)}
                className="link"
              >
                See it
              </Link>
            </>
          )}
        </p>
      </div>
      {action}
      <button
        type="button"
        onClick={() => setWelcome(null)}
        aria-label="Dismiss"
        className="grid size-10 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-mist"
      >
        <Close size={18} />
      </button>
    </aside>
  );
}
