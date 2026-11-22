"use client";

import Link from "next/link";
import { openGift } from "@/components/founding/store";
import { useMember } from "@/components/founding/use-member";
import { Button } from "@/components/ui/button";
import { Check, Lock } from "@/components/ui/icons";
import { discounted } from "@/data/campaign";
import { presaleLine } from "@/data/presale";
import { type CartLine, useCart } from "@/lib/cart/cart-context";
import { formatPrice } from "@/lib/cart/cart-math";
import { TERMS_LINE } from "@/lib/cart/catalogue";
import { named } from "./by-email";

/**
 * The parts of the cart's foot. On a screen with room they all stand pinned
 * under the list. On a short screen only the total and the Checkout button
 * stay pinned; the rest scrolls with the list (see ./cart-drawer).
 */

/** A member's code, or the way to join. */
export function CodeLine({ toCheckout }: { toCheckout: number }) {
  const cart = useCart();
  const { offer, earned: step } = useMember();
  const earned = step.percent;
  const top = offer.top.percent;
  const toOffer = () => {
    cart.close();
    openGift("cart");
  };
  if (!cart.discount) {
    return (
      <p className="t-small text-ink">
        Founding Members save up to {top}%.{" "}
        <button type="button" className="link font-bold" onClick={toOffer}>
          Join
        </button>
      </p>
    );
  }
  return (
    <p className="t-small flex items-start gap-2 text-ink">
      <Check size={18} strokeWidth={2} className="mt-0.5 shrink-0 text-sea" />
      <span>
        {toCheckout > 0
          ? `Code ${cart.discount} is added for you at checkout.`
          : `Your ${earned}% off is already counted above.`}{" "}
        {earned < top && (
          <button type="button" className="link font-bold" onClick={toOffer}>
            Build it to {top}%
          </button>
        )}
      </span>
    </p>
  );
}

/** What the Checkout button carries, said when the cart holds more than that. */
export function ToCheckoutLine({ lines }: { lines: CartLine[] }) {
  return (
    <p data-to-checkout className="t-small mt-2 text-ink">
      Going to checkout now: {named(lines)}.
    </p>
  );
}

/**
 * What the total leaves out, with the way to the email step: above this line
 * in the cart, and in the cart when said in the quick shop.
 */
export function ByEmailLine({
  lines,
  inShop,
  onGo,
}: {
  lines: CartLine[];
  inShop: boolean;
  onGo: () => void;
}) {
  const several = lines.length > 1 || lines[0]?.qty > 1;
  return (
    <p data-by-email-note className="t-small mt-2 text-ink">
      Not in checkout: {named(lines)}.{" "}
      <button type="button" className="link font-bold" onClick={onGo}>
        {inShop ? "Leave your email in the cart" : "Leave your email above"}
      </button>{" "}
      to pre-order {several ? "them" : "it"}.
    </p>
  );
}

/** The total of what goes to checkout, and the button that goes there. */
export function Pay() {
  const cart = useCart();
  const { earned: step } = useMember();
  const earned = step.percent;
  return (
    <div data-cart-pay>
      {cart.discount ? (
        <dl className="grid gap-1.5">
          <div className="flex items-baseline justify-between">
            <dt>Subtotal</dt>
            <dd className="t-price">{formatPrice(cart.subtotal)}</dd>
          </div>
          <div className="flex items-baseline justify-between text-sea">
            <dt>Your {earned}% off</dt>
            <dd className="t-price">
              {"−"}
              {formatPrice(cart.subtotal - discounted(cart.subtotal, earned))}
            </dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="text-[1.125rem]">Total before tax</dt>
            <dd className="t-price text-[1.375rem] font-bold">
              {formatPrice(discounted(cart.subtotal, earned))}
            </dd>
          </div>
        </dl>
      ) : (
        <div className="flex items-baseline justify-between">
          <span className="text-[1.125rem]">Subtotal</span>
          <span className="t-price text-[1.375rem] font-bold">
            {formatPrice(cart.subtotal)}
          </span>
        </div>
      )}
      <Button size="lg" full arrow className="mt-4" href={cart.checkoutUrl}>
        Checkout
      </Button>
    </div>
  );
}

/** The quiet lines under the button: who runs checkout, the terms, the way back. */
export function SmallPrint({
  toCheckout,
  inShop,
}: {
  toCheckout: number;
  inShop: boolean;
}) {
  const cart = useCart();
  return (
    <>
      {toCheckout > 0 && (
        <>
          <p className="t-small mt-3 flex items-center justify-center gap-2 text-ink">
            <Lock size={16} className="text-sea" />
            Secure checkout by Shopify
          </p>
          <p className="t-fine mt-1.5 text-center text-ink-2">
            {presaleLine()} {TERMS_LINE}
          </p>
        </>
      )}
      {!inShop && (
        <p className="mt-2 text-center">
          <Link
            href="/#shop"
            onClick={cart.close}
            className="link t-small text-ink-2"
          >
            Keep shopping
          </Link>
        </p>
      )}
    </>
  );
}
