"use client";

import { useRef, useState } from "react";
import { suggestEmail } from "@/lib/signup/email-hint";

/**
 * "Did you mean …?" for an email field. `check` shows the hint on blur; `hold`
 * runs on submit and stops it once per address with a likely typo, so the
 * second press always sends what the visitor typed. (Clicking the button blurs
 * the field first, which is why `check` alone never counts as seen.)
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

export function EmailHint({
  suggestion,
  onUse,
}: {
  suggestion: string;
  onUse: (email: string) => void;
}) {
  return (
    <>
      Did you mean{" "}
      <button
        type="button"
        onClick={() => onUse(suggestion)}
        className="font-medium text-ink underline decoration-[var(--c-line-strong)] underline-offset-[3px] hover:decoration-ink"
      >
        {suggestion}
      </button>
      ?
    </>
  );
}
