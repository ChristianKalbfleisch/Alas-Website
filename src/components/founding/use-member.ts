"use client";

import { useOffer } from "@/components/campaign/use-offer";
import { earnedTier, useGift } from "./store";

/**
 * This visitor under the offer in force: the step they have earned, and what
 * they hold once they have joined. What was done towards a campaign is read
 * again under the standing offer after the campaign's end, so nobody is quoted
 * or charged a step the offer in force no longer has.
 */
export function useMember() {
  const offer = useOffer();
  const gift = useGift();
  const earned = earnedTier(offer, gift);
  return {
    offer,
    gift,
    /** The step earned so far, joined or not. */
    earned,
    /** The percentage this visitor holds: null until they have joined. */
    mine: gift.joined ? earned.percent : null,
    /** The code checkout applies: null until they have joined. */
    code: gift.joined ? earned.code : null,
  };
}
