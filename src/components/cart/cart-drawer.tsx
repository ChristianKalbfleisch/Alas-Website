"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Close } from "@/components/ui/icons";
import { useCart } from "@/lib/cart/cart-context";
import { emailLines } from "@/lib/cart/cart-math";
import { usePlaced } from "@/lib/cart/placed";
import { ByEmail } from "./by-email";
import {
  ByEmailLine,
  CodeLine,
  Pay,
  SmallPrint,
  ToCheckoutLine,
} from "./cart-foot";
import { AddOns, Lines } from "./cart-lines";
import { PlacedNote } from "./placed-note";
import { QuickShop } from "./quick-shop";
import { useShortScreen } from "./use-short-screen";

/**
 * The cart, in a sheet from the right. It has two views: the cart itself, and
 * the quick shop that the Shop buttons open.
 *
 * Under the list stands the foot: a member's code or the way to join, what
 * goes to checkout now and what does not, the total with the Checkout button,
 * and the small print. On a screen with room it is all pinned. On a short
 * screen only the total and the button stay pinned and the rest scrolls with
 * the list, so the items and the email step have room; in the quick shop the
 * line about what is not in checkout stays pinned too, because it is the way
 * to the email step from there.
 */
export function CartDrawer() {
  const cart = useCart();
  const dialog = useRef<HTMLDialogElement>(null);
  const openedAt = useRef(0);
  const short = useShortScreen();
  const shop = cart.view === "shop";
  const empty = cart.lines.length === 0;
  // What the store's checkout cannot take stays here, to be pre-ordered by
  // email; everything else is what the Checkout link carries.
  const byEmail = emailLines(cart.lines);
  const forCheckout = cart.lines.filter((line) => !byEmail.includes(line));
  const toCheckout = forCheckout.length;
  // The last pre-order by email the store kept, until the visitor hides it.
  const placed = usePlaced();
  // True while a pre-order by email is on its way.
  const [sending, setSending] = useState(false);
  // Counts the times the email step was asked for, to bring it into view.
  const [sought, setSought] = useState(0);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (cart.isOpen && !d.open) {
      openedAt.current = performance.now();
      d.showModal();
    }
    if (!cart.isOpen && d.open) d.close();
  }, [cart.isOpen]);

  // After the cart view is drawn: the end of the email step, where its field
  // and its button are.
  useEffect(() => {
    if (!sought) return;
    document
      .getElementById("cart-by-email")
      ?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [sought]);

  const toEmailStep = () => {
    if (shop) cart.open();
    setSought((n) => n + 1);
  };

  const notes = (
    <>
      <CodeLine toCheckout={toCheckout} />
      {byEmail.length > 0 && toCheckout > 0 && (
        <ToCheckoutLine lines={forCheckout} />
      )}
    </>
  );
  const emailNote = byEmail.length > 0 && (
    <ByEmailLine lines={byEmail} inShop={shop} onGo={toEmailStep} />
  );
  const print = <SmallPrint toCheckout={toCheckout} inShop={shop} />;
  const pinsEmailNote = short && shop && byEmail.length > 0;
  const FOOT =
    "border-line border-t px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-7 [&>:first-child]:mt-0";

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Esc closes a modal dialog natively; this click only catches the backdrop
    <dialog
      ref={dialog}
      aria-label={shop ? "Shop" : "Your cart"}
      onClose={cart.close}
      onClick={(event) => {
        if (
          event.target === event.currentTarget &&
          performance.now() - openedAt.current > 500
        ) {
          cart.close();
        }
      }}
      className="m-0 ml-auto h-dvh max-h-none w-[min(30rem,100vw)] max-w-none bg-paper p-0 text-ink shadow-[var(--shadow-pop)] backdrop:bg-navy/50 open:animate-[sheet-in_0.35s_var(--ease-out)]"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-line border-b px-5 py-4 sm:px-7">
          <h2 className="text-[1.5rem] leading-none tracking-[-0.02em]">
            {shop ? "Shop" : "Your cart"}
          </h2>
          <div className="flex items-center gap-2">
            {shop && !empty && (
              <Button size="sm" tone="outline" onClick={cart.open}>
                Cart ({cart.count})
              </Button>
            )}
            <button
              type="button"
              onClick={cart.close}
              aria-label="Close"
              className="grid size-11 place-items-center rounded-full hover:bg-mist"
            >
              <Close size={22} />
            </button>
          </div>
        </header>

        <div
          data-cart-list
          className="flex-1 overflow-y-auto px-5 pb-6 sm:px-7"
        >
          {shop ? (
            <QuickShop />
          ) : empty ? (
            placed ? (
              <div className="py-8">
                <PlacedNote placed={placed} />
                <p className="mt-6 text-center">
                  <Button tone="outline" onClick={() => cart.openShop()}>
                    Keep shopping
                  </Button>
                </p>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="t-lead">Your cart is empty.</p>
                <Button className="mt-6" onClick={() => cart.openShop()}>
                  Shop now
                </Button>
              </div>
            )
          ) : (
            <>
              {placed && (
                <div className="pt-4">
                  <PlacedNote placed={placed} />
                </div>
              )}
              <Lines held={sending} />
              {byEmail.length > 0 && (
                <ByEmail lines={byEmail} busy={sending} onBusy={setSending} />
              )}
              <AddOns />
            </>
          )}
          {short && !empty && (
            <div
              data-cart-notes
              className="mt-6 border-line border-t pt-4 [&>:first-child]:mt-0"
            >
              {notes}
              {!shop && emailNote}
              {print}
            </div>
          )}
        </div>

        {!empty &&
          (short ? (
            (pinsEmailNote || toCheckout > 0) && (
              <footer className={FOOT}>
                {pinsEmailNote && emailNote}
                {toCheckout > 0 && (
                  <div className={pinsEmailNote ? "mt-3" : undefined}>
                    <Pay />
                  </div>
                )}
              </footer>
            )
          ) : (
            <footer className={FOOT}>
              {notes}
              {emailNote}
              {toCheckout > 0 && (
                <div className="mt-3">
                  <Pay />
                </div>
              )}
              {print}
            </footer>
          ))}
      </div>
    </dialog>
  );
}
