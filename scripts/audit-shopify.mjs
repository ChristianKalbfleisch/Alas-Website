#!/usr/bin/env node
/**
 * Audits the live Shopify catalogue against the problems recorded in
 * CLAUDE.md, so nobody has to take that list on trust.
 *
 *   node scripts/audit-shopify.mjs
 *
 * Reads NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN from the environment, or from
 * .env.local if it is not set. Read-only: it runs one Storefront query and
 * changes nothing.
 *
 * Exits 0 when every check passes, 1 when any fails — so it can gate a
 * launch checklist in CI if that is ever wanted.
 */

import { readFileSync } from "node:fs";

const DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ?? "alassaltco.myshopify.com";
const VERSION = process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION ?? "2025-07";

function token() {
  if (process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN) {
    return process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
  }
  try {
    const match = readFileSync(".env.local", "utf8")
      .match(/NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN\s*=\s*(\S+)/);
    if (match) return match[1];
  } catch {
    // no .env.local — fall through to the error below
  }
  console.error(
    "Missing NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN.\n" +
    "Set it in the environment or in .env.local — see .env.example.",
  );
  process.exit(2);
}

const QUERY = /* GraphQL */ `
  query Audit @inContext(country: US) {
    products(first: 50) {
      edges {
        node {
          title
          handle
          productType
          tags
          totalInventory
          seo { title description }
          images(first: 20) { edges { node { url altText } } }
          variants(first: 10) {
            edges {
              node {
                sku
                barcode
                weight
                weightUnit
                taxable
                price { amount currencyCode }
              }
            }
          }
          sellingPlanGroups(first: 5) { edges { node { name } } }
        }
      }
    }
  }
`;

const body = await fetch(`https://${DOMAIN}/api/${VERSION}/graphql.json`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Shopify-Storefront-Access-Token": token(),
  },
  body: JSON.stringify({ query: QUERY }),
}).then((r) => r.json());

if (body.errors) {
  console.error("Storefront API error:", JSON.stringify(body.errors, null, 2));
  process.exit(2);
}

const products = body.data.products.edges.map((e) => e.node);
const variants = products.flatMap((p) =>
  p.variants.edges.map((e) => ({ ...e.node, product: p.title })),
);
const images = products.flatMap((p) =>
  p.images.edges.map((e) => ({ ...e.node, product: p.title })),
);

/* Reporting ------------------------------------------------------------- */

let failures = 0;

/** `offenders` empty means the problem is fixed. */
function check(label, offenders, note) {
  const ok = offenders.length === 0;
  if (!ok) failures += 1;
  console.log(`${ok ? "  ok  " : " FAIL "} ${label}`);
  if (!ok) {
    for (const line of offenders.slice(0, 12)) console.log(`         ${line}`);
    if (offenders.length > 12) console.log(`         …and ${offenders.length - 12} more`);
    if (note) console.log(`         → ${note}`);
  }
}

function duplicates(items, key) {
  const seen = new Map();
  for (const item of items) {
    const value = item[key];
    if (!value) continue;
    (seen.get(value) ?? seen.set(value, []).get(value)).push(item.product);
  }
  return [...seen.entries()]
    .filter(([, who]) => who.length > 1)
    .map(([value, who]) => `${key} ${JSON.stringify(value)} shared by: ${who.join(", ")}`);
}

console.log(`\nALAS Shopify audit — ${DOMAIN} (API ${VERSION})`);
console.log(`${products.length} products, ${variants.length} variants, ${images.length} images`);
console.log(`run ${new Date().toISOString()}\n`);

console.log("Subscriptions");
check(
  "a selling plan is attached to at least one product",
  products.some((p) => p.sellingPlanGroups.edges.length)
    ? []
    : ["no product returns any sellingPlanGroup"],
  "attach products to the plan in Shopify, or the subscribe option cannot render",
);

console.log("\nIdentifiers");
check("no duplicate SKUs", duplicates(variants, "sku"));
check(
  "every variant has a SKU",
  variants.filter((v) => !v.sku).map((v) => `${v.product}: no SKU`),
);
check("no duplicate barcodes", duplicates(variants, "barcode"),
  "duplicate GTINs get listings rejected by Google Shopping, Meta and Amazon");
check(
  "no barcode starts with an apostrophe",
  variants
    .filter((v) => v.barcode?.startsWith("'"))
    .map((v) => `${v.product}: barcode ${JSON.stringify(v.barcode)}`),
  "a spreadsheet artifact saved into the real value",
);

console.log("\nShipping and tax");
check(
  "every variant has a non-zero weight",
  variants
    .filter((v) => !v.weight)
    .map((v) => `${v.product}: weight ${v.weight} ${v.weightUnit}`),
  "carrier-calculated shipping treats a weightless item as free to post",
);
check(
  "all weights use one unit",
  new Set(variants.map((v) => v.weightUnit)).size <= 1
    ? []
    : [...new Set(variants.map((v) => `${v.weightUnit}`))].map((u) => `unit in use: ${u}`),
);
check(
  "every variant is taxable",
  variants.filter((v) => !v.taxable).map((v) => `${v.product}: not taxable`),
);

console.log("\nURLs");
check(
  "no handle contains non-ASCII characters",
  products
    // eslint-disable-next-line no-control-regex
    .filter((p) => /[^\u0000-\u007f]/.test(p.handle))
    .map((p) => `${p.title}: ${p.handle}`),
  "non-ASCII handles become percent-encoded gibberish in every URL",
);

console.log("\nSEO and accessibility");
check(
  "every product has an SEO title",
  products.filter((p) => !p.seo?.title).map((p) => p.title),
);
check(
  "every product has an SEO description",
  products.filter((p) => !p.seo?.description).map((p) => p.title),
);
check(
  "every image has alt text",
  images.filter((i) => !i.altText).map((i) => `${i.product}: ${i.url.split("/").pop()}`),
  "alt text is a requirement, not polish",
);

console.log("\nGrouping");
check(
  "every product has a product type",
  products.filter((p) => !p.productType).map((p) => p.title),
  "without one, the size selector has to parse titles, which breaks on rename",
);
check(
  "every product has at least one tag",
  products.filter((p) => !p.tags?.length).map((p) => p.title),
);

console.log(
  `\n${failures === 0 ? "All checks passed." : `${failures} check${failures === 1 ? "" : "s"} failing.`}\n`,
);
process.exit(failures === 0 ? 0 : 1);
