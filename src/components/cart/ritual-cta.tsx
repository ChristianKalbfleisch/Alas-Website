"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";
import { SubscribeForm } from "@/components/gift/subscribe-form";
import { RITUAL, ritualCheckoutUrl } from "@/data/ritual";
import { formatPrice } from "@/lib/cart/cart-math";

const JOINED_KEY = "alas-club-v1";
const JOINED_EVENT = "alas:ritual-joined";

/** Whether this visitor joined The Ritual list, shared by every Ritual button on the page. */
export function useRitualJoined(): [boolean, () => void] {
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        setJoined(window.localStorage.getItem(JOINED_KEY) === "1");
      } catch {
        // Storage unavailable: each form keeps its own state for this visit.
      }
    };
    read();
    const onJoined = () => setJoined(true);
    window.addEventListener(JOINED_EVENT, onJoined);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(JOINED_EVENT, onJoined);
      window.removeEventListener("storage", read);
    };
  }, []);

  const markJoined = useCallback(() => {
    setJoined(true);
    try {
      window.localStorage.setItem(JOINED_KEY, "1");
    } catch {
      // The joined state still shows for this visit.
    }
    window.dispatchEvent(new Event(JOINED_EVENT));
  }, []);

  return [joined, markJoined];
}

type RitualCtaProps = {
  /** Where the email came from, for the email tool later (a-z, 0-9, dashes). */
  source: string;
  size?: "lg" | "md";
  /** One-time items to buy alongside, once The Ritual is live. */
  extra?: { variantId: number; qty: number }[];
  /** "inline": a button that opens the email field. "open": the field from the start. */
  mode?: "inline" | "open";
  className?: string;
};

const pill =
  "group relative flex items-center justify-between gap-3 overflow-hidden rounded-full bg-ink font-medium text-white uppercase shadow-[0_12px_30px_-8px_rgb(18_49_77_/_0.45)] transition-[transform,background-color,box-shadow] duration-500 ease-[var(--ease-out)] hover:bg-[#0c2238] hover:shadow-[0_18px_40px_-10px_rgb(18_49_77_/_0.55)] active:scale-[0.97]";

/**
 * The Ritual's one button. With a selling plan in Shopify it opens checkout with
 * the subscription; until then it collects an email, and says plainly that no
 * payment is taken.
 */
export function RitualCta({
  source,
  size = "lg",
  extra = [],
  mode = "inline",
  className,
}: RitualCtaProps) {
  const [joined, markJoined] = useRitualJoined();
  const [opened, setOpened] = useState(mode === "open");
  const sizing =
    size === "lg"
      ? "h-14 pr-5 pl-6 text-[0.72rem] tracking-[0.14em] sm:pr-6 sm:pl-7 sm:text-[0.75rem] sm:tracking-[0.16em]"
      : "h-11 pr-5 pl-5 text-[0.7rem] tracking-[0.14em]";
  const price = (
    <span className="font-mono text-[0.8rem] normal-case tracking-[0.02em]">
      {formatPrice(RITUAL.price)}
      <span className="opacity-70"> / mo</span>
    </span>
  );

  if (RITUAL.sellingPlanId !== null) {
    return (
      <a
        href={ritualCheckoutUrl(RITUAL.sellingPlanId, extra)}
        className={clsx(pill, sizing, className)}
      >
        Start The Ritual
        {price}
      </a>
    );
  }

  if (joined) {
    return (
      <div className={clsx("min-w-0", className)} aria-live="polite">
        <p className="eyebrow">/ You are on the list</p>
        <p className="mt-1.5 text-[14px] text-ink-2 leading-snug">
          We will email you the day The Ritual opens. No payment until then.
        </p>
      </div>
    );
  }

  if (!opened) {
    return (
      <button
        type="button"
        onClick={() => setOpened(true)}
        className={clsx(pill, sizing, className)}
        aria-label={`Join The Ritual, ${formatPrice(RITUAL.price)} a month once it opens`}
      >
        Join The Ritual
        {price}
      </button>
    );
  }

  return (
    <div className={clsx("min-w-0", className)}>
      <SubscribeForm
        source={source}
        label="Join The Ritual"
        fieldLabel="Opening soon. Leave your email"
        onDone={markJoined}
      />
      <p className="-mt-1 text-[12.5px] text-ink-3 leading-snug">
        No payment now. We will email you the day it opens. Unsubscribe anytime.
      </p>
    </div>
  );
}
