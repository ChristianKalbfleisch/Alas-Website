# ALAS Salt Co. website

The ALAS storefront: one scroll from the Aegean to your glass, with the shop built into the story. The word ἅλας, why salt, where it comes from, how to use it, rituals, a quiz with a gift, the shop, The Ritual subscription, grains (points) and the questions people ask. Next.js on Vercel; Shopify stays underneath for checkout through cart permalinks, so no API token is needed.

Preview: every page sends `noindex` until launch.

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build
pnpm test         # vitest
pnpm lint         # biome
pnpm typecheck
```

Every chapter also renders alone at `/lab/<chapter>`. `scripts/shoot.mjs` and `scripts/journey.mjs` screenshot the scroll for review (see their headers).

## Where things live

| Path | What lives there |
|---|---|
| `src/app/page.tsx` | The journey: chapters in page order |
| `src/sections/<key>/` | One folder per chapter |
| `src/app/products/[handle]` | Product pages |
| `src/app/account` | Grains (points) and the way to Shopify orders |
| `src/data/products.ts` | Catalogue: names, prices, Shopify variant ids, photos |
| `src/data/ritual.ts` | The Ritual subscription terms and its checkout link |
| `src/data/points.ts` | Grains: earn and spend rates |
| `src/data/offers.ts` | Offer terms shown site-wide |
| `src/components/cart/`, `src/lib/cart/` | Cart, drawer, plan picker, Shopify checkout |
| `src/app/globals.css` | Design tokens: colours, type, spacing, motion, liquid glass |
| `src/lib/motion/` | GSAP and Lenis smooth scrolling |
| `shopify/` | Snippet that sends the old storefront to this site (install at launch) |

## Commerce

- **Prices** (`src/data/products.ts`): one pouch $49.99, two pouches $99.98. Megálo and the boxes show "New price soon" and can't be added to the cart until their prices are set. Checkout charges what Shopify lists, so Shopify's prices need to match.
- **The Ritual** (`src/data/ritual.ts`): two pouches every month for $59.99, instead of $99.98. To switch it on, create a selling plan in Shopify (for example with the Shopify Subscriptions app) for the Mésos kit at $59.99 a month, then put the plan's id in `sellingPlanId`. Until then every Ritual button collects an email and takes no payment.
- **Grains** (`src/data/points.ts`, `/account`): proposed at 1 grain per $1, with 100 grains taking $5 off. Shown as "opening soon" until a points backend is connected (`live`).
- **Email sign-ups** (`src/app/api/subscribe/route.ts`): accepted but not stored yet. Connect the email tool there and every form on the site starts working.
- **Old storefront**: Shopify's checkout links back to the store's own pages. `shopify/README.md` explains the snippet that sends them here.

## To settle before launch

Harvest location on the map (shown as Kalloni, Lesvos), the gift code, testimonials (marked Preview), whether The Ritual's first order comes in the Welcome Box, flavour details, real product photography, the email tool and the points backend.

## Art

Photography, the usage sequence and the museum photographs are generated images; the hero water is a rendered loop. Product photos are the store's own.
