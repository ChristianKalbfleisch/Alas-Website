# Shopify setup

Three jobs in the Shopify admin connect the new site to the store:

1. **Email sign-ups and the Founding Member offer**: every form on the site
   lands in Shopify, the team hears about each one, and the Founding Member
   codes work at checkout. Do this before sharing the site.
2. **Wholesale applications**: the same connection files them. Nothing extra
   to set up beyond step 1.
3. **Close the old storefront**: Shopify's checkout links back to the old theme;
   a snippet sends those visitors to the new site. Do this at launch.

## 1. Email sign-ups and the Founding Member offer

Every email form on the site (the Founding Member pop-up, the footer, The
Ritual's waitlist) adds the address to Shopify as a customer subscribed to
email marketing, tagged with where it came from:

| Tag | Means |
|---|---|
| `site-signup` | Signed up on the new site |
| `site-gift`, `site-popup`, `site-presale`, `site-footer`, `site-quiz`, `site-ritual-shop`, … | The form they used |
| `founding-member-lead` | Joined the Founding Members (every sign-up except the two waitlists) |
| `friday-5`, `friday-10`, `friday-15`, `friday-20`, `friday-25` | The step of the offer they have reached, as a percentage off their pre-order (see C). Under the standing offer the tags are `founder-5` to `founder-20` |
| `pref-goal-…`, `pref-flavour-…`, `pref-learn-…` | Their answers to the pop-up's three questions |
| `ritual-waitlist` | Wants an email the day The Ritual opens |
| `discover-waitlist` | Wants an email the day the Discover Set can be bought |
| `site-lemon-pouch-hold`, `site-lemon-sticks-15-hold`, … | Reserved a Lemon product before it could be bought (they also join the Founding Members) |

**The Founding Member offer.** Everything on the site is a pre-order for now,
and everyone who pre-orders becomes a Founding Member. The discount is a
ladder. Joining with an email gives 5% off the pre-order. The pop-up asks three
quick questions (what brings them, which flavour they would try first, what
they want to hear about), and each answer adds 5%, up to 20%. During Black
Friday a phone number for texts adds a last 5%, for 25%. The questions can be
skipped: an email alone still claims the 5%. Someone who joined that way (in
the pop-up or the footer) can answer the questions or add a number later in the
pop-up, and each one raises their code. The code shows on screen, and checkout
applies it automatically on that device. The pop-up opens on its own once per
visitor (after a little browsing, or when they go to leave the browser window
on a computer); after that it opens from the "Join" links.

The pop-up also tells visitors that Founding Members get the Welcome Box free
at launch and better prices than everyone else on future orders. Customers
tagged `founding-member-lead` are everyone who joined through the site; those
who go on to pre-order are the Founding Members to honour that for (orders
that used one of the codes in C show them too).

The answers make segments: in Customers, filter by `pref-flavour-lemon` to
write to everyone who wants Lemon first, or by `pref-goal-training` for the
athletes.

Signing up again changes nothing, so nobody is counted or emailed twice,
unless they have since reached a higher step: that adds the higher tag, which
sends that step's email (see C). Until step A is done the forms still work, but
nothing is kept.

### A. Connect the site to the store (store owner, 5 minutes)

Shopify no longer makes apps inside the admin; a small private app now lives in
the Dev Dashboard.

1. Open the Dev Dashboard (from the Shopify admin: Settings → Apps → Develop
   apps, or dev.shopify.com) and create an app called "Website sign-ups".
2. On its version, choose the Admin API scopes `read_customers` and
   `write_customers`, then release the version.
3. Install the app on the store.
4. In the app's settings, copy the Client ID and the Client secret.
5. In Vercel, open the site's project → Settings → Environment Variables. Add
   `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET`, then redeploy.

Paste the secret straight into Vercel, never into a chat or an email. The site
trades it for a 24-hour key on its own. If the store already has an app made in
the admin before 2026, its Admin API token works instead: set
`SHOPIFY_ADMIN_TOKEN`. To try everything on a development store first, set
`SHOPIFY_STORE_DOMAIN` to that store's `.myshopify.com` address.

### B. Email the team on every sign-up and application (Shopify Flow, 3 minutes)

1. Apps → Flow → Create workflow.
2. Trigger: **Customer tags added**.
3. Condition: Tags (the tags just added), at least one, starts with `site-`.
4. Action: **Send internal email** to admin@alassaltco.com. Subject "New on the
   website"; in the message, add the variables for the customer's email, the
   tags and the customer's note (wholesale applications carry their details
   in the note).
5. Turn the workflow on.

### C. The Founding Member codes and the email that carries them

Create one discount code under Discounts for each step, each a percentage off
the order:

| Code | Off | Given for |
|---|---|---|
| `FRIDAY5` | 5% | Joining with an email (the pop-up, or the footer sign-up) |
| `FRIDAY10` | 10% | One question answered |
| `FRIDAY15` | 15% | Two questions answered |
| `FRIDAY20` | 20% | All three questions answered |
| `FRIDAY25` | 25% | All three answered, and a phone number for texts |

A phone number is worth 5% wherever it is added, so an email and a number
without any answers is `FRIDAY10`. Give the `FRIDAY` codes the campaign's end:
the end of Monday 30 November, Pacific time. The standing offer, in force once
the campaign is switched off, has no phone step and uses `FOUNDER5`,
`FOUNDER10`, `FOUNDER15` and `FOUNDER20`.

These are placeholders: the steps, the code names and the end date are set in
`src/data/campaign.ts`; change them there to match what the owners decide,
before launch. While creating the codes, decide whether each can be used once
per customer or on every pre-order.

The code is on screen and applied at checkout; the email is the copy people
keep. Shopify's ready-made "Welcome new subscribers" automation only runs for
Shopify's own storefront forms, so it will not see sign-ups from this site.
Build it on the tags instead:

1. Apps → Flow → Create workflow (or Marketing → Automations).
2. Trigger: **Customer tags added**. Condition: one of the added tags starts
   with `friday-` (or `founder-` under the standing offer).
3. Action: **Wait** 10 minutes. A member can climb more than one step in a
   sitting, and each step arrives as its own tag; the wait lets one email carry
   the step they ended on.
4. Check the customer's tags from the top step down: includes `friday-25` →
   **Send marketing email** with the Founding Member welcome and `FRIDAY25`;
   otherwise includes `friday-20` → the same email with `FRIDAY20`; and so on
   down to `friday-5`.
5. So nobody is sent the same code twice, have each branch add a tag such as
   `sent-friday-25` after sending, and skip the branch when that tag is
   already there.
6. Turn it on.

### D. Texts

When a visitor adds a phone number while joining (during Black Friday it is
the last step of the offer), it is saved on the customer and subscribed to SMS
marketing, with the consent wording shown beside the field. Nothing sends texts yet. Before anyone is
texted:

- Connect an SMS tool to Shopify (Shopify Messaging, or an SMS app).
- Add a Terms of Service page under Settings → Policies, with the text-message
  terms. The consent wording links to the privacy policy, which exists; there
  is no terms page yet.

### E. The day The Ritual opens

The Ritual is the Classic Pouch every 30 or every 90 days. In Customers,
filter by the tag `ritual-waitlist`: that is the list to email. Then create
the selling plans for the Classic Pouch (for example with the Shopify
Subscriptions app), and set its `price` and `sellingPlanId` in
`src/data/ritual.ts`, so the buttons start taking orders.

### F. The day the Discover Set opens

Create the Discover Set in Shopify (one Classic Pouch, four Classic sticks and
the ritual card), then set its `price` and `variantId` in
`src/data/products.ts`. Customers tagged `discover-waitlist` asked to hear
first.

### G. The day Lemon opens

Create the Lemon products in Shopify (the 390 g pouch, and sticks in packs of
5, 15 and 30), then set each one's `variantId` (and its price, if it differs
from Classic) in `src/data/products.ts`. Until then the site shows Lemon with
its price and takes a reservation by email instead of a payment. Customers
tagged `site-lemon-pouch-hold` or `site-lemon-sticks-…-hold` asked to hear
first.

### Test it

Open the Founding Member pop-up, choose "Skip and claim 5%" and join with your
own address and no phone number. Within a minute the customer shows in
Customers with the tags (`friday-5`, `founding-member-lead`) and "Subscribed",
and admin@ has the Flow email; after the wait, the `FRIDAY5` email arrives.
Then open the pop-up again and answer a question: `friday-10` and a `pref-…`
tag follow. Choose "Add a phone number for 5% more" and check that the next
step's tag and its email follow.
If the site answers "We could not add you just now", check the two Vercel
values and that the app is installed.

## 2. Wholesale applications

The wholesale page (`/wholesale`) files each application in Shopify with the
same app: a customer with the details in its note (business, contact, type,
place, website, phone, monthly order, products, message) and the tags
`site-wholesale`, `wholesale-applicant` and `wholesale-<kind>` (for example
`wholesale-gym`). Flow's email in step 1B tells the team. An applicant is only
subscribed to email marketing if they tick "Email me wholesale news". Filter
Customers by `wholesale-applicant` to see them all.

## Pre-orders

Everything on the site is a pre-order until the first run ships, so pre-order
mode is on (`PRESALE.on` in `src/data/presale.ts`). The announcement bar says
"Pre-order now · Founding Members save 15%" and opens the Founding Member
pop-up, buy buttons say "Pre-order", and the buy row and cart say "Pre-order:
we will email your ship date." until a date is set.

Before the store takes real pre-orders:

- Set `ships` to a date the store can keep (US mail-order rules expect orders
  to ship by the stated time, or within 30 days when none is stated, and buyers
  to be offered a refund if it slips).
- In Shopify, let the products keep selling when out of stock.
- Create the two Founding Member codes (step 1C).

To switch pre-order mode off later, set `on: false`; adding `?presale=1` to the
address still shows it for a look.

## 3. Close the old storefront

The new site sends shoppers to Shopify only for checkout. But Shopify's checkout
links back to the store's own pages: the logo, "Return to cart", and "Continue
shopping" on the order page all open the old theme. The snippet in
`redirect-old-storefront.liquid` closes that door: every old page hands the
visitor to the same place on the new site.

- Home, pages, collections and search go to the new site (the range at `/#shop`).
- Each product goes to the same product on the new site.
- "Return to cart" lands on the new site with the cart open.
- Checkout, customer accounts, order status, policies, app pages (subscriptions,
  loyalty) and the theme editor keep working as they are.

### When to install

At launch, once the new site is on its real domain. Until then the new site is an
unlisted preview, and sending the live store to it would take the store's pages
out of Google.

### How to install (2 minutes)

1. Shopify admin → Online Store → Themes.
2. On the current theme: `…` → Edit code.
3. Open `layout/theme.liquid`.
4. Paste the whole snippet right after the opening `<head>` tag.
5. Change `alas_site` to the new site's domain. Save.
6. Test: open the old store's home page and a product page; each should land on
   the new site. Then add something to the cart on the new site, go to checkout,
   and click the logo: it should come back to the new site.

To undo, delete the snippet and save.
