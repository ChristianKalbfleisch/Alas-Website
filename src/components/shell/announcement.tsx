"use client";

import { CountdownText, useCountdown } from "@/components/campaign/countdown";
import { openGift, useGift } from "@/components/founding/store";
import { CAMPAIGN } from "@/data/campaign";
import { GIFT_TOP } from "@/data/gift";

/** One line across the top: the offer, when it ends, and the way to claim it. */
export function Announcement() {
  const claimed = useGift().joined;
  const over = useCountdown()?.over ?? false;
  const live = CAMPAIGN !== null && !over;
  return (
    <div className="bg-navy text-white">
      <p className="wrap flex min-h-[var(--bar-h)] flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 py-1.5 text-center text-[0.9375rem] leading-tight">
        {live && CAMPAIGN ? (
          <>
            <span>
              <b>{CAMPAIGN.name}:</b> up to {GIFT_TOP.percent}% off pre-orders.
            </span>
            <span className="max-sm:hidden">Ends in</span>
            <CountdownText className="max-sm:hidden" />
          </>
        ) : (
          <span>
            Pre-order now. Founding Members save up to {GIFT_TOP.percent}%.
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
