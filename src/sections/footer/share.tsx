"use client";

import { useState } from "react";

/** A moment worth sharing: the native share sheet, or copy the link. */
export function ShareLink() {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    const url = `${window.location.origin}/`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: "ALAS Salt Co.",
          text: "Pass the salt: ALAS, a pinch of the Aegean in your water.",
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      // Share sheet dismissed or clipboard blocked: nothing to undo.
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="eyebrow inline-flex h-11 items-center gap-2 rounded-full px-5 text-ink ring-1 ring-[var(--c-line-strong)] ring-inset transition-colors duration-500 hover:bg-white/70"
    >
      <span aria-live="polite">{copied ? "Link copied" : "Pass the salt"}</span>
    </button>
  );
}
