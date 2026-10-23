# Handover

Written 2026-10-20 for an incoming team. It says what is built, what is not,
what is waiting on a decision, and the rules that constrain the copy.

`CLAUDE.md` holds the long-form reasoning behind everything below. This is the
short version.

---

## 1. Read this part first: the content rules

These are not style preferences. They are the rules the build has followed
throughout, and the reason several things are deliberately missing.

**Never invent a number.** Catalogue prices and the three offer terms are
confirmed and free to use. Everything else — mineral counts, percentages,
shipping times, review counts, ratings — needs a marked `TODO` and a question,
never a plausible guess.

**Health claims: port, do not author.** Existing store copy gets reproduced as
written, hydration and electrolyte language included, because the business owns
that copy and its risk. Do not write new claims, and do not intensify existing
ones.

**Three figures and a phrase from the live site are deliberately not
reproduced.** They assert reductions in the risk of type 2 diabetes and stroke,
plus "clinically proven". Under FDA rules a disease risk-reduction claim needs
**pre-market authorization**; a food making one without it is treated as an
unapproved drug. **Citations do not fix this** — a doctor's endorsement is not
an authorization. Structure/function claims ("supports hydration") are the
allowed register: no pre-approval, but they need substantiation and the
disclaimer already in the footer.

Also unresolved and relevant to any comparative copy: unrefined sea salt does
contain trace minerals table salt lacks, but the amounts are small — roughly
3% of a day's magnesium in a 5 g serving — and the sodium per gram is the same.
Iodized table salt carries roughly 75× the iodine of plain sea salt, so
positioning ALAS as a wholesale replacement for table salt invites a real
iodine-intake objection. The recommendation on file is to get the product
lab-assayed, which converts every mineral claim from borrowed to owned.

**Do not write a founder story or an About bio.** That copy comes from the
business.

---

## 2. What is built

Verified in a browser against the live store, not just compiled.

| Area | State |
|---|---|
| Design tokens | Done. `app/tokens.css`, rendered live at `/design-tokens`. |
| Shopify data layer | Done. Typed client, products, cart, customers. |
| Header, footer, announcement bar | Done. |
| Homepage | Done, following the live site's section order, with three sections deliberately omitted (see §4). |
| Product page | Done — gallery, price, size selector, sanitised description, add to cart. |
| Cart → checkout | Done. Hands off to Shopify-hosted checkout. |
| Customer accounts | Done — sign up, sign in, sign out, profile, order history, password reset. Verified end to end. |
| Contact page | Done, as a `mailto`. **The address needs confirming** (see §3). |
| Redirects from the Framer URLs | Done for the 10 URLs that moved. Verified 308 → 200. |
| Collection page beyond `/products` | Not built. |
| About, FAQ, Science, The Ritual | **Not built.** Five live URLs currently 404 here. |
| `sitemap.xml`, `robots.txt` | Not built. |
| Rewards / points | Not built, and nothing on the site hints at one (see §5). |
| Deployment | **Never deployed.** No Vercel project exists yet. |

### What the product page cannot do yet

The three salt kits and the three sticks packs are **separate products, not
variants** — every product is a single `Default Title` variant, and Shopify has
no product type or tags to group them. So the size selector derives its family
by **parsing titles**, which breaks silently the moment a product is renamed.
The durable fix is a product type, a shared tag, or real variants. It is in the
audit script as a failing check.

---

## 3. Waiting on the business

Nothing in this list can be guessed at. Several are numbers that contradict a
confirmed one.

**Blocks launch**

- **Shipping and returns policies.** The shipping *offer* is settled — free
  anywhere in the USA, no threshold. The *policies* are not: the refund
  mechanics behind the 30-day guarantee, shipping times, terms of service and
  subscription cancellation are all missing. In Shopify only the privacy policy
  is filled in.
- **About copy**, which has to come from the business.
- **Five missing pages** (§2). Two of them — FAQ and Science — can be ported
  from the live site with no new decisions. About is blocked. The Ritual depends
  on the subscription question below.

**Contradictions to resolve**

- **The subscription price is upside down.** The figure given was "2 bags for
  $59.99 a month". Two bags is the Mésos Balance Kit, which the store sells
  outright for **$34.99** — so the subscription is $25 *more* than buying the
  same thing, and it makes "save up to 20% on subscriptions" false. $59.99 is
  exactly Megálo's list price, the **four**-bag kit, so the likeliest reading is
  a miscounted bag. No subscription selector is built until the count and the
  price agree.
- **The Welcome Box price.** Given as $79.99; Shopify says **$74.99**. The site
  renders whatever the API returns, so it shows $74.99 until Shopify changes.
  The figure is never hardcoded over the gap.
- **The free Welcome Box with a subscription** ships roughly $115 of goods at
  list for $59.99 collected — 48% below list, in month one. Flagged because the
  business itself raised margin as a concern.
- **Flavours (Regular, Blueberry, Lemon) are real but not in Shopify.**
  Confirmed 2026-10-21, on the salt pouches and the Hydration Sticks; the store
  still has eight products, one plain variant each, no flavour option. The site
  can only sell what Shopify has. Still needed: new wording for flavoured
  versions, since the current sticks copy says "No sugar, flavours, or
  fillers".
- **Stick weight: 1 g, 2 g or 5 g?** Christian says 1 g, the store says
  2 g, and the co-packer's invoice says 5 g packets. The sticks' product
  photos are AI-generated, so the "2g" printed on them is not evidence.
  Nothing changed until a real stick or the co-packer's spec settles it.
  New sticks (2026-10-23): 4-inch slim format targeting 2–2.5 g, awaiting
  the co-packer's confirmed fill weight.
- **The investor deck disagrees with the site in places**: "Made and packaged
  in the USA", three trace-mineral counts (72+, up to 84, 80+), three Welcome
  Box contents lists. Details in `CLAUDE.md`. Don't port deck copy to the site
  without checking it there first.
- **The contact address.** Given as `info@alassalt.com`, but the store and site
  are `alassalt**co**.com`. One is wrong and mail to the wrong one vanishes.
  Marked `TODO` in `app/contact/page.tsx`.
- **Subscriptions: keep or drop.** Zero of eight products are attached to the
  plan, re-verified three times. If subscriptions are dropped, three things must
  come off the site in the same change, because each advertises something
  unbuyable: "save up to 20% on subscriptions" in the footer, the Ritual
  Subscription on the membership page, and the free Welcome Box. The confusion
  that prompted the question is a name collision — "The Ritual" is both the
  brand motto and the literal name someone gave the Shopify selling plan.
  Renaming the plan to "Subscribe & Save" resolves it.

**Still outstanding**

Real product photography (13 of 17 images are AI-generated — the filenames say
so); the licensed display typeface, so `--font-display` can stop falling back to
a serif stack; unit cost and real shipping cost, the only two inputs missing
from the margin maths; one spelling of the brand ("Álas" in the store, "ALAS" on
the packaging); retailers for the "Trusted by Retailers" section, or a decision
to drop it; and whether the Greek in product titles is decorative or a real
localisation intent.

---

## 4. Three homepage sections deliberately not reproduced

Each is live on alassaltco.com today and each needs a decision.

- **"Trusted by Retailers Who Value Craftsmanship"** claims the trust of
  "leading retailers and wellness partners" and shows no retailer at all.
- **The "Begin The Ritual" value stack** lists a Refill Pouch, a Forever Jar and
  a Signature Water Bottle at $49/$9/$12/$20. ALAS sells none of those and none
  of those prices is in the catalogue — it is another brand's product naming,
  left in the Framer template and never replaced. The real catalogue takes its
  place here.
- **"Explore the Benefits / WHY SALT?"** covers salt baths, inhalers and scrubs,
  none of which ALAS sells, and one card claims relief of asthma and allergy
  symptoms.

---

## 5. Rewards and points

Asked for, not built, and nothing on the site hints at one. Two blockers:

1. The earn and redeem rates are the business's to set.
2. **A balance has to live somewhere.** Customer metafields are readable over
   the Storefront API but only **writable** with an Admin token, which this repo
   is not allowed to hold. So the ledger needs either a Shopify loyalty app
   (Smile.io, Rivo, LoyaltyLion) or a separate service holding those
   credentials. Not this codebase.

The accounts layer is what a balance would hang off, so that work is not wasted
either way. Worth knowing: there is no standalone pouch SKU, so the smallest
thing a "free pouch" reward can redeem for is the Mikró kit at $19.99.

The welcome discount that was approved is a **private** rotating code for
friends, family and influencers — not the public every-visitor modal of the
reference screenshot. That needs no site UI at all. Per-person codes would be
cheaper to run than one rotating shared code, and they attribute sales to the
person who drove them.

---

## 6. Launching

**Nothing is deployed.** To get a shareable URL: create a Vercel project from
this repo, set `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN`, deploy.

Two things to know first:

- **The repo's default branch is `claude/new-session-1byzeh`**, not `main`.
  Vercel deploys the default branch to production, and `main` still holds the
  old Liquid theme. Sort this out before connecting.
- **The repo is public.** The Storefront token has never been committed and
  `.gitignore` covers it, so nothing is leaked — but everything here is
  readable, this document included.

### Before the domain cutover

- [ ] The five missing pages exist, or their URLs redirect somewhere sensible
- [ ] `sitemap.xml` and `robots.txt`
- [ ] Shipping, returns and terms written, on the site and in Shopify
- [ ] The Shopify audit passes, or every remaining failure is a known accepted risk
- [ ] Product handles settled. They are about to change — the Greek is being
      replaced — and each old handle then needs its own redirect rule, because
      the prefix rule in `next.config.ts` only rewrites the directory. Build the
      map from the API after the rename rather than guessing a transliteration.
- [ ] The free-shipping threshold removed in Shopify's own shipping settings,
      to match what the site now says
- [ ] A social share image

The DNS switch itself takes minutes. It is the last step, not the hard one.
