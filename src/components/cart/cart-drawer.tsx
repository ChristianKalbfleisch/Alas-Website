"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DealFigure, DealNote } from "@/components/campaign/deal";
import { EmailForm } from "@/components/founding/email-form";
import { subscribe } from "@/components/founding/signup";
import {
  earnedTier,
  joinGift,
  openGift,
  useGift,
} from "@/components/founding/store";
import { Button } from "@/components/ui/button";
import { Check, Close, Lock, Minus, Plus } from "@/components/ui/icons";
import { discounted } from "@/data/campaign";
import { GIFT_TOP } from "@/data/gift";
import { presaleLine } from "@/data/presale";
import {
  canOrder,
  getProduct,
  isPriced,
  type PricedProduct,
  type Product,
  products,
} from "@/data/products";
import { type CartLine, useCart } from "@/lib/cart/cart-context";
import { emailLines, formatPrice, linesTotal } from "@/lib/cart/cart-math";
import { suggestAddOns, TERMS_LINE } from "@/lib/cart/catalogue";
import { noteBought, useShopper } from "@/lib/cart/shopper";
import { rankForShop } from "@/lib/cart/shopper-logic";

function Thumb({ product }: { product: Product }) {
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

const fullName = (product: Product) =>
  product.kind === "sticks"
    ? `${product.name}, ${product.sticks}`
    : product.name;

/** Every product, one tap from checkout; what this visitor looked at comes first. */
function QuickShop() {
  const cart = useCart();
  const memory = useShopper();
  const goal = useGift().answers.goal;
  const ranked = rankForShop(
    products.map((p) => p.handle),
    memory,
    goal,
  )
    .map(getProduct)
    .filter((p): p is Product => Boolean(p));
  // The product a link asked for comes first, then everything with a price.
  const order = [
    ...ranked.filter((p) => p.handle === cart.focus),
    ...ranked.filter((p) => p.handle !== cart.focus && canOrder(p)),
    ...ranked.filter((p) => p.handle !== cart.focus && !canOrder(p)),
  ];

  return (
    <>
      <p className="border-line border-b pb-3">
        <DealNote source="quick-shop" />
      </p>
      <ul className="grid">
        {order.map((product) => (
          <li
            key={product.handle}
            data-quick-item={product.handle}
            className="flex items-center gap-4 border-line border-b py-4"
          >
            <Thumb product={product} />
            <div className="min-w-0 flex-1">
              <p className="text-[1.0625rem] leading-tight font-bold">
                {fullName(product)}
              </p>
              <p className="t-small t-price mt-0.5 text-ink-2">
                {product.price !== null && (
                  <DealFigure price={product.price} struck />
                )}
                {product.kind === "salt" && " · 390 g"}
                {product.kind === "sticks" && " · 2.5 g each"}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {canOrder(product) ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => cart.add(product.handle)}
                      aria-label={`Add ${fullName(product)} to cart`}
                    >
                      Add
                    </Button>
                    {isPriced(product) ? (
                      <Button
                        size="sm"
                        tone="outline"
                        href={cart.buyNowUrl(product.handle)}
                        onClick={() => noteBought([product.handle])}
                        aria-label={`Pre-order ${fullName(product)} now, straight to checkout`}
                      >
                        Pre-order now
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        tone="outline"
                        onClick={() => {
                          cart.add(product.handle);
                          cart.open();
                        }}
                        aria-label={`Pre-order ${fullName(product)} now`}
                      >
                        Pre-order now
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    size="sm"
                    tone="outline"
                    href={`/products/${product.handle}`}
                    onClick={cart.close}
                  >
                    See it
                  </Button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function Lines() {
  const cart = useCart();
  return (
    <ul className="grid">
      {cart.lines.map((line) => {
        const product = getProduct(line.handle);
        if (!product || !canOrder(product)) return null;
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
                  {fullName(product)}
                </p>
                <p className="t-price text-[1.0625rem]">
                  {formatPrice(product.price * line.qty)}
                </p>
              </div>
              {!isPriced(product) && (
                <p className="t-small mt-0.5 text-ink-2">
                  Pre-ordered by email, no payment now
                </p>
              )}
              <div className="mt-2.5 flex items-center justify-between">
                <div className="flex items-center rounded-full border border-line">
                  <button
                    type="button"
                    onClick={() =>
                      cart.setQty(line.handle, line.flavour, line.qty - 1)
                    }
                    aria-label={`One fewer ${fullName(product)}`}
                    className="grid size-10 place-items-center rounded-full hover:bg-mist"
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
                    onClick={() =>
                      cart.setQty(line.handle, line.flavour, line.qty + 1)
                    }
                    aria-label={`One more ${fullName(product)}`}
                    className="grid size-10 place-items-center rounded-full hover:bg-mist"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => cart.remove(line.handle, line.flavour)}
                  className="link t-small text-ink-2"
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

function AddOns() {
  const cart = useCart();
  const adds = suggestAddOns(cart.lines).filter(
    (
      offer,
    ): offer is {
      kind: "add";
      product: PricedProduct;
      title: string;
      detail: string;
    } => offer.kind === "add",
  );
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

const named = (lines: CartLine[]) =>
  lines
    .map((line) => {
      const product = getProduct(line.handle);
      if (!product) return "";
      return line.qty > 1
        ? `${fullName(product)} \u00d7 ${line.qty}`
        : fullName(product);
    })
    .filter(Boolean)
    .join(", ");

type Placed = { what: string; email: string };

/**
 * What the store's checkout cannot charge for yet is pre-ordered here, with an
 * email and no payment. Each product is noted against the address (the form's
 * source is "preorder-" and the product's name), the visitor becomes a
 * Founding Member like anyone who pre-orders, and the lines leave the cart.
 */
function ByEmail({
  lines,
  onPlaced,
}: {
  lines: CartLine[];
  onPlaced: (placed: Placed) => void;
}) {
  const cart = useCart();
  const gift = useGift();
  const earned = earnedTier(gift).percent;
  const known = useShopper().email ?? "";
  const total = linesTotal(lines);
  const what = named(lines);
  const several = lines.length > 1 || lines[0].qty > 1;
  return (
    <div
      id="cart-by-email"
      data-by-email
      className="mt-5 scroll-mt-4 rounded-2xl bg-mist p-4"
    >
      <p className="text-[1.0625rem] leading-tight font-bold">
        Pre-order by email: {what}
      </p>
      <p className="t-small mt-1.5 text-ink">
        {several ? "These are" : "This is"} not in checkout yet. Leave your
        email: nothing is charged now, and we send you the link to pay before{" "}
        {several ? "they ship" : "it ships"}.{" "}
        <span className="t-price whitespace-nowrap">
          To pay then:{" "}
          {formatPrice(gift.joined ? discounted(total, earned) : total)}
          {gift.joined && ` with your ${earned}% off`}
        </span>
      </p>
      <EmailForm
        key={what}
        className="mt-3"
        source={`preorder-${lines[0].handle}`}
        label="Pre-order"
        initial={known}
        onDone={(email) => {
          for (const line of lines.slice(1)) {
            void subscribe(email, `preorder-${line.handle}`, {
              answers: gift.answers,
            });
          }
          joinGift();
          for (const line of lines) cart.remove(line.handle, line.flavour);
          onPlaced({ what, email });
        }}
      />
    </div>
  );
}

function PlacedNote({ placed }: { placed: Placed }) {
  const note = useRef<HTMLParagraphElement>(null);
  // The cart may be scrolled down to the email step: bring the note into view.
  useEffect(() => {
    note.current?.scrollIntoView({ block: "nearest" });
  }, []);
  return (
    <p
      ref={note}
      data-placed
      className="t-body flex scroll-mt-4 items-start gap-2.5 rounded-2xl bg-mist p-4"
    >
      <Check size={22} strokeWidth={2} className="mt-0.5 shrink-0 text-sea" />
      <span>
        Pre-order placed: {placed.what}. Nothing is charged now. We will email{" "}
        {placed.email} the link to pay before it ships.
      </span>
    </p>
  );
}

/**
 * The cart, in a sheet from the right. It has two views: the cart itself, and
 * the quick shop that the Shop buttons open.
 */
export function CartDrawer() {
  const cart = useCart();
  const earned = earnedTier(useGift()).percent;
  const dialog = useRef<HTMLDialogElement>(null);
  const openedAt = useRef(0);
  const shop = cart.view === "shop";
  const empty = cart.lines.length === 0;
  const byEmail = emailLines(cart.lines);
  const toCheckout = cart.lines.length - byEmail.length;
  const [placed, setPlaced] = useState<Placed | null>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (cart.isOpen && !d.open) {
      openedAt.current = performance.now();
      d.showModal();
    }
    if (!cart.isOpen && d.open) d.close();
    // The note that a pre-order was placed is read once, then put away.
    if (!cart.isOpen) setPlaced(null);
  }, [cart.isOpen]);

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

        <div className="flex-1 overflow-y-auto px-5 pb-6 sm:px-7">
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
              <Lines />
              {byEmail.length > 0 && (
                <ByEmail lines={byEmail} onPlaced={setPlaced} />
              )}
              <AddOns />
            </>
          )}
        </div>

        {!empty && (
          <footer className="border-line border-t px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-7">
            {cart.discount ? (
              <p className="t-small flex items-start gap-2 text-ink">
                <Check
                  size={18}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0 text-sea"
                />
                <span>
                  Code {cart.discount} is added for you at checkout.{" "}
                  {earned < GIFT_TOP.percent && (
                    <button
                      type="button"
                      className="link font-bold"
                      onClick={() => {
                        cart.close();
                        openGift("cart");
                      }}
                    >
                      Build it to {GIFT_TOP.percent}%
                    </button>
                  )}
                </span>
              </p>
            ) : (
              <p className="t-small text-ink">
                Founding Members save up to {GIFT_TOP.percent}%.{" "}
                <button
                  type="button"
                  className="link font-bold"
                  onClick={() => {
                    cart.close();
                    openGift("cart");
                  }}
                >
                  Join
                </button>
              </p>
            )}
            {byEmail.length > 0 && (
              <p data-by-email-note className="t-small mt-2 text-ink">
                {toCheckout > 0 ? "Not in this total: " : ""}
                {named(byEmail)},{" "}
                <button
                  type="button"
                  className="link font-bold"
                  onClick={() =>
                    document
                      .getElementById("cart-by-email")
                      ?.scrollIntoView({ block: "center", behavior: "smooth" })
                  }
                >
                  pre-ordered by email above
                </button>
                .
              </p>
            )}
            {toCheckout > 0 && (
              <>
                {cart.discount ? (
                  <dl className="mt-3 grid gap-1.5">
                    <div className="flex items-baseline justify-between">
                      <dt>Subtotal</dt>
                      <dd className="t-price">{formatPrice(cart.subtotal)}</dd>
                    </div>
                    <div className="flex items-baseline justify-between text-sea">
                      <dt>Your {earned}% off</dt>
                      <dd className="t-price">
                        {"\u2212"}
                        {formatPrice(
                          cart.subtotal - discounted(cart.subtotal, earned),
                        )}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <dt className="text-[1.125rem]">Total at checkout</dt>
                      <dd className="t-price text-[1.375rem] font-bold">
                        {formatPrice(discounted(cart.subtotal, earned))}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-[1.125rem]">Subtotal</span>
                    <span className="t-price text-[1.375rem] font-bold">
                      {formatPrice(cart.subtotal)}
                    </span>
                  </div>
                )}
                <Button
                  size="lg"
                  full
                  arrow
                  className="mt-4"
                  href={cart.checkoutUrl}
                  onClick={() => noteBought(cart.lines.map((l) => l.handle))}
                >
                  Checkout
                </Button>
                <p className="t-small mt-3 flex items-center justify-center gap-2 text-ink">
                  <Lock size={16} className="text-sea" />
                  Secure checkout by Shopify
                </p>
                <p className="t-fine mt-1.5 text-center text-ink-2">
                  {presaleLine()} {TERMS_LINE}
                </p>
              </>
            )}
            {shop ? null : (
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
          </footer>
        )}
      </div>
    </dialog>
  );
}
