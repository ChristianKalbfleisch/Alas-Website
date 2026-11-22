# ALAS Salt Co. website

The ALAS storefront: Greek fleur de sel in two flavours, Classic and Lemon, as a 390 g pouch, as 2.5 g sticks and as the Discovery Set. A home page that sells from the first screen, a page per product, a Science & History page with every fact credited, wholesale, and the Founding Member pre-order offer. Next.js on Vercel; Shopify stays underneath for checkout through cart permalinks, and a small Shopify app (see `shopify/README.md`) files sign-ups and wholesale applications.

Preview: every page sends `noindex` until launch.

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build
pnpm test         # vitest
pnpm lint         # biome
pnpm typecheck
node scripts/site-checks.mjs http://localhost:3000   # browser checks, needs Chrome
node scripts/preorder-rehearsal.mjs                  # a pre-order by email from request to note, against a pretend store
node scripts/shots.mjs http://localhost:3000 / /wholesale   # full-page screenshots into shots/
```

## Where things live

| Path | What lives there |
|---|---|
| `src/app/globals.css` | The design system: colours, type, buttons, form fields, pack panels |
| `src/app/page.tsx`, `src/components/home/` | The home page and its sections |
| `src/app/products/[handle]`, `src/components/product/` | Product pages: gallery, flavour and size, the buy block, the buy bar that follows |
| `src/components/shell/` | Offer bar, header, footer, and the measure of how tall the bar and header stand |
| `src/components/cart/`, `src/lib/cart/` | Cart drawer with the quick shop, checkout links, shopper memory |
| `src/components/founding/` | The Founding Member pop-up, its form and state |
| `src/components/campaign/` | The countdown, the sale price, and `useOffer`: the offer in force, for anything a visitor reads |
| `src/app/science-and-history` | The long story, with its sources (`src/data/sources.ts`) |
| `src/app/wholesale` | The wholesale page and its application |
| `src/data/products.ts` | Catalogue: names, flavours, prices, Shopify variant ids, pack images |
| `src/data/campaign.ts`, `src/data/gift.ts` | The seasonal offer (Black Friday) on top of the standing Founding Member offer: percentages, codes, the end date, and which of the two is in force at a given moment; then the optional questions |
| `src/data/offer-lines.ts`, `src/lib/offer/` | The sentences that explain an offer, and the clock that tells a browser which offer to show |
| `src/data/presale.ts` | The ship date, and whether checkout links mark an order as a pre-order |
| `src/data/ritual.ts` | A subscription planned for after launch: its terms and its checkout link. Nothing on the site sells it |
| `src/data/offers.ts`, `src/data/faq.ts` | The terms every order comes with, and the questions shown site-wide |
| `src/data/why-salt.ts` | Why people salt their water: the two credited sentences and the sodium note, said in the same words on the home page and in the long read |
| `public/packs/` | Pack pictures: studio photographs, photographed cut-outs and renders from the print artwork, written by `scripts/sync-packs.py` |
| `src/assets/photos/`, `src/data/photos.ts` | The campaign photographs and their alt lines, copied in by `scripts/sync-photos.py` |
| `public/hero/`, `src/data/hero-sea.ts`, `src/data/hero.ts` | The first screen: its four scenes and the empty ledge they stand on (`hero.ts`), and the one band of open sea they share plus the shop's shallows, written by `scripts/hero-sea.py` |
| `src/app/fonts/` | The typeface files and their licences |
| `shopify/` | Store setup guide, and the snippet that sends the old storefront here |

## Typeface

The site is set in Instrument Sans (SIL Open Font License 1.1) in a cut made for it: Regular and Bold drawn at weights 440 and 600, with the straight-legged R, Q and $ as the defaults, slightly tighter spacing and only the Latin the site uses. `scripts/font/build_alas_cut.py` rebuilds the two files from the upstream variable font. Greek words are set in a small subset of Inter (also OFL) that answers only for Greek letters. Both licences sit beside the files in `src/app/fonts/`, and `src/app/layout.tsx` loads them.

## Commerce

- **Prices and products** (`src/data/products.ts`): each product has a price and a Shopify variant id. Lemon costs what Classic costs, and everything is a pre-order, bought with the same buttons and the same cart. A product with no variant id yet (Lemon, the Discovery Set) goes into the cart like the rest; Shopify's checkout cannot charge for it, so the cart takes its pre-order by email, with no payment, and sends only the other items to checkout. Set its `variantId` once it exists in the store and it checks out like the rest (`shopify/README.md`, section F). A pouch may also carry `counts`: the same pack photographed in twos and threes. A product's name in an address, a cart and a tag is its `handle`; the set's is `discovery-set`, and older names still lead to today's product in an address and a shop link (`?shop=<name>`).
- **Checkout**: the cart and "Pre-order now" build Shopify cart permalinks, carrying the Founding Member code and the email already given. "Pre-order now" goes straight to checkout for a member, with their code; for a visitor who has not joined it opens the cart instead, with the product in it, where the regular price and the way to join stand. A price for an amount is worked out in whole cents before the percentage is taken off, on every page as in the cart (`priceTimes` in `src/lib/cart/cart-math.ts`). Shopify charges what the store lists, so store prices must match.
- **Founding Members and the seasonal offer** (`src/data/campaign.ts`, `src/data/gift.ts`): the discount is a ladder: a base for joining with an email, a step for each of the pop-up's three questions and, where the offer has one, a last step for a phone number for texts. The standing ladder is 5% and 5% for each answer, 20% at most, with the codes `FOUNDER5` to `FOUNDER20`. While a campaign runs (`BLACK_FRIDAY`: switched `on`, until its `ends`), its own ladder (the same, plus 5% for a phone number: 25%), its codes (`FRIDAY5` to `FRIDAY25`) and its end date are the offer in force everywhere: the bar, the hero, the shop cards, product pages, the pop-up, the questions, the cart and the Shopify tags (`friday-5` to `friday-25`). **The site changes over by itself at the campaign's last moment** (`ends`, written in UTC: 11:59:59 pm on 30 November on the US Pacific coast). From then on every page, a tab left open included, and the server speak for the standing offer, with no new build: the offer in force is always worked out from the clock, on the server for each request (`stepsAt` in `src/data/gift.ts`) and in the browser through `useOffer` (`src/components/campaign/use-offer.ts`, `src/lib/offer/offer-clock.ts`). The browser starts from the offer the page was built with, so the page and the browser agree while it loads, and then follows the visitor's clock. A page built before the end therefore still carries the campaign in its first bytes until the browser takes over: make one new build after the end, at any convenient time, so that the pages are written with the standing offer too. A code for every step of both offers must exist under Discounts in Shopify before the end (`shopify/README.md`, section C, which also says what to type for the end of the campaign's codes). To end a campaign early, set `on` to false and build again.
- **Pre-order** (`src/data/presale.ts`): set `ships` once the ship date is decided; the store must keep selling when out of stock.
- **A subscription** (`src/data/ritual.ts`): planned for after launch and not sold. The questions say only that one is planned; no page offers it or collects a waitlist for it.
- **Wholesale** (`/wholesale`, `src/app/api/wholesale/route.ts`): an application that lands in Shopify as a customer with the details in its note and wholesale tags.
- **Email sign-ups** (`src/app/api/subscribe/route.ts`): every form adds the address to Shopify as a subscribed customer, tagged with the form it came from. It needs a small Shopify app's client ID and secret in the environment (`.env.example`); until then the forms work but keep nothing. Setup: `shopify/README.md`.

## To settle before launch

The pre-order ship date, Lemon's final label, the Black Friday percentages, codes and end date (`src/data/campaign.ts`), the Founding Member codes in Shopify, the Discovery Set and Lemon products in Shopify, whether and when a subscription opens, store policy pages for shipping, returns and texts, and photographs of the printed packs.

## Images

- **Photographs** (`src/assets/photos/`): the campaign pictures of the product in use, the harvest and the people. Pages import them through `src/data/photos.ts`, which also holds each alt line, and Next serves the size each screen needs. Add or replace one with `uv run --with pillow python scripts/sync-photos.py FOLDER [name]`. Words sit on a photograph only over the navy fade (`.photo-caption`).
- **Packs** (`public/packs/`): a studio photograph fills its panel (`cover` in `src/data/products.ts`); a cut-out or a render sits inside it. The line "Pre-production packaging shown. Final packs may vary." stays under the shop cards and the product pictures until the printed packs are photographed. Add or replace one with `uv run --with pillow python scripts/sync-packs.py FOLDER`. The picture follows the amount picked: one, two or three pouches; five, fifteen or thirty sticks (`shotFor` in `src/data/products.ts`). The pictures of the larger amounts are laid out from the studio photographs themselves, outside this repository, and brought in with the same script.
- **The first screen** (`src/components/home/hero.tsx`, `hero-sea.tsx`): four scenes on one ledge, each with its own headline, turning by themselves (a pause button, tabs, a swipe and the arrow keys also turn them). Every photograph is the same empty ledge, sea and sky with something standing on it, and the empty ledge lies under them all, so a change of scene is only what stands on the ledge changing: the scene leaving fades away and the next one arrives. The open sea drifts slowly: it is redrawn live on a clear sheet laid over the still, once for all four scenes, so it never repeats like a clip and never stops or starts again when the scene changes; the still stands alone for a visitor who asks for less motion or whose browser cannot draw it. A window wider than it is tall gets the words on the left; a taller one gets them above the picture. The first screen fills what is left under the bar and the header, whose height is measured in the page (`src/components/shell/top-height.tsx`), so on a phone its tabs are in view. New photographs: put the finished pictures (the empty ledge and one per scene) in a folder, name them in `scripts/hero-photos.py` and run it, then `scripts/hero-sea.py src/assets/photos`; needs a Mac. The first script brings them to one colour and one horizon and lifts what stands in each scene onto the empty ledge (a small, dark or clear object is found when it is given a box of its own); the second finds the open water. Both take `--check DIR` to look over what they found. The shop's water (`water-light.tsx`) is drawn the same way from one picture of sunlit shallows.
- Back panels of the packs are never shown: their label details are still being settled.
