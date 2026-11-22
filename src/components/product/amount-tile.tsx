"use client";

import clsx from "clsx";
import Link from "next/link";
import { DealFigure } from "@/components/campaign/deal";

type AmountTileProps = {
  chosen: boolean;
  /** How many: 2, 15. */
  figure: number;
  /** What the number counts: "pouches", "sticks". */
  unit: string;
  /** The regular price of one, in dollars; null while it has none. */
  price: number | null;
  /** How many of that price the tile stands for. */
  qty?: number;
} & (
  | { onChoose: () => void; href?: undefined }
  /** A tile that is a link to that amount's own page. */
  | { href: string; onChoose?: undefined }
);

/**
 * One choice of how many: the number, what it counts, and the price. The same
 * tile on a shop card and on a product page, so the same choice shows the
 * same figure in both places.
 */
export function AmountTile({
  chosen,
  figure,
  unit,
  price,
  qty = 1,
  onChoose,
  href,
}: AmountTileProps) {
  const className = clsx(
    "@container block rounded-xl border px-1.5 py-2.5 text-center transition-colors",
    chosen
      ? "border-navy shadow-[inset_0_0_0_1px_var(--color-navy)]"
      : "border-line hover:border-ink-3",
  );
  const content = (
    <>
      <span
        className={clsx(
          "block text-[1.25rem] leading-tight",
          chosen && "font-bold",
        )}
      >
        {figure}
      </span>
      <span className="t-small block text-ink-2">{unit}</span>
      {price !== null && (
        <span className="t-small t-price block text-ink">
          <DealFigure price={price} qty={qty} tight />
        </span>
      )}
    </>
  );
  if (href !== undefined) {
    return (
      <Link
        href={href}
        replace
        scroll={false}
        aria-current={chosen ? "true" : undefined}
        className={className}
      >
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-pressed={chosen}
      onClick={onChoose}
      className={className}
    >
      {content}
    </button>
  );
}
