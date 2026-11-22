"use client";

import { useRef, useState } from "react";
import { STANDING } from "@/data/campaign";
import type { GiftAnswers } from "@/data/gift";
import { rememberEmail, shopperNow } from "@/lib/cart/shopper";
import { campaignOverOnServer, offerNow } from "@/lib/offer/offer-clock";
import { suggestEmail } from "@/lib/signup/email-hint";
import { PREORDER, type Preorder } from "@/lib/signup/preorder";
import { EMAIL } from "@/lib/signup/request";
import { type GiftState, giftNow, updateGift } from "./store";

export { EMAIL };

/** Said beside every form that signs someone up for emails. */
export const EMAIL_CONSENT =
  "You agree to marketing emails from ALAS; unsubscribe anytime.";

/** Said under the cart's pre-order form, where the email is first of all about the pre-order. */
export const PREORDER_CONSENT =
  "We email you about this pre-order. You also agree to marketing emails from ALAS; unsubscribe anytime.";

/**
 * Said in place of the words for a sign-up that went through, on a device
 * whose sign-up the store has not kept: the site had no store connection.
 */
export const NOT_SAVED =
  "Not saved: this preview is not connected to the store yet.";

export type SubscribeOutcome = "ok" | "invalid" | "invalid-phone" | "error";

/** What the endpoint answers; see src/app/api/subscribe/route.ts. */
type Answer = {
  ok?: boolean;
  stored?: boolean;
  error?: string;
  order?: Preorder;
  recorded?: { offer?: string; phone?: boolean };
};

/** Set for a visit once the server has said it keeps nothing: asking again that visit is no use. */
const TOLD_UNSAVED = "alas-signup-unsaved";

function toldUnsaved(): boolean {
  try {
    return window.sessionStorage.getItem(TOLD_UNSAVED) !== null;
  } catch {
    return true;
  }
}

/**
 * Takes in what the server says of a sign-up it accepted. Kept: the device
 * remembers that, and where the server recorded less than the device holds (no
 * phone step, or the standing offer while this page still shows the campaign)
 * the device follows the server. Not kept: the device remembers nothing of it.
 */
function heed(data: Answer) {
  if (data.stored !== true) {
    try {
      window.sessionStorage.setItem(TOLD_UNSAVED, "1");
    } catch {
      // Without storage it simply is not asked again this visit.
    }
    return;
  }
  const patch: Partial<GiftState> = { saved: true };
  if (data.recorded?.phone === false && giftNow().phone) patch.phone = false;
  updateGift(patch);
  if (data.recorded?.offer === STANDING.tag && offerNow().campaign) {
    campaignOverOnServer();
  }
}

/**
 * POST to the shared sign-up endpoint (src/app/api/subscribe). "ok" means the
 * endpoint accepted the address; whether the store kept it is noted on this
 * device (see `saved` in ./store), so the screens that follow can say so.
 */
export async function subscribe(
  email: string,
  source: string,
  extra: { phone?: string; answers?: GiftAnswers } = {},
): Promise<SubscribeOutcome> {
  try {
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, source, ...extra }),
    });
    const data = (await res.json()) as Answer;
    if (res.ok && data.ok === true) {
      // Filled in at checkout later, so nobody types it twice.
      rememberEmail(email);
      heed(data);
      return "ok";
    }
    if (data.error === "invalid_email") return "invalid";
    return data.error === "invalid_phone" ? "invalid-phone" : "error";
  } catch {
    return "error";
  }
}

let resending = false;

/**
 * A device that joined while nothing was kept sends its sign-up once more: the
 * address and the answers are still on it. Called as the offer opens; once a
 * visit at most, and not in a visit that has already heard that nothing is
 * kept. A phone number is not remembered, so it cannot be sent again: the
 * device then follows what the server recorded.
 */
export async function resendUnsaved(source: string) {
  const gift = giftNow();
  const email = shopperNow().email;
  if (resending || !gift.joined || gift.saved || !email || toldUnsaved()) {
    return;
  }
  resending = true;
  await subscribe(email, source, { answers: gift.answers });
  resending = false;
}

export type PreorderOutcome =
  | { outcome: "stored"; order: Preorder }
  /** Accepted but kept nowhere: the site has no store connection. */
  | { outcome: "unsaved" }
  /** Too many tries from this visitor in a short while. */
  | { outcome: "limited" }
  /** The address was refused. */
  | { outcome: "invalid" }
  /** The server refused what this page showed: a product, a percentage or a figure has changed. */
  | { outcome: "stale" }
  /** The customer's note in the store has no room left for it. */
  | { outcome: "full" }
  /** No answer, or a failure: it may or may not have been kept. */
  | { outcome: "error" };

/** Refusals that mean this page shows what no longer holds. */
const STALE = new Set([
  "invalid_ref",
  "invalid_lines",
  "invalid_percent",
  "offer_changed",
  "total_changed",
]);

export type PreorderToSend = {
  /** Made once for these lines; the same on every try. */
  ref: string;
  lines: { handle: string; qty: number }[];
  /** The percentage the cart showed, and the figure it showed to pay with it. */
  percent: number;
  toPay: number;
  answers: GiftAnswers;
};

/**
 * Sends a whole pre-order by email in one request: the address, its reference
 * and every line with its quantity. Only "stored" means the store has it; the
 * order that comes back is what was saved, priced by the server.
 */
export async function sendPreorder(
  email: string,
  preorder: PreorderToSend,
): Promise<PreorderOutcome> {
  try {
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, source: PREORDER, ...preorder }),
    });
    const data = (await res.json()) as Answer;
    if (res.ok && data.ok === true) {
      if (data.stored !== true || !data.order) return { outcome: "unsaved" };
      rememberEmail(email);
      heed(data);
      return { outcome: "stored", order: data.order };
    }
    if (res.status === 429) return { outcome: "limited" };
    // The server's clock says the offer this page quoted has ended: the page
    // changes over to the offer in force, whatever this device's clock says.
    if (data.error === "offer_changed") campaignOverOnServer();
    if (data.error === "invalid_email") return { outcome: "invalid" };
    if (data.error === "note_full") return { outcome: "full" };
    return { outcome: STALE.has(data.error ?? "") ? "stale" : "error" };
  } catch {
    return { outcome: "error" };
  }
}

/**
 * Sends the answers a member gave after joining; each is worth a step. A
 * device whose sign-up the store never kept has no customer there to add them
 * to: it sends its sign-up with the answers instead, unless this visit has
 * already heard that nothing is kept. When the store says it has nobody to add
 * the answers to, the device takes its sign-up as not kept.
 */
export async function savePreferences(
  email: string,
  answers: GiftAnswers,
  source: string,
) {
  const saved = giftNow().saved;
  if (!saved && toldUnsaved()) return;
  try {
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        source: saved ? "preferences" : source,
        answers,
      }),
      // Sent as the dialog closes, so it must outlive a move to another page.
      keepalive: true,
    });
    const data = (await res.json()) as Answer;
    if (!res.ok || data.ok !== true) return;
    if (!saved) heed(data);
    else if (data.stored === false) updateGift({ saved: false });
  } catch {
    // The answers stay on this device; nothing else depends on them.
  }
}

/**
 * "Did you mean …?" for an email field. `check` shows the hint on blur; `hold`
 * runs on submit and stops it once per address with a likely typo, so the
 * second press always sends what the visitor typed.
 */
export function useEmailHint() {
  const [hint, setHint] = useState<string | null>(null);
  const seen = useRef<string | null>(null);

  return {
    hint,
    clear: () => setHint(null),
    check(value: string) {
      setHint(suggestEmail(value));
    },
    hold(value: string) {
      const suggestion = suggestEmail(value);
      if (!suggestion || seen.current === value.trim()) return false;
      seen.current = value.trim();
      setHint(suggestion);
      return true;
    },
  };
}
