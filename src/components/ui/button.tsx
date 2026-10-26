"use client";

import clsx from "clsx";
import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { scrollToTarget } from "@/lib/motion/smooth-scroll";

type Variant = "solid" | "glass" | "ghost";
type Size = "md" | "lg";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  variant?: Variant;
  size?: Size;
  /** Show the round arrow chip on the right. */
  arrow?: boolean;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  "aria-label"?: string;
};

const base =
  "group relative inline-flex items-center justify-center gap-3 rounded-full font-medium uppercase tracking-[0.16em] transition-[transform,background-color,color,box-shadow] duration-500 ease-[var(--ease-out)] will-change-transform active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  solid:
    "bg-ink text-white shadow-[0_10px_30px_rgb(18_49_77_/_0.18)] hover:bg-[#0c2238] hover:shadow-[0_14px_40px_rgb(18_49_77_/_0.26)]",
  glass: "glass text-ink hover:bg-white/70",
  ghost:
    "text-ink ring-1 ring-inset ring-[var(--c-line-strong)] hover:bg-white/60",
};

const sizes: Record<Size, string> = {
  md: "h-11 pl-6 text-[0.7rem]",
  lg: "h-14 pl-8 text-[0.75rem]",
};

function Arrow({ variant, size }: { variant: Variant; size: Size }) {
  const chip = size === "lg" ? "size-10" : "size-8";
  const tone = variant === "solid" ? "bg-white text-ink" : "bg-ink text-white";
  return (
    <span
      aria-hidden
      className={clsx(
        "relative grid place-items-center overflow-hidden rounded-full",
        chip,
        tone,
      )}
    >
      <svg
        viewBox="0 0 16 16"
        className="size-3.5 transition-transform duration-500 ease-[var(--ease-out)] group-hover:translate-x-[180%] group-hover:-translate-y-[180%]"
      >
        <path
          d="M4 12 12 4M5.5 4H12v6.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
      <svg
        viewBox="0 0 16 16"
        className="absolute size-3.5 -translate-x-[180%] translate-y-[180%] transition-transform duration-500 ease-[var(--ease-out)] group-hover:translate-x-0 group-hover:translate-y-0"
      >
        <path
          d="M4 12 12 4M5.5 4H12v6.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    </span>
  );
}

/** The site's one button. Pills only; uppercase tracked label; optional arrow chip. */
export function Button({
  children,
  href,
  onClick,
  variant = "solid",
  size = "md",
  arrow = true,
  className,
  type = "button",
  disabled,
  ...rest
}: ButtonProps) {
  const classes = clsx(
    base,
    variants[variant],
    sizes[size],
    arrow
      ? size === "lg"
        ? "pr-2"
        : "pr-1.5"
      : size === "lg"
        ? "pr-8"
        : "pr-6",
    className,
  );
  const content = (
    <>
      <span className="relative">{children}</span>
      {arrow && <Arrow variant={variant} size={size} />}
    </>
  );

  if (href?.startsWith("#")) {
    return (
      <a
        href={href}
        className={classes}
        aria-label={rest["aria-label"]}
        onClick={(event) => {
          event.preventDefault();
          scrollToTarget(href);
          onClick?.(event);
        }}
      >
        {content}
      </a>
    );
  }
  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        onClick={onClick}
        aria-label={rest["aria-label"]}
      >
        {content}
      </Link>
    );
  }
  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      aria-label={rest["aria-label"]}
    >
      {content}
    </button>
  );
}
