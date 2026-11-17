import clsx from "clsx";
import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { ArrowRight } from "./icons";

type Tone = "navy" | "white" | "outline" | "outline-white";
type Size = "sm" | "md" | "lg";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  tone?: Tone;
  size?: Size;
  /** A small arrow after the label, for the main action of a block. */
  arrow?: boolean;
  /** Stretch to the width of its container. */
  full?: boolean;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  "aria-label"?: string;
};

const TONES: Record<Tone, string> = {
  navy: "btn-navy",
  white: "btn-white",
  outline: "btn-outline",
  "outline-white": "btn-outline-white",
};

const SIZES: Record<Size, string> = { sm: "btn-sm", md: "", lg: "btn-lg" };

/** The site's one button: a plain pill in sentence case. */
export function Button({
  children,
  href,
  onClick,
  tone = "navy",
  size = "md",
  arrow = false,
  full = false,
  className,
  type = "button",
  disabled,
  ...rest
}: ButtonProps) {
  const classes = clsx(
    "btn",
    TONES[tone],
    SIZES[size],
    full && "w-full",
    className,
  );
  const content = (
    <>
      <span>{children}</span>
      {arrow && <ArrowRight size={18} className="btn-arrow shrink-0" />}
    </>
  );
  const label = rest["aria-label"];

  if (href && /^(https?:|mailto:)/.test(href)) {
    return (
      <a href={href} className={classes} onClick={onClick} aria-label={label}>
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
        aria-label={label}
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
      aria-label={label}
    >
      {content}
    </button>
  );
}
