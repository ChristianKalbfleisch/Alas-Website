# ALAS Salt Co. — storefront

A Next.js storefront for [alassaltco.com](https://alassaltco.com), replacing the
Framer frontend. Shopify stays underneath, unchanged: it owns the catalogue, the
cart and the checkout.

**New here?** Read [`docs/HANDOVER.md`](docs/HANDOVER.md) first. It covers what is
built, what is blocked and on whom, and the content rules — which are not
optional. [`CLAUDE.md`](CLAUDE.md) is the long-form record of every decision and
every open question behind the build.

**Bringing someone onto the project?** [`docs/ACCESS.md`](docs/ACCESS.md) is the
runbook for granting and revoking access across GitHub, Vercel and Shopify —
including which of the three actually unblocks the outstanding work, and the
offboarding checklist.

**Designing or briefing a tool?** [`docs/DESIGN-PROMPT.md`](docs/DESIGN-PROMPT.md)
is a paste-ready description of how the site should look, with the content
rules and the open decisions it must leave as placeholders.

## Running it

Node 20 or newer.

```bash
npm install
cp .env.example .env.local   # then add the Storefront token
npm run dev                  # http://localhost:3000
```

**One environment variable is required**: `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN`.
Get it from Shopify admin → Sales channels → Headless. The store domain and API
version both default in code and only need setting to override them.

Storefront tokens are public by design and safe in client code. An **Admin** API
token must never appear in this repo or in any client bundle.

```bash
npm run build     # production build
npm run lint      # eslint
npx tsc --noEmit  # typecheck
```

## Checking the Shopify data

The catalogue has known problems that the site inherits until they are fixed in
Shopify. Rather than trust a list, run it:

```bash
node scripts/audit-shopify.mjs
```

Read-only, one API call, and it exits non-zero while anything is outstanding.
Every failure it prints is a job for whoever has Shopify admin access.

## How it is put together

| Path | What lives there |
|---|---|
| `app/tokens.css` | Every colour, type size, space and radius. The single source of truth — nothing else hardcodes a hex or a pixel. |
| `app/` | Routes. Server components by default. |
| `components/` | UI, with its CSS Module beside it. No global styles that leak. |
| `lib/shopify/` | The typed Storefront client, product queries, cart and customer accounts. `server-only`. |
| `lib/cart/`, `lib/customer/` | Session cookies and server actions. |
| `scripts/` | The Shopify audit. |
| `/design-tokens` | A live page rendering the whole design system. Useful when styling. |

Three conventions worth knowing before changing anything:

- **Every Storefront query carries `@inContext(country: US)`.** Without it the
  catalogue and the cart disagree on currency.
- **Product handles arrive percent-encoded** and are decoded before they reach
  the API. Every handle currently contains Greek.
- **Checkout is Shopify's.** The cart hands off to `checkoutUrl` and stops.
  Nothing here touches payment.
