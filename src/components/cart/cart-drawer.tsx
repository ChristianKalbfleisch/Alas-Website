"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { art } from "@/data/art";
import { grainsFor, POINTS } from "@/data/points";
import { getProduct } from "@/data/products";
import { RITUAL } from "@/data/ritual";
import { useCart } from "@/lib/cart/cart-context";
import {
  type CartLine,
  checkoutItems,
  formatPrice,
} from "@/lib/cart/cart-math";
import {
  type AddOn,
  sizeLabel,
  suggestAddOns,
  TERMS_LINE,
} from "@/lib/cart/catalogue";
import { EASE, gsap, prefersReducedMotion, useGSAP } from "@/lib/motion/gsap";
import { scrollToTarget, useLenis } from "@/lib/motion/smooth-scroll";
import "./commerce.css";
import { AddButton, QtyStepper, TweenPrice } from "./controls";
import { PouchStack, ProductThumb } from "./product-thumb";
import { RitualCta } from "./ritual-cta";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** The liquid glass cart: a sheet from the right, a bottom sheet on phones. */
export function CartDrawer() {
  const cart = useCart();
  const { isOpen, close, lines } = cart;
  const lenis = useLenis();
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  // Close when the route changes (e.g. a line's product link was followed).
  // biome-ignore lint/correctness/useExhaustiveDependencies: run on route change only
  useEffect(() => {
    close();
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      setVisible(true);
    }
  }, [isOpen]);

  // Freeze the page behind the sheet.
  useEffect(() => {
    if (!isOpen) return;
    const html = document.documentElement;
    const before = html.style.overflow;
    if (lenis) lenis.stop();
    else html.style.overflow = "hidden";
    return () => {
      if (lenis) lenis.start();
      else html.style.overflow = before;
    };
  }, [isOpen, lenis]);

  useGSAP(
    () => {
      const sheet = panel.current;
      const veil = overlay.current;
      if (!sheet || !veil || !visible) return;
      const phone = window.matchMedia("(max-width: 639px)").matches;
      const off = phone
        ? { yPercent: 104, xPercent: 0 }
        : { xPercent: 108, yPercent: 0 };
      const reduced = prefersReducedMotion();

      if (isOpen) {
        const tl = gsap.timeline();
        tl.fromTo(
          veil,
          { opacity: 0 },
          { opacity: 1, duration: reduced ? 0 : 0.5, ease: "power2.out" },
          0,
        );
        tl.fromTo(
          sheet,
          { ...off, opacity: 1 },
          {
            xPercent: 0,
            yPercent: 0,
            duration: reduced ? 0 : 0.9,
            ease: EASE.out,
          },
          0,
        );
        const items = sheet.querySelectorAll("[data-stagger]");
        if (items.length && !reduced) {
          tl.fromTo(
            items,
            { y: 18, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: EASE.out, stagger: 0.05 },
            0.18,
          );
        }
        closeButton.current?.focus({ preventScroll: true });
        return;
      }

      const tl = gsap.timeline({
        onComplete: () => {
          setVisible(false);
          // The opener may have re-rendered while the sheet was open; fall back to the cart button.
          const back =
            returnFocus.current?.isConnected &&
            returnFocus.current !== document.body
              ? returnFocus.current
              : document.querySelector<HTMLElement>(
                  '[data-cart-target], header button[aria-label^="Cart"]',
                );
          back?.focus?.({ preventScroll: true });
        },
      });
      tl.to(
        sheet,
        { ...off, duration: reduced ? 0 : 0.5, ease: "power3.in" },
        0,
      );
      tl.to(
        veil,
        { opacity: 0, duration: reduced ? 0 : 0.45, ease: "power2.in" },
        0.05,
      );
    },
    { dependencies: [isOpen, visible] },
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== "Tab" || !panel.current) return;
    const nodes = [
      ...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE),
    ].filter((n) => n.offsetParent !== null);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const count = cart.count;
  return (
    <div
      ref={root}
      className="fixed inset-0 z-[var(--z-drawer)]"
      style={{ visibility: visible ? "visible" : "hidden" }}
      inert={!isOpen}
    >
      <div
        ref={overlay}
        aria-hidden
        onClick={close}
        className="absolute inset-0 bg-[rgb(18_49_77_/_0.2)] opacity-0 backdrop-blur-[3px]"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        onKeyDown={onKeyDown}
        className={clsx(
          "cm-sheet",
          "absolute flex flex-col overflow-hidden rounded-[28px] text-ink",
          "inset-x-2 bottom-2 max-h-[88dvh]",
          "sm:inset-x-auto sm:top-3 sm:right-3 sm:bottom-3 sm:max-h-none sm:w-[min(460px,calc(100vw-1.5rem))]",
        )}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-[var(--c-line-strong)] sm:hidden" />
        <header className="relative flex shrink-0 items-start justify-between gap-4 px-6 pt-4 pb-5 sm:px-7 sm:pt-6">
          <div>
            <p className="eyebrow">
              / Cart{" "}
              <span className="text-ink-3">
                · {count} {count === 1 ? "item" : "items"}
              </span>
            </p>
            <h2
              id="cart-title"
              className="font-display mt-2 text-[2.1rem] leading-none!"
            >
              Your cart
            </h2>
          </div>
          <button
            ref={closeButton}
            type="button"
            onClick={close}
            aria-label="Close cart"
            className="glass grid size-11 shrink-0 place-items-center rounded-full text-ink transition-transform duration-500 ease-[var(--ease-out)] hover:rotate-90"
          >
            <svg viewBox="0 0 14 14" className="size-3.5" aria-hidden>
              <path
                d="M2.5 2.5l9 9M11.5 2.5l-9 9"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        {lines.length > 0 ? <FilledCart /> : <EmptyCart />}
      </div>
    </div>
  );
}

function FilledCart() {
  const cart = useCart();
  const addOns = suggestAddOns(cart.lines);
  return (
    <>
      <div
        data-lenis-prevent
        className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 sm:px-7"
      >
        <ul>
          {cart.lines.map((line) => (
            <LineItem
              key={`${line.handle}-${line.flavour ?? ""}`}
              line={line}
            />
          ))}
        </ul>
        {addOns.map((addOn) =>
          addOn.kind === "ritual" ? (
            <RitualOffer key="ritual" addOn={addOn} />
          ) : (
            <AddOnOffer key={addOn.product.handle} addOn={addOn} />
          ),
        )}
      </div>
      <footer
        className="relative shrink-0 border-[var(--c-line)] border-t px-6 pt-5 pb-6 sm:px-7"
        data-stagger
      >
        <dl className="space-y-1.5 text-[14px]">
          <div className="flex items-baseline justify-between">
            <dt className="eyebrow">/ Subtotal</dt>
            <dd>
              <TweenPrice
                value={cart.subtotal}
                className="font-mono text-[17px] text-ink"
              />
            </dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="eyebrow">
              <Link
                href="/account"
                className="underline decoration-[var(--c-line-strong)] underline-offset-4 hover:decoration-ink"
              >
                / {POINTS.many}
              </Link>
            </dt>
            <dd className="font-mono text-[12px] text-ink-2">
              +{grainsFor(cart.subtotal)}
              {POINTS.live ? "" : " · opening soon"}
            </dd>
          </div>
        </dl>
        <a
          href={cart.checkoutUrl}
          className="group relative mt-5 flex h-14 items-center justify-between overflow-hidden rounded-full bg-ink pr-2 pl-7 font-medium text-[0.75rem] text-white uppercase tracking-[0.16em] shadow-[0_14px_34px_-10px_rgb(18_49_77_/_0.55)] transition-[background-color,transform] duration-500 ease-[var(--ease-out)] hover:bg-[#0c2238] active:scale-[0.98]"
        >
          Checkout
          <span className="flex items-center gap-3">
            <span className="font-mono text-[0.8rem] normal-case tracking-[0.02em]">
              {formatPrice(cart.subtotal)}
            </span>
            <span className="grid size-10 place-items-center rounded-full bg-white text-ink">
              <svg
                viewBox="0 0 16 16"
                className="size-3.5 transition-transform duration-500 ease-[var(--ease-out)] group-hover:translate-x-0.5"
                aria-hidden
              >
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </span>
          </span>
        </a>
        <p className="mt-3 text-center text-[12px] text-ink-3 leading-snug">
          {TERMS_LINE}
        </p>
      </footer>
    </>
  );
}

function LineItem({ line }: { line: CartLine }) {
  const cart = useCart();
  const row = useRef<HTMLLIElement>(null);
  const product = getProduct(line.handle);
  const leaving = useRef(false);

  const remove = useCallback(() => {
    const el = row.current;
    if (!el || leaving.current) return;
    leaving.current = true;
    if (prefersReducedMotion()) {
      cart.remove(line.handle, line.flavour);
      return;
    }
    gsap.to(el, {
      height: 0,
      opacity: 0,
      paddingTop: 0,
      paddingBottom: 0,
      duration: 0.5,
      ease: "power3.inOut",
      onComplete: () => cart.remove(line.handle, line.flavour),
    });
  }, [cart, line.handle, line.flavour]);

  if (!product) return null;
  const detail = [
    product.kind === "box" ? product.subtitle : sizeLabel(product),
    line.flavour,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <li
      ref={row}
      data-stagger
      className="flex gap-4 overflow-hidden border-[var(--c-line)] border-t py-5 first:border-t-0"
    >
      <Link
        href={`/products/${product.handle}`}
        className="relative block size-[88px] shrink-0 overflow-hidden rounded-[16px] bg-lime"
        aria-label={`${product.name}, details`}
      >
        <ProductThumb product={product} sizes="88px" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-[1.35rem] leading-[1.05]!">
              {product.name}
            </p>
            <p className="mt-1.5 truncate font-mono text-[10.5px] text-ink-3 uppercase tracking-[0.08em]">
              {detail}
            </p>
          </div>
          <TweenPrice
            value={(product.price ?? 0) * line.qty}
            className="shrink-0 pt-0.5 font-mono text-[13px] text-ink"
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <QtyStepper
            size="sm"
            value={line.qty}
            label={`${product.name} quantity`}
            onChange={(qty) => cart.setQty(line.handle, line.flavour, qty)}
          />
          <button
            type="button"
            onClick={remove}
            className="font-mono text-[10.5px] text-ink-2 uppercase tracking-[0.08em] underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}

/** A quiet add-on: sticks for a pouch, or a first pouch for sticks. */
function AddOnOffer({ addOn }: { addOn: Extract<AddOn, { kind: "add" }> }) {
  const cart = useCart();
  const { product } = addOn;
  return (
    <div
      data-stagger
      className="mt-1 mb-4 flex items-center gap-3.5 rounded-[20px] bg-white/65 p-3 shadow-[inset_0_0_0_1px_var(--c-line),0_8px_24px_-14px_rgb(18_49_77_/_0.3)]"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-[14px] bg-lime">
        <ProductThumb product={product} sizes="64px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] text-ink-3 uppercase tracking-[0.08em]">
          / Pairs well
        </p>
        <p className="mt-1 text-[14px] text-ink leading-tight">{addOn.title}</p>
        <p className="mt-0.5 text-[12.5px] text-ink-2 leading-snug">
          {addOn.detail}
        </p>
      </div>
      <button
        type="button"
        onClick={() => cart.add(product.handle, { qty: 1 })}
        aria-label={`${addOn.title}, costs ${formatPrice(product.price)}`}
        className="h-10 shrink-0 rounded-full bg-ink px-4 font-mono text-[11.5px] text-white tracking-[0.02em] shadow-[0_8px_20px_-8px_rgb(18_49_77_/_0.6)] transition-[background-color,transform] duration-500 ease-[var(--ease-out)] hover:bg-[#0c2238] active:scale-95"
      >
        +{formatPrice(product.price)}
      </button>
    </div>
  );
}

/** The subscription, offered to carts with a pouch: two pouches every month instead. */
function RitualOffer({ addOn }: { addOn: Extract<AddOn, { kind: "ritual" }> }) {
  const cart = useCart();
  // Once live, the rest of the cart (everything but the pouches) goes along to checkout.
  const extra = checkoutItems(
    cart.lines.filter((l) => getProduct(l.handle)?.kind !== "salt"),
  );
  return (
    <div
      data-stagger
      className="mt-1 mb-4 rounded-[20px] bg-white/65 p-3 shadow-[inset_0_0_0_1px_var(--c-line),0_8px_24px_-14px_rgb(18_49_77_/_0.3)]"
    >
      <div className="flex items-center gap-3.5">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-[14px] bg-lime">
          <PouchStack
            count={RITUAL.pouches}
            sizes="64px"
            className="origin-[50%_88%] scale-[0.72]"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] text-ink-3 uppercase tracking-[0.08em]">
            / Every month
          </p>
          <p className="mt-1 text-[14px] text-ink leading-tight">
            {addOn.title}
          </p>
          <p className="mt-0.5 text-[12.5px] text-ink-2 leading-snug">
            {addOn.detail}
          </p>
        </div>
      </div>
      <RitualCta
        source="ritual-cart"
        size="md"
        extra={extra}
        className="mt-3"
      />
    </div>
  );
}

function EmptyCart() {
  const cart = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const bowl = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!bowl.current || prefersReducedMotion()) return;
      gsap.to(bowl.current, {
        y: -8,
        duration: 3.2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    },
    { scope: bowl },
  );

  const browse = () => {
    cart.close();
    if (pathname === "/") {
      setTimeout(() => scrollToTarget("#shop"), 350);
    } else {
      router.push("/#shop");
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 pt-2 pb-10 text-center">
      <div
        ref={bowl}
        className="relative aspect-square w-[min(220px,62%)] overflow-hidden rounded-[var(--r-md)] shadow-[0_18px_40px_rgb(18_49_77_/_0.12)]"
        data-stagger
      >
        <Image
          src={art.museum.bowl.src}
          alt={art.museum.bowl.alt}
          fill
          sizes="220px"
          className="object-cover object-[50%_62%]"
        />
      </div>
      <p className="font-display mt-4 text-[2rem] leading-none!" data-stagger>
        Empty, for now.
      </p>
      <p
        className="mt-3 max-w-[30ch] text-[15px] text-ink-2 leading-relaxed"
        data-stagger
      >
        Begin with Mikró: one pouch of Aegean salt for your morning water.
      </p>
      <div
        className="mt-7 flex w-full max-w-[320px] flex-col gap-3"
        data-stagger
      >
        <AddButton
          label="Add Mikró"
          price={getProduct("mikro")?.price ?? 0}
          onAdd={() => cart.add("mikro", { qty: 1 })}
        />
        <button
          type="button"
          onClick={browse}
          className="h-12 rounded-full font-medium text-[0.7rem] text-ink uppercase tracking-[0.16em] shadow-[inset_0_0_0_1px_var(--c-line-strong)] transition-colors duration-500 hover:bg-white/70"
        >
          See the whole range
        </button>
      </div>
    </div>
  );
}
