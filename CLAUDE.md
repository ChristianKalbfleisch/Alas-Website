# ALAS Salt Co. — storefront

## What this project is

Replace the Framer frontend of alassaltco.com with a Next.js app. Shopify stays
exactly as it is underneath.

This is **not** a re-architecture. The site is already headless: Framer renders
the frontend and talks to Shopify through a paid third-party connector called
Frameship (`frameship-shopify-config`, licence `7733a398-…`). We are replacing
the Framer layer only. Frameship goes away with it, along with its licence fee.

Use the existing live site as the visual reference. Do not port its markup —
Framer's output is generated and worthless as source. Rebuild it properly.

## Stack

- Next.js (App Router) + TypeScript
- Hosted on Vercel
- Shopify Storefront API for the catalogue; **Shopify-hosted checkout**
- Store: `alassaltco.myshopify.com`, Storefront API version `2025-07`
- The Headless sales channel is already installed on the store and issues the
  Storefront API credentials

Never hardcode the Storefront token. It belongs in
`NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN`. Storefront tokens are public by design
and safe in client code, but keeping it in env means it can be rotated without
a code change. An **Admin** API token must never appear in this repo or in any
client bundle.

## Brand facts

Confirmed. Use verbatim where copy is needed.

- ALAS Salt Co. LLC, Wyoming. "Άλας" is Greek for salt.
- 100% Aegean mineral sea salt, hand-harvested.
- On-pack lines: "Hydration Element" and "Ancient Elements of the Aegean".
- US market, USD.
- There is a Ritual Subscription, and a Welcome Box free with the first
  subscription delivery. A printed Ritual Guide ships in every box.
- Visual direction: dark, editorial, premium DTC. Reference points are
  im8health.com and drinkag1.com — that level of polish and restraint.

### Confirmed offer terms

Approved 2026-09-09. Live on alassaltco.com. Write these verbatim:

- 30-day money back guarantee
- Save up to 20% on subscriptions
- Free shipping on orders over $100

### Palette

Read from the live site's own design tokens and confirmed against the physical
packaging.

| Token | Hex | Use |
|---|---|---|
| Navy | `#12314D` | Dominant brand colour, page ground |
| Deep navy | `#192436` | Footer, contrast bands |
| Black | `#000000` | Hero over imagery |
| White | `#FFFFFF` | Type on dark, light bands |
| Grey | `#686868` | Muted text |
| Grey dark | `#353535` | Secondary muted |
| Red | `#E5163E` | Accent — sale/badges only |

Radii on the current site are 8px and 10px. Heading tracking is tight and
negative (−0.03em, −0.06em on display sizes); eyebrow/kicker text is uppercase
at +0.3em. Container maxes at ~1640px.

## Catalogue

Verified from the Shopify product export, 2026-09-09. These prices are
confirmed — they are not estimates and do not need a TODO.

| Product | Price | Weight |
|---|---|---|
| Álas Family Box | $99.99 | — |
| Álas Welcome Box | $74.99 | — |
| Megálo Performance Kit | $59.99 | 1460 g |
| Hydration Sticks (30 × 2 g) | $49.99 | 60 g |
| Mésos Balance Kit | $34.99 | 780 g |
| Hydration Sticks (15 × 2 g) | $24.99 | 30 g |
| Mikró Starter Kit | $19.99 | 390 g |
| Hydration Sticks (5 × 2 g) | $9.99 | 10 g |

Eight products, no variants — every one is a single `Default Title` variant.
All are set to **continue selling when out of stock**, so zero inventory will
not render them unavailable.

There is no 250 g or 300 g product. An earlier version of this brief said there
was; it was wrong.

## Subscriptions — installed, not yet attached

**Shopify Subscriptions** (first-party, free) is installed, and a plan named
**The Ritual** exists. It creates native selling plans, which the Storefront
API exposes directly — no vendor SDK, no lock-in. There were no existing
subscribers, so nothing had to be migrated.

**No product is attached to the plan yet.** Verified against the live
Storefront API on 2026-09-09: all 8 products return `sellingPlanGroups: []`.
Until products are assigned in Shopify, the Ritual Subscription remains
advertised on the live site — the membership page, "save up to 20% on
subscriptions", the Welcome Box gift — with nothing purchasable behind it.

Build the product page against the standard `sellingPlanGroups` shape so it
works the moment plans are attached. Until then the subscription selector
renders nothing rather than guessing, and any UI that mentions a subscription
must read the real state rather than assume one exists.

The Welcome Box as a free gift on the first subscription delivery is not native
behaviour in any subscription app. It needs an automatic discount or a Shopify
Function alongside the selling plan. Treat it as its own piece of work.

## Content rules — do not break these

- **Health claims: port, do not author.** Decision, 2026-09-09: reproduce the
  existing product and site copy as written, including its hydration and
  electrolyte language. That copy is the business's own and the business owns
  the risk. Do **not** write new claims beyond what already exists, and do not
  extend or intensify existing ones.
- **Never invent a number.** The catalogue prices and offer terms above are
  confirmed and free to use. Everything else — mineral counts, percentages,
  shipping times, review counts, ratings — needs a clearly marked `TODO` and a
  question, never a guess.
- Include an FDA-style disclaimer in the footer on any page carrying wellness
  language. Given the decision above, that is most pages.
- Do not write a founder story, an origin narrative, or an "about" bio. That
  copy has to come from Justin.

## Known problems in the Shopify data

Found in the 2026-09-09 export. These are the store's to fix, not the site's to
work around — but the site will inherit them until they are.

- **Duplicate SKUs.** All three Hydration Sticks share `HS-USA-08`.
- **Duplicate barcodes.** Sticks share `'860015181503`; salt pouches share
  `'199874971223`. Both values also carry a leading apostrophe — a spreadsheet
  artifact saved into the real value. Duplicate GTINs get listings rejected by
  Google Shopping, Meta and Amazon.
- **Mésos weighs 0 g**, with its unit set to kg while everything else is in
  grams. Carrier-calculated shipping will treat it as weightless.
- **Both boxes weigh 500 g**, though the Family Box holds 1170 g of salt plus a
  32 oz canister, a bottle and a spoon.
- **Mikró is marked non-taxable**; every other product is taxable.
- **The Family Box description is the Welcome Box's**, copied and not edited.
- **Megálo is called a Starter Kit** in the box contents and a Performance Kit
  as a product; the contents say 390 g × 3 = 1170 g against its actual 1460 g.
- **Product handles contain Greek characters**, so every product URL is
  percent-encoded gibberish. Worth fixing before launch — after launch it means
  redirects.
- **Zero SEO titles, zero SEO descriptions, zero image alt text** across all 8
  products and all 17 images.
- **Family Box is priced $99.99** against a $100 free-shipping threshold.
- Product descriptions carry Framer CSS classes (`framer-styles-preset-…`) that
  mean nothing outside Framer. Strip and re-style them. The 15-pack description
  also contains two empty `<img>` tags that render broken.

## Imagery

13 of 17 product images are ChatGPT-generated — the filenames say so. Only
`WelcomeKit.jpg`, `Megalo.jpg`, `Mesos2.jpg` and `MikrosKick.png` are real.
Build around the real four; treat the rest as placeholder.

Several homepage images are generic stock — a shopkeeper behind a counter, a
spa towel, a Corfu coastline. None read as dark, editorial, premium DTC. Do not
port them.

## Still needed from Justin — leave TODO, do not guess

- Official logo as SVG
- Shipping and returns terms
- Founder story / about copy
- Real product photography to replace the generated images
- Confirmation of sourcing and packaging language (packaging says harvested and
  packaged in the USA, while the salt is sourced from Greece, and the pouch
  reads "100% Natural, Greek Salt" — unresolved, and must not be written around
  until it is settled)
- Display typeface: the licensed woff2 files, and which face is the real one
  (the Framer build applies both "The Seasons" and "Dahlia Medium"; its font
  catalogue makes the output ambiguous). Inter is the confirmed UI face.
- The Ritual plan attached to products in Shopify — it currently covers none.
- The discrete discount on the Ritual plan, and which products it covers.
  "Up to 20%" is a marketing ceiling, not a per-plan figure.
- Whether the Greek in product titles is decorative or a real localisation
  intent. The store is US/USD, but every title carries Greek.
- One spelling of the brand: the store says "Álas", the brief says "ALAS", the
  packaging reads "ALAS".
- Sources for the four held-back statistics, or a decision to drop them.
- Retailers for the "Trusted by Retailers" section, or a decision to drop it.
- Whether the newsletter offer on the live site — "Join The Ritual & Receive
  10% Off Your Next Order" — is real. It is a fourth offer term beyond the
  three confirmed, and needs a discount code behind it. No newsletter signup
  is built until it is settled.

## Homepage sections not reproduced — questions for Justin

Built 2026-09-14. The homepage follows the live site's section order, with
three of its sections deliberately left out. Each needs a decision.

- **"Trusted by Retailers Who Value Craftsmanship."** The section claims the
  trust of "leading retailers and wellness partners" and names or shows no
  retailer at all. Either supply the retailers, or the section goes.
- **The "Begin The Ritual" value stack.** Its line items are a "Daily Ultimate
  Essentials Refill Pouch" ($49), a "Signature Stainless steel spoon" ($9
  free), a "Daily Ultimate Essentials Forever Jar" ($12 free) and a "Signature
  Water Bottle" ($20 free), under the heading "Get Started with ALAS for Daily
  Ultimate Nutrition". ALAS sells none of those products and none of those
  prices is in the catalogue. It is another brand's product naming and value
  stack, left in the Framer template and never replaced. It is live on
  alassaltco.com today. Replaced here with the real catalogue.
- **"Explore the Benefits / WHY SALT?"** Four cards on salt baths, salt
  inhalers and salt scrubs — uses of a product ALAS does not sell — including
  "Salt inhalers or halotherapy can alleviate symptoms of asthma and
  allergies", a disease-treatment claim.

### Statistics held back

The live site's stats band carries three figures and a phrase that are **not**
reproduced:

- ">68% of americans do not meet daily magnesium intake needs, resulting in an
  increased risk of type 2 diabetes"
- ">20% Reduction in risk of type 2 diabetes and stroke"
- "20% Of The World's Population Is Zinc Deficient And Linked To Weakened
  Immunity"
- "clinically proven"

The port decision covers the site's hydration and electrolyte language, and
that language is reproduced in full. These four are a different category:
disease risk-reduction claims, which is the class of claim that draws FDA
warning letters, and none carries a source. The rule above — never state a
number without a confirmed source — applies. They go in when Justin supplies
citations and confirms he wants them. "80+ trace minerals" is kept, because it
already appears in the body copy being ported.

### Image licensing

The homepage uses three images taken from the live site: the dark sea surface
(hero), salt crystals in shallow water, and a cut-out salt mound. They are the
only images on the current site that read as premium rather than stock.
Provenance is unknown — if any were licensed to the Framer site specifically,
that licence needs checking before launch. The Corfu coastline, the spa towel
and the shopkeeper images are not used.

## Working rules

- Small, reviewable commits. One concern per commit.
- **Never touch checkout or payment.** The cart hands off to Shopify-hosted
  checkout and stops there.
- Server components by default; client components only where interaction
  demands it. Fetch catalogue data on the server so the token never ships more
  than it must.
- Keep styling colocated with components. No global overrides that leak.
- Run `web-design-guidelines` over new UI before calling it done. Alt text and
  keyboard access are requirements, not polish.

## Build order

1. Design tokens — colours, type scale, spacing, radii. Central and editable,
   not scattered through components.
2. Shopify data layer — typed Storefront API client, product queries, cart.
3. Header and footer.
4. Homepage sections, top to bottom, matching the current site.
5. Product page (the one that matters most — size selector, subscription
   selector, the Welcome Box offer).
6. Collection page.
7. Content pages.

## Where to start

Design tokens, then the data layer. Ask before starting anything that depends
on the "Still needed" list.
