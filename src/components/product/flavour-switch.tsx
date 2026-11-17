"use client";

import clsx from "clsx";
import { FLAVOURS, type Flavour } from "@/data/products";

const DOT: Record<Flavour, string> = {
  Classic: "bg-navy",
  Lemon: "bg-lemon",
};

type FlavourSwitchProps = {
  value: Flavour;
  onChange: (flavour: Flavour) => void;
  /** Names the group for screen readers, e.g. "Pouch flavour". */
  label: string;
  className?: string;
};

/** Classic or Lemon: two plain choices, the chosen one outlined in navy. */
export function FlavourSwitch({
  value,
  onChange,
  label,
  className,
}: FlavourSwitchProps) {
  return (
    <fieldset
      className={clsx(
        "m-0 grid min-w-0 grid-cols-2 gap-2.5 border-0 p-0",
        className,
      )}
    >
      <legend className="sr-only">{label}</legend>
      {FLAVOURS.map((flavour) => {
        const chosen = flavour === value;
        return (
          <button
            key={flavour}
            type="button"
            aria-pressed={chosen}
            onClick={() => onChange(flavour)}
            className={clsx(
              "flex min-h-12 items-center justify-center gap-2 rounded-xl border px-2 text-[1.0625rem] transition-colors",
              chosen
                ? "border-navy bg-paper font-bold text-navy shadow-[inset_0_0_0_1px_var(--color-navy)]"
                : "border-line bg-paper text-ink hover:border-ink-3",
            )}
          >
            <span
              aria-hidden
              className={clsx("size-3.5 shrink-0 rounded-full", DOT[flavour])}
            />
            {flavour}
          </button>
        );
      })}
    </fieldset>
  );
}
