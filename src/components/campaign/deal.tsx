"use client";

import clsx from "clsx";
import { earnedTier, openGift, useGift } from "@/components/founding/store";
import { ArrowRight } from "@/components/ui/icons";
import { CAMPAIGN, discounted } from "@/data/campaign";
import { GIFT_START, GIFT_TOP } from "@/data/gift";
import { formatPrice } from "@/lib/cart/cart-math";

/** "Up to 25% off": the most the offer gives, said the same way everywhere. */
export const dealLine = () => `Up to ${GIFT_TOP.percent}% off pre‑orders`;

/** The offer in one tappable line above the headline. */
export function DealChip({ source = "hero" }: { source?: string }) {
  const claimed = useGift().joined;
  return (
    <button
      type="button"
      onClick={() => openGift(source)}
      className="group inline-flex max-w-full items-center gap-3 rounded-full border border-white/20 bg-white/[0.07] py-1.5 pr-4 pl-1.5 text-left text-[0.9375rem] leading-tight transition-colors hover:border-white/50"
    >
      <span className="shrink-0 rounded-full bg-white px-3 py-1.5 font-bold text-navy">
        {CAMPAIGN ? CAMPAIGN.name : "Founding Members"}
      </span>
      <span className="min-w-0">
        {claimed ? "Your code is ready" : dealLine()}
      </span>
      <ArrowRight
        size={16}
        className="shrink-0 transition-transform group-hover:translate-x-0.5"
      />
    </button>
  );
}

/** A round sticker with the top percentage, laid over a picture. */
export function DealSticker({ className }: { className?: string }) {
  return (
    <div aria-hidden className={clsx("deal-sticker", className)}>
      <span className="t-fine font-bold">
        {CAMPAIGN ? CAMPAIGN.name : "Founding price"}
      </span>
      <span className="t-price text-[2.75rem] leading-[0.9] tracking-[-0.04em]">
        {GIFT_TOP.percent}%
      </span>
      <span className="t-fine font-bold">off</span>
    </div>
  );
}

type DealFigureProps = {
  /** The regular price, in dollars. */
  price: number;
  /** Leave out the word "from", where a line beside it already says it. */
  bare?: boolean;
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
  bare,
  struck,
  tone = "ink",
}: DealFigureProps) {
  const gift = useGift();
  const mine = gift.joined ? earnedTier(gift).percent : null;
  return (
    <>
      {mine === null && !bare && "from "}
      {formatPrice(discounted(price, mine ?? GIFT_TOP.percent))}
      {struck && (
        <>
          {" "}
          <s className={tone === "white" ? "text-white/60" : "text-ink-3"}>
            {formatPrice(price)}
          </s>
        </>
      )}
    </>
  );
}

/**
 * One quiet line under a price: how the lower price is reached, or what a
 * member already has. It opens the offer.
 */
export function DealNote({ source = "shop" }: { source?: string }) {
  const gift = useGift();
  const mine = gift.joined ? earnedTier(gift).percent : null;
  return (
    <button
      type="button"
      onClick={() => openGift(source)}
      className="link t-small text-left text-sea"
    >
      {mine === null
        ? "Founding Member price. Join free"
        : mine < GIFT_TOP.percent
          ? `Your ${mine}% off. Build it to ${GIFT_TOP.percent}%`
          : `Your ${mine}% off, added at checkout`}
    </button>
  );
}

type DealPriceProps = {
  /** The regular price, in dollars. */
  price: number;
  size?: "md" | "lg";
  tone?: "ink" | "white";
};

/**
 * The regular price struck through, beside the least a Founding Member pays;
 * for a member, beside what they pay at the step they have reached.
 */
export function DealPrice({
  price,
  size = "md",
  tone = "ink",
}: DealPriceProps) {
  const gift = useGift();
  const mine = gift.joined ? earnedTier(gift).percent : null;
  return (
    <p className="t-price flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
      <span
        className={clsx(
          "leading-none tracking-[-0.02em]",
          size === "lg" ? "text-[2rem]" : "text-[1.5rem]",
        )}
      >
        {mine === null && <span className="t-small mr-1.5">from</span>}
        {formatPrice(discounted(price, mine ?? GIFT_TOP.percent))}
      </span>
      <s
        className={clsx(
          "t-body",
          tone === "white" ? "text-white/60" : "text-ink-3",
        )}
      >
        {formatPrice(price)}
      </s>
      <span className="sr-only">
        {mine === null
          ? `, ${GIFT_START.percent}% to ${GIFT_TOP.percent}% off for Founding Members`
          : `, with your ${mine}% off`}
      </span>
    </p>
  );
}
