import clsx from "clsx";
import type { OfferSteps } from "@/data/gift";

/** The steps of the offer in a row, filled as far as the visitor has come. */
export function Ladder({
  offer,
  percent,
}: {
  offer: OfferSteps;
  percent: number;
}) {
  return (
    <div
      role="img"
      aria-label={`${percent}% off so far, of up to ${offer.top.percent}%`}
      className="grid auto-cols-fr grid-flow-col gap-1.5"
    >
      {offer.tiers.map((tier) => {
        const reached = tier.percent <= percent;
        return (
          <div key={tier.percent} aria-hidden className="grid gap-2">
            <span
              className={clsx(
                "h-2 rounded-full transition-colors duration-300",
                reached ? "bg-navy" : "bg-mist-2",
              )}
            />
            <span
              className={clsx(
                "t-price text-[0.9375rem] leading-none transition-colors duration-300",
                reached ? "font-bold text-ink" : "text-ink-3",
              )}
            >
              {tier.percent}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
