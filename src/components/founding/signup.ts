"use client";

import { useRef, useState } from "react";
import type { GiftAnswers } from "@/data/gift";
import { rememberEmail } from "@/lib/cart/shopper";
import { suggestEmail } from "@/lib/signup/email-hint";
import { EMAIL } from "@/lib/signup/request";

export { EMAIL };

export type SubscribeOutcome = "ok" | "invalid" | "invalid-phone" | "error";

/** POST to the shared sign-up endpoint (src/app/api/subscribe). */
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
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (res.ok && data.ok === true) {
      // Filled in at checkout later, so nobody types it twice.
      rememberEmail(email);
      return "ok";
    }
    if (data.error === "invalid_email") return "invalid";
    return data.error === "invalid_phone" ? "invalid-phone" : "error";
  } catch {
    return "error";
  }
}

/** Sends the answers a member gave after joining; each is worth a step. */
export async function savePreferences(email: string, answers: GiftAnswers) {
  try {
    await fetch("/api/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, source: "preferences", answers }),
      // Sent as the dialog closes, so it must outlive a move to another page.
      keepalive: true,
    });
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
