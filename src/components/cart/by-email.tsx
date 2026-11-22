"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { EmailForm } from "@/components/founding/email-form";
import {
  PREORDER_CONSENT,
  type PreorderOutcome,
  sendPreorder,
} from "@/components/founding/signup";
import { joinGift, openGift } from "@/components/founding/store";
import { useMember } from "@/components/founding/use-member";
import { Button } from "@/components/ui/button";
import { discounted } from "@/data/campaign";
import { CONTACT_EMAIL } from "@/data/faq";
import { exactProduct } from "@/data/products";
import { type CartLine, useCart } from "@/lib/cart/cart-context";
import { formatPrice, linesTotal } from "@/lib/cart/cart-math";
import { forgetRef, keepPlaced, refFor } from "@/lib/cart/placed";
import { useShopper } from "@/lib/cart/shopper";
import { listName } from "@/lib/signup/preorder";

/** "Lemon Pouch × 1, Lemon Sticks (pack of 5) × 2": every line with its quantity. */
export const named = (lines: CartLine[]) =>
  lines
    .map((line) => {
      const product = exactProduct(line.handle);
      return product ? `${listName(product)} × ${line.qty}` : "";
    })
    .filter(Boolean)
    .join(", ");

/** Why a pre-order was not confirmed. The lines stay in the cart in every case. */
type Failure = Exclude<PreorderOutcome["outcome"], "stored" | "invalid">;

const WRITE_TO = (
  <a href={`mailto:${CONTACT_EMAIL}`} className="link">
    {CONTACT_EMAIL}
  </a>
);

/** What the step says for each reason, and whether sending again can help. */
const SAID: Record<
  Failure,
  { title: string; body: ReactNode; action?: "retry" | "reload" }
> = {
  unsaved: {
    title: "Your pre-order was not saved.",
    body: (
      <>
        This preview is not connected to the store yet. To pre-order today,
        write to {WRITE_TO}.
      </>
    ),
  },
  limited: {
    title: "Your pre-order was not saved and nothing was sent.",
    body: "There were too many tries from this connection in a few minutes. Your items are still in your cart. Please wait a few minutes, then try again.",
    action: "retry",
  },
  stale: {
    title: "This page is out of date.",
    body: "Reload it; your cart is kept.",
    action: "reload",
  },
  full: {
    title: "We could not add this pre-order to your record.",
    body: <>Please write to {WRITE_TO}.</>,
  },
  error: {
    title: "We could not confirm your pre-order.",
    body: "Try again: it will not be counted twice.",
    action: "retry",
  },
};

/**
 * What the store's checkout cannot charge for yet is pre-ordered here, with an
 * email and no payment. The address and every line go to the server in one
 * request, under a reference that stays the same for every try, so a second
 * try is never a second pre-order. Only when the server says it kept the
 * pre-order do the quantities it confirmed leave the cart and the confirmation
 * appear, and the visitor becomes a Founding Member like anyone who
 * pre-orders. Otherwise the lines stay and the step says what happened.
 *
 * The figure to pay later is quoted with the percentage this visitor has
 * earned, joined or not: leaving the email here is what joining is. That
 * percentage and that figure are sent along; the pre-order keeps what the
 * server records, whatever the visitor earns afterwards, and the step says so
 * to anyone who could still earn more.
 *
 * While a pre-order is on its way the caller is told (`onBusy`), so the lines
 * being pre-ordered cannot be changed under it.
 */
export function ByEmail({
  lines,
  busy,
  onBusy,
}: {
  lines: CartLine[];
  busy: boolean;
  onBusy: (busy: boolean) => void;
}) {
  const cart = useCart();
  const { offer, gift, earned: step } = useMember();
  const earned = step.percent;
  const known = useShopper().email ?? "";
  const [failed, setFailed] = useState<Failure | null>(null);
  const alert = useRef<HTMLDivElement>(null);
  const formId = useId();
  const several = lines.length > 1 || lines[0].qty > 1;
  const toPay = discounted(linesTotal(lines), earned);
  const said = failed && SAID[failed];

  useEffect(() => {
    if (failed) alert.current?.scrollIntoView({ block: "nearest" });
  }, [failed]);

  async function place(email: string) {
    const sent = lines.map(({ handle, qty }) => ({ handle, qty }));
    onBusy(true);
    const result = await sendPreorder(email, {
      ref: refFor(sent),
      lines: sent,
      percent: earned,
      toPay,
      answers: gift.answers,
    });
    onBusy(false);
    if (result.outcome === "invalid") {
      // The form says what is wrong with the address.
      setFailed(null);
      return "invalid";
    }
    if (result.outcome !== "stored") {
      setFailed(result.outcome);
      return "failed";
    }
    setFailed(null);
    forgetRef();
    joinGift();
    // Only what the server confirmed leaves the cart; more of a product, put
    // in while this was on its way, stays.
    for (const line of result.order.lines) cart.take(line.handle, line.qty);
    keepPlaced({ order: result.order, email });
    return "ok";
  }

  return (
    <div
      id="cart-by-email"
      data-by-email
      className="mt-5 scroll-my-4 rounded-2xl bg-mist p-4"
    >
      <p className="text-[1.0625rem] leading-tight font-bold">
        Pre-order by email: {named(lines)}
      </p>
      <p className="t-small mt-1.5 text-ink">
        We cannot take payment for {several ? "these" : "this"} yet. Leave your
        email: nothing is charged now, and we send you the link to pay before{" "}
        {several ? "they ship" : "it ships"}.{" "}
        <span className="t-price whitespace-nowrap">
          To pay then: {formatPrice(toPay)}
        </span>{" "}
        {gift.joined
          ? `with your ${earned}% off.`
          : `with ${earned}% off as a Founding Member.`}
      </p>
      {earned < offer.top.percent && (
        <p data-price-set className="t-small mt-1.5 text-ink">
          This price is set when you place the pre-order. To pay less,{" "}
          <button
            type="button"
            className="link font-bold"
            onClick={() => {
              cart.close();
              openGift("cart");
            }}
          >
            build your discount first
          </button>
          .
        </p>
      )}
      {said && (
        <div
          ref={alert}
          role="alert"
          data-not-placed={failed}
          className="mt-3 scroll-mt-4 rounded-xl border border-error bg-paper p-3"
        >
          <p className="t-small font-bold text-error">{said.title}</p>
          <p className="t-small mt-1 text-ink">{said.body}</p>
          {said.action === "retry" && (
            // Sends the form as it stands: the address now in the field.
            <Button
              type="submit"
              form={formId}
              size="sm"
              className="mt-2.5"
              disabled={busy}
            >
              {busy ? "Sending…" : "Try again"}
            </Button>
          )}
          {said.action === "reload" && (
            <Button
              size="sm"
              className="mt-2.5"
              onClick={() => window.location.reload()}
            >
              Reload
            </Button>
          )}
        </div>
      )}
      <EmailForm
        // One form for these products: a typed address stays when a quantity changes.
        key={lines.map((line) => line.handle).join(",")}
        formId={formId}
        className="mt-3"
        label="Pre-order"
        initial={known}
        consent={PREORDER_CONSENT}
        send={place}
        onEdit={() => setFailed(null)}
      />
    </div>
  );
}
