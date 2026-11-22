"use client";

import clsx from "clsx";
import { openGift } from "@/components/founding/store";
import { useMember } from "@/components/founding/use-member";
import { discounted } from "@/data/campaign";
import { rangeLine } from "@/data/offer-lines";
import { formatPrice, priceTimes } from "@/lib/cart/cart-math";

/**
 * How a price is shown, everywhere. A visitor who has not joined sees the
 * least a Founding Member pays, always marked "from", beside the regular
 * price; a member sees what they pay at the step they hold. Both follow the
 * offer in force. An amount is priced in whole cents before the percentage is
 * taken off, as the cart does it.
 */
function usePrice(price: number, qty: number) {
  const { offer, mine } = useMember();
  const regular = priceTimes(price, qty);
  return {
    offer,
    mine,
    regular,
    shown: discounted(regular, mine ?? offer.top.percent),
  };
}

/** The regular price, crossed out, and said aloud as what it is. */
function Regular({ price, className }: { price: number; className: string }) {
  return (
    <s className={className}>
      <span className="sr-only">Regular price </span>
      {formatPrice(price)}
    </s>
  );
}

type DealFigureProps = {
  /** The regular price of one, in dollars. */
  price: number;
  /** How many of it. */
  qty?: number;
  /**
   * For a narrow box: the word "from" shows only where the box has room for
   * it, and is always there for a screen reader. The box must be a container
   * (the class `@container`).
   */
  tight?: boolean;
  /** Add the regular price, struck through. */
  struck?: boolean;
  /** "white" where it stands on the navy. */
  tone?: "ink" | "white";
};

/**
 * The price in small, for a row in a list, a tile or a bar: the same figure
 * the large price shows, so one thing never carries two prices.
 */
export function DealFigure({
  price,
  qty = 1,
  tight,
  struck,
  tone = "ink",
}: DealFigureProps) {
  const { mine, regular, shown } = usePrice(price, qty);
  return (
    <>
      {mine === null && (
        <span
          className={tight ? "sr-only @min-[5.875rem]:not-sr-only" : undefined}
        >
          from{" "}
        </span>
      )}
      {formatPrice(shown)}
      {struck && (
        <>
          {" "}
          <Regular
            price={regular}
            className={tone === "white" ? "text-white/60" : "text-ink-3"}
          />
        </>
      )}
    </>
  );
}

/**
 * One quiet line under a price: for a visitor, the whole range Founding
 * Members get; for a member, what they already have. It opens the offer.
 */
export function DealNote({ source = "shop" }: { source?: string }) {
  const { offer, mine } = useMember();
  return (
    <button
      type="button"
      onClick={() => openGift(source)}
      className="link t-small text-left text-sea"
    >
      {mine === null
        ? rangeLine(offer)
        : mine < offer.top.percent
          ? `Your ${mine}% off. Build it to ${offer.top.percent}%`
          : `Your ${mine}% off, added at checkout`}
    </button>
  );
}

type DealPriceProps = {
  /** The regular price of one, in dollars. */
  price: number;
  /** How many of it. */
  qty?: number;
  size?: "md" | "lg";
  tone?: "ink" | "white";
};

/**
 * The regular price struck through, beside the least a Founding Member pays;
 * for a member, beside what they pay at the step they have reached.
 */
export function DealPrice({
  price,
  qty = 1,
  size = "md",
  tone = "ink",
}: DealPriceProps) {
  const { offer, mine, regular, shown } = usePrice(price, qty);
  return (
    <p className="t-price flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
      <span
        className={clsx(
          "leading-none tracking-[-0.02em]",
          size === "lg" ? "text-[2rem]" : "text-[1.5rem]",
        )}
      >
        {mine === null && <span className="t-small mr-1.5">from</span>}
        {formatPrice(shown)}
      </span>
      <Regular
        price={regular}
        className={clsx(
          "t-body",
          tone === "white" ? "text-white/60" : "text-ink-3",
        )}
      />
      <span className="sr-only">
        {mine === null
          ? `, ${offer.start.percent}% to ${offer.top.percent}% off for Founding Members`
          : `, with your ${mine}% off`}
      </span>
    </p>
  );
}
