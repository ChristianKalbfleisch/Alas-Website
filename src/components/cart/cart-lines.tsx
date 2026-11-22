"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "@/components/ui/icons";
import {
  canOrder,
  exactProduct,
  isPriced,
  type Product,
} from "@/data/products";
import { useCart } from "@/lib/cart/cart-context";
import { formatPrice, priceTimes } from "@/lib/cart/cart-math";
import { suggestAddOns } from "@/lib/cart/catalogue";
import { lineName } from "@/lib/signup/preorder";

export function Thumb({ product }: { product: Product }) {
  return (
    <span className="stage size-20 shrink-0 rounded-xl">
      <Image
        src={product.images[0].thumb}
        alt=""
        width={160}
        height={160}
        unoptimized
        className="p-1.5"
      />
    </span>
  );
}

const STEP =
  "grid size-10 place-items-center rounded-full hover:bg-mist disabled:opacity-40 disabled:hover:bg-transparent";

/**
 * The cart's lines. While a pre-order by email is on its way, the lines being
 * pre-ordered cannot be changed or removed (`held`): what the server confirms
 * is what was sent.
 */
export function Lines({ held }: { held: boolean }) {
  const cart = useCart();
  return (
    <ul className="grid">
      {cart.lines.map((line) => {
        const product = exactProduct(line.handle);
        if (!product || !canOrder(product)) return null;
        const byEmail = !isPriced(product);
        const locked = held && byEmail;
        return (
          <li
            key={line.handle}
            data-cart-line={line.handle}
            className="flex items-center gap-4 border-line border-b py-4"
          >
            <Thumb product={product} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[1.0625rem] leading-tight font-bold">
                  {lineName(product)}
                </p>
                <p className="t-price text-[1.0625rem]">
                  {formatPrice(priceTimes(product.price, line.qty))}
                </p>
              </div>
              {byEmail && (
                <p className="t-small mt-0.5 text-ink-2">
                  Pre-order by email, no payment now
                </p>
              )}
              <div className="mt-2.5 flex items-center justify-between">
                <div className="flex items-center rounded-full border border-line">
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() =>
                      cart.setQty(line.handle, line.flavour, line.qty - 1)
                    }
                    aria-label={`One fewer ${lineName(product)}`}
                    className={STEP}
                  >
                    <Minus size={16} />
                  </button>
                  <span
                    aria-live="polite"
                    className="t-price min-w-7 text-center text-[1.0625rem]"
                  >
                    {line.qty}
                  </span>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() =>
                      cart.setQty(line.handle, line.flavour, line.qty + 1)
                    }
                    aria-label={`One more ${lineName(product)}`}
                    className={STEP}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => cart.remove(line.handle, line.flavour)}
                  className="link t-small text-ink-2 disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function AddOns() {
  const cart = useCart();
  const adds = suggestAddOns(cart.lines);
  if (!adds.length) return null;
  return (
    <ul className="mt-5 grid gap-3">
      {adds.map((offer) => (
        <li
          key={offer.product.handle}
          className="flex items-center gap-4 rounded-2xl bg-mist p-3"
        >
          <Thumb product={offer.product} />
          <div className="min-w-0 flex-1">
            <p className="text-[1.0625rem] leading-tight font-bold">
              {offer.title}
            </p>
            <p className="t-small text-ink-2">{offer.detail}</p>
          </div>
          <Button
            size="sm"
            tone="outline"
            onClick={() => cart.add(offer.product.handle)}
            aria-label={`${offer.title} for ${formatPrice(offer.product.price)}`}
          >
            + {formatPrice(offer.product.price)}
          </Button>
        </li>
      ))}
    </ul>
  );
}
