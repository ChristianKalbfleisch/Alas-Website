"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { timeLeft } from "@/data/campaign";
import { useOffer } from "./use-offer";

type Left = ReturnType<typeof timeLeft>;

/**
 * Time left in the campaign that is running, ticking once a second; null
 * until it has run in the browser, and when no campaign is running.
 */
function useCountdown(): Left | null {
  const ends = useOffer().campaign?.ends;
  const [left, setLeft] = useState<Left | null>(null);
  useEffect(() => {
    if (!ends) {
      setLeft(null);
      return;
    }
    const tick = () => setLeft(timeLeft(ends));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [ends]);
  return left;
}

const two = (value: number | undefined) =>
  value === undefined ? "––" : String(value).padStart(2, "0");

type CountdownProps = {
  /** "navy" sits on dark surfaces, "paper" on light ones. */
  tone?: "navy" | "paper";
  className?: string;
};

/** Four boxes counting down to the end of the campaign. Gone once it has ended. */
export function Countdown({ tone = "navy", className }: CountdownProps) {
  const campaign = useOffer().campaign;
  const left = useCountdown();
  if (!campaign || left?.over) return null;
  const parts: [string, number | undefined][] = [
    ["days", left?.days],
    ["hours", left?.hours],
    ["min", left?.minutes],
    ["sec", left?.seconds],
  ];
  return (
    <div
      role="timer"
      aria-label={`${campaign.name} ends ${campaign.endsLabel}`}
      className={clsx("flex gap-2", className)}
    >
      {parts.map(([label, value]) => (
        <div
          key={label}
          className={clsx(
            "grid min-w-[4.25rem] justify-items-center rounded-2xl px-3 py-2.5",
            tone === "navy" ? "bg-white/10 text-white" : "bg-mist text-navy",
          )}
        >
          <span className="t-price text-[1.75rem] leading-none tracking-[-0.02em]">
            {two(value)}
          </span>
          <span
            className={clsx(
              "t-fine mt-1",
              tone === "navy" ? "text-white/70" : "text-ink-2",
            )}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

/** The same countdown as one short line of text, for the bar across the top. */
export function CountdownText({ className }: { className?: string }) {
  const left = useCountdown();
  if (!left || left.over) return null;
  return (
    <span className={clsx("t-price", className)} aria-hidden>
      {left.days > 0 && `${left.days}d `}
      {two(left.hours)}h {two(left.minutes)}m {two(left.seconds)}s
    </span>
  );
}
