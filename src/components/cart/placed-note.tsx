"use client";

import { useEffect, useRef } from "react";
import { Check } from "@/components/ui/icons";
import { formatPrice } from "@/lib/cart/cart-math";
import { dismissPlaced, type Placed } from "@/lib/cart/placed";

const DAY = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** "November 21, 2026" from 2026-11-21. */
const spelled = (day: string) => {
  const date = new Date(`${day}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? day : DAY.format(date);
};

/**
 * The confirmation of a kept pre-order: the lines and amounts the server
 * saved, the address the link to pay goes to, the day and the reference. It
 * stays in the cart until the visitor puts it away; until the link to pay
 * arrives it is the only copy they have.
 */
export function PlacedNote({ placed }: { placed: Placed }) {
  const { order, email } = placed;
  const note = useRef<HTMLDivElement>(null);
  const several = order.lines.length > 1 || order.lines[0]?.qty > 1;
  // The cart may be scrolled down to the email step when a pre-order is
  // placed: bring its note into view.
  const ref = order.ref;
  useEffect(() => {
    if (ref) note.current?.scrollIntoView({ block: "nearest" });
  }, [ref]);
  return (
    <div
      ref={note}
      data-placed={order.ref}
      className="scroll-mt-4 rounded-2xl bg-mist p-4"
    >
      <p className="flex items-center gap-2.5 text-[1.0625rem] leading-tight font-bold">
        <Check size={22} strokeWidth={2} className="shrink-0 text-sea" />
        Pre-order placed
      </p>
      <ul className="t-small mt-2.5 grid gap-1">
        {order.lines.map((line) => (
          <li
            key={line.handle}
            data-placed-line={line.handle}
            className="flex items-baseline justify-between gap-3"
          >
            <span>
              {line.name} {"×"} {line.qty}
            </span>
            <span className="t-price">{formatPrice(line.total)}</span>
          </li>
        ))}
      </ul>
      <p className="t-small mt-2.5 text-ink">
        <span className="t-price font-bold whitespace-nowrap">
          To pay then: {formatPrice(order.toPay)}
        </span>
        {order.percent > 0 && ` with your ${order.percent}% off`}. Nothing is
        charged now. We will email {email} the link to pay before{" "}
        {several ? "they ship" : "it ships"}.
      </p>
      {order.asked !== undefined && (
        <p data-placed-asked className="t-small mt-1.5 text-ink">
          The cart showed {order.asked}% off. The store has {order.percent}% on
          record for you, so that is what this pre-order was placed with.
        </p>
      )}
      <p className="t-small mt-1.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-ink-2">
        <span>
          Placed {spelled(order.day)}. Reference {order.ref}.
        </span>
        <button
          type="button"
          onClick={dismissPlaced}
          className="link -my-2 inline-flex min-h-10 items-center"
        >
          Hide this note
        </button>
      </p>
    </div>
  );
}
