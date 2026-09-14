import type { Product } from "./types";

/**
 * Sizes are separate products, not variants.
 *
 * Every product in the store is a single `Default Title` variant, so there is
 * no variant-level size option to render. The three Hydration Sticks packs are
 * three products; so are the three salt kits.
 *
 * Shopify has nothing to group them by either — `productType` is empty and
 * `tags` is empty on all eight products (verified 2026-09-14). So the grouping
 * is derived from the titles, which is fragile: rename a product in Shopify
 * and its size selector silently disappears.
 *
 * The durable fix is on the Shopify side — set a product type, or a shared
 * tag, or make the sizes real variants of one product. Listed in CLAUDE.md.
 */
type Family = {
  id: string;
  /** Label above the selector. */
  label: string;
  match: RegExp;
  /** Pulls the size out of a title; the first capture group is the label. */
  size: RegExp;
};

const FAMILIES: Family[] = [
  {
    id: "sticks",
    label: "Pack size",
    match: /hydration sticks/i,
    // "(5 × 2g)", "(15 × 2g)", "(30 × 2g)" — both × and x.
    size: /\((\d+\s*[×x]\s*\d+\s*g)\)/i,
  },
  {
    id: "salt",
    label: "Size",
    match: /aegean mineral salt/i,
    // "(390g)" and "— 780 g" both appear; the store is inconsistent.
    size: /(?:\((\d+\s*g)\)|[—-]\s*(\d+\s*g)\b)/i,
  },
];

export type SizeOption = {
  handle: string;
  label: string;
  /** The option the customer is currently looking at. */
  current: boolean;
  available: boolean;
};

export type SizeGroup = {
  label: string;
  options: SizeOption[];
};

function sizeLabel(title: string, pattern: RegExp): string | null {
  const m = title.match(pattern);
  if (!m) return null;
  const value = m[1] ?? m[2];
  return value ? value.replace(/\s+/g, " ").replace(/\s*([×x])\s*/, " × ") : null;
}

/**
 * The sibling sizes of `product`, or null when it has none — a one-off like
 * the Welcome Box, or a family whose titles no longer parse.
 */
export function getSizeGroup(
  product: Product,
  all: Product[],
): SizeGroup | null {
  const family = FAMILIES.find((f) => f.match.test(product.title));
  if (!family) return null;

  const options = all
    .filter((p) => family.match.test(p.title))
    .map((p) => ({ product: p, label: sizeLabel(p.title, family.size) }))
    .filter((entry): entry is { product: Product; label: string } =>
      Boolean(entry.label),
    )
    .map(({ product: p, label }) => ({
      handle: p.handle,
      label,
      current: p.handle === product.handle,
      available: p.availableForSale,
    }));

  // A selector showing one option is not a selector.
  if (options.length < 2) return null;
  // If the current product did not parse, the group would mislead.
  if (!options.some((o) => o.current)) return null;

  return { label: family.label, options };
}
