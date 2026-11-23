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

Three forms on the site take an email address:

- **The Founding Member pop-up.** It opens from the bar at the top, the offer
  on the home page, the line under every price, the cart and the footer, and
  once by itself.
- **The footer's sign-up.**
- **The cart's pre-order by email** (see F), for products that are not in
  Shopify yet.

A product that has no price yet shows a fourth, "Tell me when it opens", in
place of its buy buttons. No product is in that state today.

Each adds the address to Shopify as a customer subscribed to email marketing,
tagged with where it came from:

| Tag | Means |
|---|---|
| `site-signup` | Signed up on the new site |
| `site-popup`, `site-bar`, `site-founding`, `site-shop`, `site-quick-shop`, `site-product`, `site-cart`, `site-footer`, `site-gift` | Where they joined. The pop-up when it opened by itself is `site-popup`; opened from the bar, the home page's offer, a shop card, the quick shop, a product page, the cart or the footer it carries that place's name, and `site-gift` from anywhere else. `site-footer` is also the footer's own form |
| `founding-member-lead` | Joined the Founding Members (every sign-up except a waitlist) |
| `friday-5`, `friday-10`, `friday-15`, `friday-20`, `friday-25` | The step of the offer they have reached, as a percentage off their pre-order (see C). From the moment Black Friday ends the site writes `founder-5` to `founder-20` instead, by itself |
| `pref-goal-…`, `pref-flavour-…`, `pref-learn-…` | Their answers to the pop-up's three questions |
| `site-<product>-hold`, for example `site-discovery-set-hold` | Asked to hear when a product that has no price yet opens. No form sends this today |
| `discovery-waitlist`, `ritual-waitlist` | Waitlists the site can keep: for a form whose name starts with `discover` (the Discovery Set while it had no price) or with `ritual`. No form on the site collects either today, so both lists start empty |
| `site-preorder`, `site-preorder-lemon-pouch`, `site-preorder-discovery-set`, …, `site-preorder-20261121`, `site-preorder-ref-k7q2mxd9` | Placed a pre-order by email in the cart, with no payment, for products that are not in Shopify yet: one tag for the pre-order, one for each product, one for the day (counted in US Pacific time) and one for the pre-order's own reference, which is new every time. What they ordered is in the customer's note (see F). They are Founding Members like anyone who pre-orders, and they are owed a link to pay before it ships |

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

The pop-up also tells visitors that Founding Members get early access to the
Welcome Box and better prices than everyone else on future orders. Customers
tagged `founding-member-lead` are everyone who joined through the site; those
who go on to pre-order are the Founding Members to honour that for (orders
that used one of the codes in C show them too).

The answers make segments: in Customers, filter by `pref-flavour-lemon` to
write to everyone who wants Lemon first, or by `pref-goal-training` for the
athletes.

Signing up again changes nothing, so nobody is counted or emailed twice,
unless they have since reached a higher step: that adds the higher tag, which
sends that step's email (see C). Until step A is done the forms still work, but
nothing is kept, and the site says so on screen ("Not saved: this preview is
not connected to the store yet.") in place of a welcome. A device that joined
during that time remembers its address and its answers and sends its sign-up
once more, by itself, the next time its visitor opens the pop-up or uses a
form. A phone number is not remembered, so it has to be typed again.

The step a customer is tagged with is worked out by the site's server, not
taken from the page: 5% for the email, 5% for each answer that came with the
sign-up, and the phone step only for a number that came with it or a customer
who already gets texts.

Every email form signs the address up for email marketing, and says so beside
its button ("You agree to marketing emails from ALAS; unsubscribe anytime.").
A customer who had unsubscribed and uses one of these forms again is
subscribed again. The cart's pre-order form (see F) is the exception: it never
switches marketing back on for someone who had unsubscribed.

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
without any answers is `FRIDAY10`.

**When Black Friday ends.** The site ends the campaign by itself, with no new
build and nobody at a desk, at **2026-12-01 07:59:59 UTC**. That is 11:59:59 pm
on Monday 30 November on the US Pacific coast, so "November 30" is a whole day
in every US time zone. From that moment every page, a tab left open included,
and every sign-up use the standing offer:

| Code | Off | Given for |
|---|---|---|
| `FOUNDER5` | 5% | Joining with an email |
| `FOUNDER10` | 10% | One question answered |
| `FOUNDER15` | 15% | Two questions answered |
| `FOUNDER20` | 20% | All three questions answered |

The standing offer has no phone step: a number is still saved for texts, but it
adds nothing. A member who reached 25% during Black Friday is shown and charged
20% afterwards, with `FOUNDER20`. Sign-ups are tagged `founder-5` to
`founder-20` from then on, and a pre-order by email that still carries Black
Friday's 25% is refused, so nothing is recorded at an offer that has ended.

So the codes need two things:

1. Create the four `FOUNDER` codes now, with no end date, so that they work the
   moment the site changes over.
2. Give the five `FRIDAY` codes that same end. Shopify takes the time on the
   store's own clock (Settings → General shows its time zone). When the store's
   clock is Vancouver, which is one hour ahead of US Pacific this winter, type
   **12:59 am on Tuesday 1 December**. Then compare: the end the admin shows
   for each code must be the same hour and minute as 07:59 UTC on 1 December,
   which is 11:59 pm US Pacific on 30 November. A code must never end before
   the site does (07:59:59 UTC), or the site would still add a code the store
   has stopped taking. If the admin takes the end to the minute only and the
   code might stop at the start of that minute, end it a minute later, at
   1:00 am: that does no harm, because the site stops handing out `FRIDAY`
   codes at its own end whatever the codes say.

The end is `ends` in `src/data/campaign.ts`. If it is changed there, change the
codes' end to match. To end the campaign early, set `on` to false there and
build again.

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
   with `friday-`.
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
7. Before Black Friday ends, build the same workflow for the standing offer:
   tags starting with `founder-`, from `founder-20` down to `founder-5`, with
   the `FOUNDER` codes. The first sign-up after the change-over then gets its
   email without anyone having to be there.

### D. Texts

When a visitor adds a phone number while joining (during Black Friday it is
the last step of the offer), it is saved on the customer and subscribed to SMS
marketing, with the consent wording shown beside the field. A number that was
already on the customer and never had texts is subscribed too. Nothing sends
texts yet. Before anyone is texted:

- Connect an SMS tool to Shopify (Shopify Messaging, or an SMS app).
- Add a Terms of Service page under Settings → Policies, with the text-message
  terms. The consent wording links to the privacy policy, which exists; there
  is no terms page yet.

### E. A subscription, later

The site sells no subscription and collects no waitlist for one. Its questions
say only: "Not yet. We plan one after launch, and Founding Members hear
first." So when one opens, the people to tell are the Founding Members
(`founding-member-lead`), not a waitlist: the tag `ritual-waitlist` exists in
the site's code, but no form adds it today.

The plan on file is the Classic Pouch every 30 or every 90 days
(`src/data/ritual.ts`). To open it, create the selling plans for the Classic
Pouch (for example with the Shopify Subscriptions app) and set `price` and
`sellingPlanId` there. The site has no subscribe button yet: one has to be
built before anyone can order it.

### The four products already in the store

Checkout shows and charges what the store lists, not what this site shows. The
four products the site already sends to checkout must carry the site's names,
sizes and prices in Shopify (Products → the product → title, price, SKU):

| On the site | Price |
|---|---|
| Classic Pouch, 390 g | $49.99 |
| Classic Sticks, pack of 5 (2.5 g each) | $12.99 |
| Classic Sticks, pack of 15 | $32.49 |
| Classic Sticks, pack of 30 | $64.99 |

Renaming and re-pricing an existing product keeps its variant id, so the site
needs no change. Give each stick pack its own SKU, and set all four to keep
selling when out of stock. Do this before any discount is switched on, so a
code never applies to an old price.

### F. Lemon and the Discovery Set in checkout

Everything on the site is a pre-order, Lemon and the Discovery Set as much as
Classic: the same prices for Lemon as for Classic, the same buttons, the same
cart. Shopify's checkout can only charge for a product that exists in the
store, and these do not yet. So today the cart sends the Classic items to
checkout and takes the rest as a pre-order by email, with no payment. The
shopper sees "Pre-order placed" only once the store has saved it; if it could
not be saved, the items stay in the cart and the screen says so.

Each pre-order by email is written to the customer in Shopify:

- Tags: `site-preorder`, one `site-preorder-<product>` for each product, one
  for the day (`site-preorder-20261121`) and one for the pre-order's own
  reference (`site-preorder-ref-k7q2mxd9`). The reference is new for every
  pre-order, so the Flow rule in B emails the team each time, also for a second
  pre-order of the same product on the same day.
- Note: one block per pre-order. It reads like this:

  ```
  Pre-order by email, ref k7q2mxd9, 2026-11-21 US Pacific time (website)
  Lemon Pouch × 1, $49.99 each, $49.99
  Lemon Sticks (pack of 5) × 2, $12.99 each, $25.98
  Total: $75.97
  Confirmed to the shopper: 5% off, $72.17 to pay
  ```

  The first line carries the reference and the day; the day is the date on the
  US Pacific coast, so a pre-order placed on the evening of 30 November there
  is dated 30 November. Then every product with its quantity, the price of one
  and the line's amount, and the total. The last line is what the shopper's
  confirmation said: that amount is what the link to pay should charge. An
  earlier note is kept; the block goes under it.

**The price is set when the pre-order is placed.** The cart says so to anyone
who could still earn more ("This price is set when you place the pre-order. To
pay less, build your discount first."). A customer who climbs to a higher step
afterwards keeps the percentage in the note for that pre-order; the pop-up
tells them so. Charge the note's last line, not the customer's highest tag.

**The percentage in the note is checked.** The server records no more than the
request and the store's record back: the email, a step for each answer sent
with the pre-order, and the phone step only for a customer who already gets
texts. If a page asks for more than that, the pre-order is recorded at what is
backed, the shopper's confirmation shows that figure, and the note gains a
line saying what the cart had shown. The server also compares the figure the
cart showed with its own; if they differ (a price changed while the page was
open), nothing is written and the shopper is asked to reload.

**One pre-order is written once.** The shopper's browser gives each pre-order
its reference before it is sent and sends the same one on every try. If a try
fails half-way, or its answer is lost, the next try finds the reference in the
note, adds only what is missing and tells the shopper it is placed. So two
blocks with different references are two pre-orders, each confirmed to the
shopper on screen. The same reference on two customers means the shopper
corrected the address between two tries: it is one pre-order, and the second
address is the one they meant.

**What the shopper is told when it is not kept.** The items stay in the cart
every time. If the store cannot be reached: "We could not confirm your
pre-order. Try again: it will not be counted twice." If the page is out of
date: "This page is out of date. Reload it; your cart is kept." If the
customer's note has no room left (the site writes at most 5,000 characters to
a note; one pre-order takes about 170 to 470 of them): "We could not add this
pre-order to your record. Please write to admin@alassaltco.com." Shorten that
customer's note in Shopify and they can pre-order by email again.

**The shopper's only written record is the invoice you send.** The site sends
no email itself. The confirmation stays in the shopper's cart on that device
until they hide it, with the lines, the amount, the address, the day and the
reference, but nothing reaches their inbox until the link to pay does. Send it
soon after the pre-order comes in, and quote the reference in it: it is also
how a mistyped address comes to light.

**Marketing consent.** The cart's form says "We email you about this
pre-order. You also agree to marketing emails from ALAS; unsubscribe anytime."
A new address is subscribed. A customer who had unsubscribed stays
unsubscribed: the site writes only the note and the tags for them. They are
still owed the link to pay; whether the welcome email in C reaches them is up
to Shopify's rules for marketing email.

Orders that go through checkout from this site carry "Website: Pre-order" in
the Notes section of the order's page, so they can be told from orders placed
on the store's own pages.

To send the link to pay: Orders → Drafts → Create order, pick the customer,
add the products from the note (as custom items until the products exist),
apply the discount the note's last line shows, then Send invoice, with the
reference in the message. The customer pays from that email, and the order
appears in Orders like any other.

To take payment for them like Classic, create them in Shopify:

| Product | Price |
|---|---|
| Lemon pouch, 390 g | $49.99 |
| Lemon sticks, pack of 5 | $12.99 |
| Lemon sticks, pack of 15 | $32.49 |
| Lemon sticks, pack of 30 | $64.99 |
| Discovery Set (one Classic pouch, four Classic sticks, the ritual card) | $39.00 |

Set each to keep selling when out of stock, like the Classic products, then
put each one's variant id in `src/data/products.ts` (`variantId`). From that
moment it goes through checkout exactly like Classic and the pre-order by
email no longer appears. Name the set's product "Discovery Set"; the site's
own name for it, in its page address and in the tags above, is
`discovery-set`.

### Test it

Open the Founding Member pop-up, choose "Skip and claim 5%" and join with your
own address and no phone number. (On a device that already joined while the
site was not connected, opening the pop-up is enough: it sends that sign-up
again by itself, and "Not saved" gives way to the welcome.) Within a minute the
customer shows in Customers with the tags (`friday-5`, `founding-member-lead`)
and "Subscribed", and admin@ has the Flow email; after the wait, the `FRIDAY5`
email arrives. (From the end of Black Friday the tags and codes read
`founder-5` and `FOUNDER5`, and so on.)
Then open the pop-up again and answer a question: `friday-10` and a `pref-…`
tag follow. While Black Friday runs, choose "Add a phone number for 5% more"
and check that the next step's tag and its email follow; after it there is no
phone step.
If the site answers "We could not add you just now", check the two Vercel
values and that the app is installed.

Then put a Lemon Pouch in the cart and pre-order it by email. The cart shows
"Pre-order placed" with a reference; the customer's note holds the block with
that reference, and the tags include `site-preorder-ref-` followed by it.

## 2. Wholesale applications

The wholesale page (`/wholesale`) files each application in Shopify with the
same app: a customer with the details in its note (business, contact, type,
place, website, phone, monthly order, products, message) and the tags
`site-wholesale`, `wholesale-applicant` and `wholesale-<kind>` (for example
`wholesale-gym`). Flow's email in step 1B tells the team. An applicant is only
subscribed to email marketing if they tick "Email me wholesale news". Filter
Customers by `wholesale-applicant` to see them all.

## Pre-orders

Everything on the site is a pre-order until the first run ships. Beside "Add
to cart", the short way to buy says "Pre-order now", and the cart and each
product's "Shipping and returns" say "Pre-order: we will email your ship
date." until a date is set.

The bar at the top carries the offer in force and opens the Founding Member
pop-up. While Black Friday runs it reads "Black Friday: up to 25% off
pre-orders." with the time left beside it on a computer; from the campaign's
end it reads "Pre-order now. Founding Members save up to 20%." Its link says
"Claim it", or "Your code" for someone who has joined.

Before the store takes real pre-orders:

- Set `ships` to a date the store can keep (US mail-order rules expect orders
  to ship by the stated time, or within 30 days when none is stated, and buyers
  to be offered a refund if it slips).
- In Shopify, let the products keep selling when out of stock.
- Create the Founding Member codes (step 1C).

The switch `PRESALE.on` in `src/data/presale.ts` does one thing: while it is
on, every checkout link marks its order "Website: Pre-order" (see F). Setting
it to `false` only drops that mark. The buttons, the bar and the ship line say
"Pre-order" either way, so ending pre-orders at launch is a change to the
site's wording, not this switch.

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
