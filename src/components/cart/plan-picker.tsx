"use client";

import clsx from "clsx";
import { type KeyboardEvent, useRef } from "react";
import { RITUAL, RITUAL_SAVE_PERCENT } from "@/data/ritual";
import { formatPrice } from "@/lib/cart/cart-math";
import { PRICE_SOON } from "@/lib/cart/catalogue";

export type Plan = "once" | "ritual";

type PlanPickerProps = {
  value: Plan;
  onChange: (plan: Plan) => void;
  /** The one-time price of the chosen size; null while it waits for a new price. */
  oncePrice: number | null;
  /** What one time buys, e.g. "1 pouch". */
  onceLabel: string;
  className?: string;
};

/**
 * One time, or The Ritual. Two glass cards in a radio group; the subscription
 * card carries its real saving against two pouches bought one at a time.
 */
export function PlanPicker({
  value,
  onChange,
  oncePrice,
  onceLabel,
  className,
}: PlanPickerProps) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const plans: Plan[] = ["once", "ritual"];

  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const next = value === "once" ? "ritual" : "once";
    onChange(next);
    buttons.current[plans.indexOf(next)]?.focus();
  };

  const card = (active: boolean) =>
    clsx(
      "relative flex min-h-[7.25rem] flex-col rounded-[20px] p-4 text-left transition-[background-color,box-shadow,transform] duration-500 ease-[var(--ease-out)] sm:p-5",
      active
        ? "bg-white shadow-[inset_0_0_0_1.5px_var(--c-ink),0_18px_40px_-24px_rgb(18_49_77_/_0.55)]"
        : "bg-[rgb(18_49_77_/_0.025)] shadow-[inset_0_0_0_1px_var(--c-line-strong)] hover:bg-white/70",
    );
  const dot = (active: boolean) => (
    <span
      aria-hidden
      className={clsx(
        "grid size-[18px] shrink-0 place-items-center rounded-full transition-[box-shadow] duration-300",
        active
          ? "shadow-[inset_0_0_0_1.5px_var(--c-ink)]"
          : "shadow-[inset_0_0_0_1px_var(--c-line-strong)]",
      )}
    >
      <span
        className={clsx(
          "size-2 rounded-full bg-ink transition-transform duration-500 ease-[var(--ease-out)]",
          active ? "scale-100" : "scale-0",
        )}
      />
    </span>
  );

  return (
    <div
      role="radiogroup"
      aria-label="How you buy"
      onKeyDown={move}
      className={clsx("grid grid-cols-2 gap-2.5", className)}
    >
      {/* biome-ignore lint/a11y/useSemanticElements: radio cards with roving focus, like the size switch */}
      <button
        type="button"
        role="radio"
        aria-checked={value === "once"}
        tabIndex={value === "once" ? 0 : -1}
        onClick={() => onChange("once")}
        ref={(el) => {
          buttons.current[0] = el;
        }}
        className={card(value === "once")}
      >
        <span className="flex items-center gap-2.5">
          {dot(value === "once")}
          <span className="font-display text-[1.2rem] leading-none">
            One time
          </span>
        </span>
        <span className="mt-auto pt-4">
          <span className="block font-mono text-[15px] text-ink">
            {oncePrice === null ? PRICE_SOON : formatPrice(oncePrice)}
          </span>
          <span className="mt-1 block font-mono text-[10px] text-ink-3 uppercase tracking-[0.08em]">
            {onceLabel}
          </span>
        </span>
      </button>

      {/* biome-ignore lint/a11y/useSemanticElements: radio cards with roving focus, like the size switch */}
      <button
        type="button"
        role="radio"
        aria-checked={value === "ritual"}
        tabIndex={value === "ritual" ? 0 : -1}
        onClick={() => onChange("ritual")}
        ref={(el) => {
          buttons.current[1] = el;
        }}
        className={card(value === "ritual")}
      >
        <span className="-top-2.5 absolute right-4 rounded-full bg-ink px-2 py-[3px] font-mono text-[9px] text-white uppercase leading-none tracking-[0.08em]">
          Save {RITUAL_SAVE_PERCENT}%
        </span>
        <span className="flex items-center gap-2.5">
          {dot(value === "ritual")}
          <span className="font-display text-[1.2rem] leading-none">
            The Ritual
          </span>
        </span>
        <span className="mt-auto pt-4">
          <span className="flex flex-wrap items-baseline gap-x-2 font-mono text-[15px] text-ink">
            {formatPrice(RITUAL.price)}
            <span className="text-[11px] text-ink-3 line-through decoration-1">
              {formatPrice(RITUAL.retail)}
            </span>
          </span>
          <span className="mt-1 block font-mono text-[10px] text-ink-3 uppercase tracking-[0.08em]">
            {RITUAL.pouches} pouches every month
          </span>
        </span>
      </button>
    </div>
  );
}
