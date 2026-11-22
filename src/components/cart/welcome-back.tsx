"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { DealFigure } from "@/components/campaign/deal";
import { useGift } from "@/components/founding/store";
import { Button } from "@/components/ui/button";
import { Close } from "@/components/ui/icons";
import { getProduct, isPriced } from "@/data/products";
import { useCart } from "@/lib/cart/cart-context";
import { startVisit, useShopper } from "@/lib/cart/shopper";
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
 * waiting cart, or the product they looked at. Once per visit, quietly, bottom
 * right. It never speaks of an order: the site cannot know one was placed. For
 * a waiting cart it gives the number of items and opens the cart, which says
 * what goes to checkout and what is pre-ordered by email. For a product it
 * names it with the price this visitor sees everywhere else, on as many lines
 * as that takes, with the way to its page always in view; its button goes to
 * checkout for a member and opens the cart for anyone else.
 */
export function WelcomeBack() {
  const cart = useCart();
  const memory = useShopper();
  const joined = useGift().joined;
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

  const dismiss = () => setWelcome(null);
  let heading = "";
  let detail: ReactNode = null;
  let action: ReactNode = null;
  if (welcome.kind === "cart") {
    heading = "Your cart is waiting";
    detail = `${cart.count} ${cart.count === 1 ? "item" : "items"}`;
    action = (
      <Button
        size="sm"
        onClick={() => {
          dismiss();
          cart.open();
        }}
      >
        Open cart
      </Button>
    );
  } else if (product && isPriced(product)) {
    heading = "Still thinking?";
    detail = (
      <>
        <span>
          {product.kind === "sticks"
            ? `${product.sticks} ${product.name}`
            : product.name}
        </span>{" "}
        <span className="whitespace-nowrap">
          <DealFigure price={product.price} struck />
        </span>
      </>
    );
    action = (
      <>
        {joined ? (
          <Button size="sm" href={cart.buyNowUrl(product.handle)}>
            Pre-order now
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => {
              dismiss();
              cart.openWith(product.handle);
            }}
          >
            Pre-order now
          </Button>
        )}
        <Link
          href={`/products/${product.handle}`}
          onClick={dismiss}
          className="link t-small inline-flex min-h-10 items-center text-ink"
        >
          See it
        </Link>
      </>
    );
  } else {
    return null;
  }

  return (
    <aside
      aria-label="Pick up where you left off"
      data-welcome={welcome.kind}
      className="welcome-back fixed right-3 left-3 z-30 grid animate-[pop-in_0.4s_var(--ease-out)] grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 rounded-2xl border border-line bg-paper p-3 pl-5 shadow-[var(--shadow-pop)] sm:right-6 sm:left-auto sm:w-[26rem]"
    >
      <div className="min-w-0 pt-1.5">
        <p className="text-[1.0625rem] leading-tight font-bold">{heading}</p>
        <p
          data-welcome-detail
          className="t-small t-price mt-0.5 flex flex-wrap gap-x-2 text-ink-2"
        >
          {detail}
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="grid size-10 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-mist"
      >
        <Close size={18} />
      </button>
      <div className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        {action}
      </div>
    </aside>
  );
}
