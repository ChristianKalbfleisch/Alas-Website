"use client";

import { CountdownText } from "@/components/campaign/countdown";
import { useOffer } from "@/components/campaign/use-offer";
import { openGift, useGift } from "@/components/founding/store";

/** One line across the top: the offer, when it ends, and the way to claim it. */
export function Announcement() {
  const claimed = useGift().joined;
  const offer = useOffer();
  return (
    <div className="bg-navy text-white">
      <p className="wrap flex min-h-[var(--bar-h)] flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 py-1.5 text-center text-[0.9375rem] leading-tight">
        {offer.campaign ? (
          <>
            <span>
              <b>{offer.campaign.name}:</b> up to {offer.top.percent}% off
              pre-orders.
            </span>
            <span className="max-sm:hidden">Ends in</span>
            <CountdownText className="max-sm:hidden" />
          </>
        ) : (
          <span>
            Pre-order now. Founding Members save up to {offer.top.percent}%.
          </span>
        )}
        <button
          type="button"
          onClick={() => openGift("bar")}
          className="link shrink-0 font-bold hover:text-foam!"
        >
          {claimed ? "Your code" : "Claim it"}
        </button>
      </p>
    </div>
  );
}
