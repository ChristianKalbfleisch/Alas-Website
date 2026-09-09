# ALAS Salt Co. — Shopify theme

## What this project is

Rebuild the alassaltco.com storefront as a native Shopify theme so the site can
come off Framer entirely. The current site was built in Framer by a designer and
connects to Shopify; the goal is Shopify only, with the theme hosted by Shopify.

Use the existing live site as the visual reference. Do not scrape its markup —
Framer's output is generated and not worth porting. Rebuild the design as clean
Liquid sections.

## Stack

- Shopify Online Store 2.0 theme, based on Dawn
- Liquid, vanilla CSS, vanilla JS
- No build step, no framework, no bundler unless something genuinely requires it
- Everything in JSON templates + sections so the design is editable in the theme editor

## Brand facts

These are confirmed. Use them verbatim where copy is needed.

- ALAS Salt Co. LLC, Wyoming. "Άλας" is Greek for salt.
- 100% Aegean mineral sea salt, hand-harvested.
- On-pack lines: "Hydration Element" and "Ancient Elements of the Aegean".
- Sizes: 250 g and 300 g, plus a 390 g pouch.
- US market, USD.
- There is a Ritual Subscription, and a Welcome Box free with the first
  subscription delivery. A printed Ritual Guide ships in every box.
- Visual direction: dark, editorial, premium DTC. Reference points are
  im8health.com and drinkag1.com — that level of polish and restraint.

### Confirmed offer terms

Approved 2026-09-09. Currently live on alassaltco.com. Write these verbatim:

- 30-day money back guarantee
- Save up to 20% on subscriptions
- Free shipping on orders over $100

These are the only numbers cleared for use. The "never invent a number" rule
below applies to everything else without exception — including per-size prices
and the discrete per-selling-plan discount, which "up to 20%" does not settle.

## Content rules — do not break these

- **Never invent a number.** No prices, no percentages, no shipping times,
  no mineral counts, no review counts, no ratings. If a number is needed and
  it is not in this file, leave a clearly marked `TODO` and ask.
- **Health claims are limited to the on-pack language above.** Do not write
  benefit claims about hydration, electrolytes, energy, recovery, sleep,
  digestion, or anything clinical. No invented studies or statistics.
- Include an FDA-style disclaimer in the footer on any page that touches
  wellness language.
- Do not write a founder story, an origin narrative, or an "about" bio. That
  copy has to come from Justin.

## Still needed from Justin — leave TODO, do not guess

- Price per size, and the discrete discount on each selling plan
- Official logo as SVG
- Shipping and returns terms
- Founder story / about copy
- Product photography at full resolution
- Confirmation of sourcing and packaging language (the packaging says harvested
  and packaged in the USA, while the salt is sourced from Greece — this is
  unresolved and must not be written around until it is settled)
- Display typeface: the licensed woff2 files, and confirmation of which face
  is the real one (the Framer build applies both "The Seasons" and "Dahlia
  Medium", and its font catalogue makes the output ambiguous)
- Which subscription app provides the selling plans on the store

## Working rules

- One section per commit. Small, reviewable changes.
- Never touch checkout, cart logic, or payment flow. Those are Shopify's.
- Preview with `shopify theme dev`. Never `shopify theme push` to the live
  theme — push to an unpublished theme and preview it there.
- Before adding a new section, check whether a Dawn section already does the job
  and can be restyled instead.
- Keep CSS in the section's own stylesheet or a clearly named file. No global
  overrides that leak into other sections.

## Build order

1. Design tokens — colours, type scale, spacing. Set these in the theme settings
   so they are editable, not hardcoded.
2. Header and footer.
3. Homepage sections, top to bottom, matching the current site.
4. Product page (this is the one that matters most — subscription selector,
   size selector, the Welcome Box offer).
5. Collection page.
6. Content pages.

## Where to start

Read `config/settings_schema.json` and `layout/theme.liquid` first to understand
the Dawn baseline, then propose the design token setup before writing any
section code. Ask me before you start on anything that needs something from the
"Still needed" list.
