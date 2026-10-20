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
- **Harvested in Greece, packaged in the USA.** Confirmed by Justin
  2026-10-20, settling the apparent contradiction between the pouch's
  "100% Natural, Greek Salt" and the pack's USA packaging line. Write it as
  he put it — "harvested in Greece", "packaged in the USA" — and never as
  "Made in USA", which is an FTC-regulated claim this wording does not
  support.
- There is a Ritual Subscription, and a Welcome Box free with the first
  subscription delivery. A printed Ritual Guide ships in every box.
- Visual direction: dark, editorial, premium DTC. Reference points are
  im8health.com and drinkag1.com — that level of polish and restraint.

### Confirmed offer terms

Approved 2026-09-09, free shipping revised by Justin 2026-10-20. Write these
verbatim:

- 30-day money back guarantee
- Save up to 20% on subscriptions
- Free shipping anywhere in the USA

**The $100 threshold is gone.** Justin replaced it with unconditional free
shipping within the USA on 2026-10-20, which is live in the announcement bar,
the homepage offer band and the footer. Two consequences: the threshold also
has to come off in Shopify's shipping settings, and the cheapest SKU now
carries free shipping — see the margin note below.

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

| Product | Price | Weight | Pouches |
|---|---|---|---|
| Álas Family Box | $99.99 | — | 3 |
| Álas Welcome Box | $74.99 | — | — |
| Megálo Performance Kit | $59.99 | 1460 g | 4 |
| Hydration Sticks (30 × 2 g) | $49.99 | 60 g | — |
| Mésos Balance Kit | $34.99 | 780 g | 2 |
| Hydration Sticks (15 × 2 g) | $24.99 | 30 g | — |
| Mikró Starter Kit | $19.99 | 390 g | 1 |
| Hydration Sticks (5 × 2 g) | $9.99 | 10 g | — |

**A salt pouch is 390 g.** Confirmed by the brand 2026-10-13, along with the
pouch counts above: Mésos is two pouches, Megálo is four. This is what the
salt size selector shows, because "390g / 780 g / 1460 g" is a weight list and
not a size choice. The gram figure stays on the page in the product title.

The Family Box's 1170 g is three pouches, which closes. So do Mikró at 390 g
and Mésos at 780 g — and that settles Mésos's real weight for the 0 g bug
below.

**Megálo is settled: the store figure is wrong and 1560 g is right.** Justin
chose this 2026-10-20 — four 390 g pouches is 1560 g, not the 1460 g the store
carries. Note it is **two** places in Shopify, not one: the weight field *and*
the product title, which reads "…Performance Kit 1460 g". Both are his to
change, and the product title is also the source of the public URL.

Until both are changed the site still reads 1460 g from the API, so no page
states a pouch count and a gram total together yet. Once they are, it can.
The same correction gives Mésos's 0 g weight bug its answer: 780 g.

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
Storefront API on 2026-09-09, 2026-10-11 and again on 2026-10-19: all 8
products still return `sellingPlanGroups: []`.
Until products are assigned in Shopify, the Ritual Subscription remains
advertised on the live site — the membership page, "save up to 20% on
subscriptions", the Welcome Box gift — with nothing purchasable behind it.

Note what the Storefront API can and cannot see here: it only exposes plan
groups **through the products they are attached to**. With none attached it
reports nothing, so "a plan named The Ritual exists" comes from the Shopify
admin and is not re-checkable with the Storefront token. Only the zero
attachment is.

**If subscriptions are dropped rather than attached**, three things have to
come off the site in the same change, because each one advertises something
that cannot then be bought:

- "Save up to 20% on subscriptions" — one of the three confirmed offer terms,
  currently in the footer of every page
- the Ritual Subscription on the membership page
- the Welcome Box as a free first-delivery gift

Dropping it also removes the thing monthly subscriber points would accrue
against, which was Justin's own suggestion for the rewards programme. The name
collision that prompted the question is fixable on its own: rename the plan in
Shopify to something plain like "Subscribe & Save" and the motto is free for
marketing again.

Build the product page against the standard `sellingPlanGroups` shape so it
works the moment plans are attached. Until then the subscription selector
renders nothing rather than guessing, and any UI that mentions a subscription
must read the real state rather than assume one exists.

The Welcome Box as a free gift on the first subscription delivery is not native
behaviour in any subscription app. It needs an automatic discount or a Shopify
Function alongside the selling plan. Treat it as its own piece of work.

## Rewards and offers — accounts built, programme not decided

Asked for 2026-10-19, after a Zenova rewards modal was sent as the reference:
customer logins, a profile, points tracked and redeemable against a salt pouch,
and points accruing monthly for subscribers.

**The accounts layer is built and verified.** Classic Storefront-API customer
accounts — sign up, sign in, sign out, profile, order history, password reset
— on the Storefront token the site already has. No OAuth, no Admin token, no
Shopify admin work. See `lib/shopify/customer.ts` and `lib/customer/`.

**Points are not built and nothing on the site hints at them.** Two blockers:

1. The earn and redeem rates are the business's to set. Never invented.
2. A balance has to live somewhere. `Customer.metafields` is readable over the
   Storefront API but only **writable** with an Admin token, which this repo is
   not allowed to hold. So the ledger needs either a Shopify loyalty app
   (Smile.io, Rivo, LoyaltyLion) or a separate service holding those
   credentials — not this codebase.

Worth knowing before picking: there is no standalone pouch SKU. The smallest
thing a pouch reward can redeem for is the Mikró Starter Kit at $19.99.

### The influencer code is not a site feature

Justin's answer on the welcome discount (2026-10-19) describes something
different from the Zenova reference: a **private** code for friends, family and
influencers, rotated every 24 hours to a week, under a programme he calls
"Alas Alliance". That needs no site UI at all — it is a Shopify discount code
shared out of band. The public, every-visitor welcome modal of the reference
screenshot remains unapproved and unbuilt.

A rotating shared code is also manual admin work on every rotation. Per-person
codes are the cheaper mechanism and they attribute sales to the person who
drove them, which one shared code cannot.

### Discount stacking

The mechanism is Shopify's per-discount **Combinations** setting, which
classifies each discount as order, product or shipping and lets you choose
which classes may combine. Two points that change the arithmetic:

- **Discounts compound, they do not add.** A 20% subscription discount
  followed by a 10% code is 28% off, not 30%: the code applies to the already
  reduced subtotal.
- **Renewals usually take only one discount**, even where the first order took
  two. So a welcome code is in practice a first-delivery discount.

Both of those come from third-party subscription apps' documentation, not from
Shopify Subscriptions, which is the first-party app this store runs. The
general mechanism is consistent across sources; the exact behaviour for the
first-party app **must be tested in the store** before any of it is
advertised. Sources also disagree on whether two codes can be entered on one
order, so do not rely on it.

### The margin arithmetic

Computed from the confirmed catalogue prices only. Unit cost and real shipping
cost are the two missing inputs and are Justin's to supply — they are never
estimated.

Justin's proposed rule is that only "subscription + 10% welcome" stacks.
Because the stack is pure compounding percentages, **it costs the same
percentage on every product**: 28.0% off in cash, plus 3.6% in points at a 5%
rate, for **31.6% off list**. At a 20% welcome code instead of 10% it is
**39.2%**.

| Product | List | Sub −20% | +10% welcome | Points @5% | Effective off |
|---|---|---|---|---|---|
| Álas Family Box | $99.99 | $79.99 | $71.99 | $3.60 | 31.6% |
| Álas Welcome Box | $74.99 | $59.99 | $53.99 | $2.70 | 31.6% |
| Megálo Performance Kit | $59.99 | $47.99 | $43.19 | $2.16 | 31.6% |
| Hydration Sticks 30 × 2 g | $49.99 | $39.99 | $35.99 | $1.80 | 31.6% |
| Mésos Balance Kit | $34.99 | $27.99 | $25.19 | $1.26 | 31.6% |
| Hydration Sticks 15 × 2 g | $24.99 | $19.99 | $17.99 | $0.90 | 31.6% |
| Mikró Starter Kit | $19.99 | $15.99 | $14.39 | $0.72 | 31.6% |
| Hydration Sticks 5 × 2 g | $9.99 | $7.99 | $7.19 | $0.36 | 31.6% |

The $9.99 sticks pack is the one to check first: $7.19 after the stack, on an
item that still has to be picked, packed and shipped.

Structural guards worth setting whatever the rates end up being: points earn on
the amount **paid**, not list; no points earned on an order that spent points;
a minimum order value below which nothing stacks; and the cheapest SKUs
excluded from stacking.

### Free shipping: the threshold problem is solved, a margin one replaces it

Until 2026-10-20 no product in the catalogue reached the $100 threshold on its
own — the Family Box missed by a cent and everything else was further away — so
a confirmed offer term could only ever fire on a multi-item order. Justin
removed the threshold entirely, which fixes that.

What it creates instead: **the $9.99 sticks pack now ships free.** Shipping
comes straight off a $9.99 line, and off $7.19 once the subscription-plus-
welcome stack is applied. Whether that survives depends on the real shipping
cost, which is still one of the two numbers never estimated here. Worth
deciding whether the cheapest SKU is excluded, or carried as an acquisition
cost.

## Justin's answers of 2026-10-20 — four settled, four not

Settled, and acted on or recorded above: sourcing and packaging wording;
Megálo's weight (1560 g, two fields in Shopify); the Greek handles are being
replaced with readable ones; a contact destination.

Four of his answers cannot be built as written. Each is a number that
contradicts a confirmed one, so none of them is guessed at.

### The subscription price is upside down

He gave: "monthly supply subscription 2 bags for $59.99".

Two bags is the Mésos Balance Kit, which the store sells outright for
**$34.99**. So a $59.99 monthly subscription is **$25.00 more** than simply
buying the same two bags — a 71% increase, not a saving. It also makes the
confirmed offer term "Save up to 20% on subscriptions" false on its face.

$59.99 is, exactly, Megálo's list price — four bags. So the likeliest reading
is that he means Megálo, and miscounted the bags. For reference, against the
confirmed prices:

| Plan | 10% off | 15% off | 20% off |
|---|---|---|---|
| 2 bags (Mésos, $34.99) | $31.49 | $29.74 | $27.99 |
| 4 bags (Megálo, $59.99) | $53.99 | $50.99 | $47.99 |

No subscription selector is built until the bag count and the price agree.

### The Welcome Box price does not match the store

He gave **$79.99**. The store sells it for **$74.99** (confirmed from the
export and still live). The site renders whatever the Storefront API returns,
so it will keep showing $74.99 until the price is changed in Shopify. The
figure is never hardcoded to paper over the gap.

### The free Welcome Box is a large first-month giveaway

He wants the Welcome Box free with a subscription. At his own numbers, month
one collects **$59.99** and ships two bags plus a box listed at **$79.99** —
**$114.98 of goods at list, 48% below list**. At a genuine 20%-off
subscription it is $27.99 collected against $114.98 shipped, **76% below**.

This is the thing he himself flagged: "We can't give the product away for
free!" It wants a decision before it is built, not after.

### Flavours do not exist in Shopify

His note "(Blue berry flavour, normal and lemon flavour)" describes product
variation that **is not in the store at all**. All eight products are a single
`Default Title` variant with no flavour dimension. The site can only sell what
Shopify has, so flavours need creating there first — as real variants of one
sticks product, ideally, which would also fix the size-selector fragility
recorded below. Which product the flavours belong to is also unconfirmed; the
note appeared without one.

### On the About page

He supplied a brief rather than copy: the history of ancient Greece, the
product's pain points, "feeling better every day, hitting your vitamin count",
and an audience of endurance runners.

The history and the audience are safe to write. **"Hitting your vitamin count"
is not, and will not be written**: salt contains no vitamins, so it is both a
new health claim and a false one, which the port-don't-author rule and the
never-invent-a-number rule both forbid. The page can carry the hydration and
electrolyte language already being ported, and nothing stronger.

Whatever is drafted is a draft for Justin to approve as the business's own
words, per the rule against authoring brand narrative.

## Two things the build had to pin down

- **Every Storefront query and mutation carries `@inContext(country: US)`.**
  Without it Shopify infers the buyer's country from the request, and the
  catalogue and the cart disagree — a $9.99 product came back as CA$14.10 in
  the cart. ALAS is US/USD, so US is the context everywhere. If the store ever
  sells outside the US this becomes a real market selector, not a constant.
- **Product handles arrive percent-encoded.** Every handle contains Greek, and
  Next hands the route param through still encoded, so the handle is decoded
  before it reaches the Storefront API. Without that every product page 404s.
  This disappears if the Greek is taken out of the handles, which is already
  on the list above.

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

**Do not take this list on trust — run it.** `node scripts/audit-shopify.mjs`
checks every item below against the live API, read-only, and exits non-zero
while anything is outstanding. As of 2026-10-20 it reports **13 failing
checks**, which is every item here except the barcode apostrophe corrected
below.

- **Duplicate SKUs.** All three Hydration Sticks share `HS-USA-08`. The two
  boxes have no SKU at all.
- **Duplicate barcodes.** Sticks share `860015181503`; salt pouches share
  `199874971223`. Duplicate GTINs get listings rejected by Google Shopping, Meta
  and Amazon. Still true, re-confirmed 2026-10-20.

  **Correction, 2026-10-20.** An earlier version of this line said both values
  carry a leading apostrophe, saved into the real value. The Storefront API
  returns them clean, so that apostrophe was an artifact of reading the CSV
  export — Excel's text marker — and not a stored value. Nothing to fix there.
- **Mésos weighs 0 g**, with its unit set to kg while everything else is in
  grams. Carrier-calculated shipping will treat it as weightless. The value it
  wants is **780 g** — two 390 g pouches, confirmed 2026-10-13 and agreeing
  with its own product title.
- **Both boxes weigh 500 g**, though the Family Box holds 1170 g of salt plus a
  32 oz canister, a bottle and a spoon.
- **Mikró is marked non-taxable**; every other product is taxable.
- **The Family Box description is the Welcome Box's**, copied and not edited.
- **Megálo is called a Starter Kit** in the box contents and a Performance Kit
  as a product; the contents say 390 g × 3 = 1170 g. That is wrong twice over —
  Megálo is **four** pouches (confirmed 2026-10-13), and four 390 g pouches is
  1560 g, not the 1460 g the title and weight field both carry. The contents
  line is a stale copy of the Family Box's three pouches; the 100 g gap is the
  open question recorded in the catalogue above.
- **Product handles contain Greek characters**, so every product URL is
  percent-encoded gibberish. Worth fixing before launch — after launch it means
  redirects.
- **Zero SEO titles, zero SEO descriptions, zero image alt text** across all 8
  products and all 17 images. Counted again on 2026-10-11: 0 of 17 images
  carry alt text.
- **No product type and no tags on any product.** Both fields are empty on all
  eight. Nothing in Shopify groups the three Hydration Sticks packs, or the
  three salt kits, as sizes of one thing — so the product page derives its size
  selector by parsing titles, which breaks silently the moment a product is
  renamed. The durable fix is a product type, a shared tag, or making the sizes
  real variants of one product.
- Product descriptions carry Framer CSS classes (`framer-styles-preset-…`) that
  mean nothing outside Framer. Strip and re-style them. The 15-pack description
  also contains two empty `<img>` tags that render broken.

## The logo

Supplied as SVG on 2026-10-11 and in the repo as `public/logo-lockup.svg`.

It arrived as `alas-logo-square.svg`: a 1024 square with an opaque
`#071C30` background rect baked in — a colour that is **not** the brand navy
`#12314D`, so it rendered as a visibly darker square on the page. The rect is
dropped and the viewBox tightened to the artwork's own bounds
(760.70 × 578.12, measured by flattening every curve), leaving a transparent
mark that sits on whatever surface it is placed on.

It is a stacked lockup — ALAS over SALT CO, roughly 4:3 — not a horizontal
wordmark. It is therefore sized by height, not width: 3.25rem in the header,
5rem in the footer. A horizontal variant would serve a sticky header better;
the ALAS line alone is subpaths 0–3 of the single path and separates cleanly
at y 598 if that variant is ever wanted. Not done unilaterally — the mark is
the brand's.

The favicons (`app/icon.png`, `app/apple-icon.png`) use the ALAS line only on
brand navy. The full lockup is unreadable at 32px.

One caveat worth knowing: the file is a single `fill-rule="evenodd"` path of
3,018 cubic curves and not one straight line, across 12 subpaths. That is the
signature of an auto-traced bitmap rather than a drawn or font-derived vector.
It renders cleanly at every size used here, so it is fit for purpose, but it
costs 124 KB (47 KB gzipped) where a redrawn vector would cost about 2 KB.
Worth asking the designer for the original outlines. Coordinate precision was
reduced from 3 decimals to 2 — a 0.03px shift at 1024px, verified by
pixel-diff — which is where 20 KB of that came off.

## Imagery

13 of 17 product images are ChatGPT-generated — the filenames say so. Only
`WelcomeKit.jpg`, `Megalo.jpg`, `Mesos2.jpg` and `MikrosKick.png` are real.
Build around the real four; treat the rest as placeholder.

Several homepage images are generic stock — a shopkeeper behind a counter, a
spa towel, a Corfu coastline. None read as dark, editorial, premium DTC. Do not
port them.

## Still needed from Justin — leave TODO, do not guess

- Founder story / about copy
- Real product photography to replace the generated images
- Display typeface: the licensed woff2 files, and which face is the real one
  (the Framer build applies both "The Seasons" and "Dahlia Medium"; its font
  catalogue makes the output ambiguous). Inter is the confirmed UI face.
- Whether subscriptions are being kept at all. Asked 2026-10-19, Justin replied
  that "The Ritual is our motto" and suggested removing it "for now". That is a
  name collision, not a disagreement: the motto and the **Shopify selling plan
  someone named "The Ritual"** are two different objects, and attaching
  products to the plan is the plumbing that makes a subscribe option exist at
  all. Pending his answer, nothing is removed — see the subscriptions section
  for what has to come off the site if it is.
- The discrete discount on the plan, and which products it covers.
  "Up to 20%" is a marketing ceiling, not a per-plan figure.
- Whether the Greek in product titles is decorative or a real localisation
  intent. The store is US/USD, but every title carries Greek.
- One spelling of the brand: the store says "Álas", the brief says "ALAS", the
  packaging reads "ALAS".
- A decision to **drop** the four held-back statistics. Researched 2026-10-20:
  this is no longer a sourcing question. Three of the four are disease
  risk-reduction claims, and those require FDA **pre-market authorization** as
  an authorized or qualified health claim — a citation does not confer one, and
  a food making one unauthorized is treated as an unapproved drug. So they
  cannot go on the site even with perfect sources. Dropping them is the only
  path that does not need a regulator.
- Retailers for the "Trusted by Retailers" section, or a decision to drop it.
- **One canonical list of offers.** Four are now in circulation and no two
  agree. The three confirmed terms; the live site's "Join The Ritual & Receive
  10% Off Your Next Order"; Justin's "10% welcome for subscribing"
  (2026-10-19); and the private influencer code below. Whether the middle two
  are the same offer is unknown. No newsletter signup and no welcome offer is
  built until there is one list with one number per offer.
- **Unit cost and real shipping cost per product.** Needed to finish the margin
  check below, and the only two inputs missing from it. Never estimated.
- **Written shipping and returns terms.** The shipping *offer* is settled
  (free anywhere in the USA, 2026-10-20). The *policies* are not: the refund
  mechanics behind the 30-day guarantee, shipping times, terms of service, and
  the subscription cancellation policy are all still missing. In Shopify only
  the privacy policy is filled in. Also still needed: whether shipping outside
  the USA is offered at all, since the offer is now scoped to it.
- **Confirmation of the contact address.** He gave `info@alassalt.com`, but the
  store and site are `alassaltco.com` — no "co". One of the two is wrong and
  mail to the wrong one goes nowhere. Recorded as a TODO in
  `app/contact/page.tsx`.
- **What "hardrocks" means** in his About brief, alongside endurance runners.
  Possibly Hyrox, possibly something else. Not guessed at.

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
that language is reproduced in full. These four are a different category.

**Correction, 2026-10-20.** An earlier version of this section said they go in
once Justin supplies citations. That was wrong, and researching the question
settled it. The distinction that matters is not sourcing but FDA claim class:

- **Structure/function** claims ("supports hydration") need no pre-approval —
  only substantiation, truthful wording, and the disclaimer this site already
  carries in the footer.
- **Disease risk-reduction** claims ("reduction in risk of type 2 diabetes and
  stroke") require FDA **pre-market authorization**. Without it the product is
  treated as an unapproved drug.

Three of the four are the second kind. No citation changes that, so they stay
off whatever research turns up. "Clinically proven" is a separate problem: it
asserts a standard of evidence rather than a fact, and nothing here meets it.

What the literature actually shows, for the record: the mainstream consensus
runs the *other* way — the AHA advises at most 2,300 mg of sodium a day and
ideally 1,500 mg, the WHO under 2,000 mg, and US intake averages about
3,300 mg. A general "salt is good for you" position cannot be built on it. The
narrow defensible ground is heavy sweat loss in endurance athletes, and even
there the evidence is mixed: sodium taken during exercise under 18 hours has
not been shown to prevent exercise-associated hyponatremia, where overdrinking
is the main driver. Anything new in the health register wants a lawyer, not
just a source.

"80+ trace minerals" is kept, because it already appears in the body copy being
ported.

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

For a human arriving cold rather than an agent: `README.md` covers running it
and the layout, and `docs/HANDOVER.md` is the short version of this file —
what is built, what is blocked and on whom, the content rules, and the
pre-cutover checklist. Keep all three in step when a decision lands.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
