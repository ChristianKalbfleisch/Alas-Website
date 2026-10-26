"use client";

import clsx from "clsx";
import {
  type PointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { formatPrice } from "@/lib/cart/cart-math";
import { EASE, gsap, prefersReducedMotion, useGSAP } from "@/lib/motion/gsap";

/* ------------------------------------------------------------------ */
/* Tweened price: counts to the new value instead of jumping.          */
/* ------------------------------------------------------------------ */

export function TweenPrice({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || shown.current === value) {
      shown.current = value;
      el.textContent = formatPrice(value);
      return;
    }
    const state = { v: shown.current };
    const tween = gsap.to(state, {
      v: value,
      duration: 0.6,
      ease: "power2.out",
      onUpdate: () => {
        shown.current = state.v;
        el.textContent = formatPrice(state.v);
      },
      onComplete: () => {
        shown.current = value;
        el.textContent = formatPrice(value);
      },
    });
    return () => {
      tween.kill();
    };
  }, [value]);

  return (
    <span ref={ref} className={clsx("tabular-nums", className)}>
      {formatPrice(value)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Quantity stepper. The digit rolls in the direction of the change.   */
/* ------------------------------------------------------------------ */

export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "lg",
  label = "Quantity",
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "lg" | "sm";
  label?: string;
  className?: string;
}) {
  const digit = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);

  useGSAP(
    () => {
      const el = digit.current;
      if (!el || previous.current === value) return;
      const dir = value > previous.current ? 1 : -1;
      previous.current = value;
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        el,
        { yPercent: 70 * dir, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.45, ease: EASE.out },
      );
    },
    { dependencies: [value] },
  );

  const button = clsx(
    "grid place-items-center rounded-full text-ink transition-colors duration-300 hover:bg-[rgb(18_49_77_/_0.06)] disabled:pointer-events-none disabled:opacity-30",
    size === "lg" ? "size-10 sm:size-11" : "size-8",
  );
  return (
    // biome-ignore lint/a11y/useSemanticElements: a stepper group, not a form fieldset
    <div
      role="group"
      aria-label={label}
      className={clsx(
        "inline-flex shrink-0 items-center rounded-full shadow-[inset_0_0_0_1px_var(--c-line-strong)]",
        size === "lg" ? "h-14 px-1 sm:px-1.5" : "h-9 px-0.5",
        className,
      )}
    >
      <button
        type="button"
        className={button}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
          <path d="M2 6h8" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      </button>
      <span
        className={clsx(
          "overflow-hidden text-center font-mono tabular-nums",
          size === "lg" ? "w-7 text-[15px] sm:w-8" : "w-6 text-[13px]",
        )}
      >
        <span ref={digit} className="inline-block" aria-live="polite">
          {value}
        </span>
      </span>
      <button
        type="button"
        className={button}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
          <path d="M2 6h8M6 2v8" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Add to cart: the label lifts away, a check draws, "Added" settles.   */
/* ------------------------------------------------------------------ */

export function AddButton({
  onAdd,
  price,
  label = "Add to cart",
  size = "lg",
  variant = "solid",
  disabled = false,
  className,
  ariaLabel,
}: {
  onAdd: () => void;
  price?: number;
  label?: string;
  size?: "lg" | "md";
  variant?: "solid" | "ghost";
  /** For products waiting on a new price: shown, never pressed. */
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const root = useRef<HTMLButtonElement>(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const press = () => {
    onAdd();
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1900);
  };

  const light = (event: PointerEvent<HTMLButtonElement>) => {
    const el = root.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    el.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  // One label at a time inside a mask: the outgoing one leaves first and fast,
  // the incoming one rises after it, so the two never share the line.
  const swap = (show: boolean, children: ReactNode, key: string) => (
    <span
      key={key}
      className={clsx(
        "absolute inset-0 flex items-center gap-2 transition-[transform,opacity]",
        show
          ? "translate-y-0 opacity-100"
          : key === "idle"
            ? "-translate-y-[115%] opacity-0"
            : "translate-y-[115%] opacity-0",
      )}
      style={{
        transitionDuration: show ? "0.55s" : "0.28s",
        transitionDelay: show ? "0.2s" : "0s",
        transitionTimingFunction: show
          ? "cubic-bezier(0.22, 1, 0.36, 1)"
          : "cubic-bezier(0.55, 0, 1, 0.45)",
      }}
    >
      {children}
    </span>
  );

  return (
    <button
      ref={root}
      type="button"
      onClick={press}
      onPointerMove={light}
      disabled={disabled}
      aria-label={ariaLabel}
      className={clsx(
        "group relative flex items-center justify-between gap-3 overflow-hidden rounded-full font-medium uppercase tracking-[0.14em] transition-[transform,background-color,box-shadow] duration-500 ease-[var(--ease-out)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none sm:tracking-[0.16em]",
        size === "lg"
          ? "h-14 pr-5 pl-6 text-[0.72rem] sm:pr-6 sm:pl-7 sm:text-[0.75rem]"
          : "h-11 pr-5 pl-5 text-[0.7rem]",
        variant === "solid"
          ? "bg-ink text-white shadow-[0_12px_30px_-8px_rgb(18_49_77_/_0.45)] hover:bg-[#0c2238] hover:shadow-[0_18px_40px_-10px_rgb(18_49_77_/_0.55)]"
          : "bg-white/70 text-ink shadow-[inset_0_0_0_1px_var(--c-line-strong)] hover:bg-white",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            variant === "solid"
              ? "radial-gradient(160px circle at var(--mx, 50%) var(--my, 50%), rgb(255 255 255 / 0.16), transparent 70%)"
              : "radial-gradient(160px circle at var(--mx, 50%) var(--my, 50%), rgb(255 255 255 / 0.9), transparent 70%)",
        }}
      />
      <span
        className={clsx(
          "relative h-[1.5em] flex-1 overflow-hidden text-left",
          label.length <= 4 ? "min-w-[5.6em]" : "min-w-[8.9em]",
        )}
      >
        {swap(!added, label, "idle")}
        {swap(
          added,
          <>
            <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
              <path
                d="M3 8.5 6.5 12 13 4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={added ? 0 : 1}
                style={{
                  transition:
                    "stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1) 0.15s",
                }}
              />
            </svg>
            Added
          </>,
          "added",
        )}
      </span>
      {price !== undefined && (
        <TweenPrice
          value={price}
          className="relative font-mono text-[0.8rem] tracking-[0.02em] normal-case"
        />
      )}
    </button>
  );
}
