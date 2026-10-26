# Shopify setup

Two jobs in the Shopify admin connect the new site to the store:

1. **Email sign-ups**: every form on the site lands in Shopify, and the team
   hears about each one. Do this before sharing the site.
2. **Close the old storefront**: Shopify's checkout links back to the old theme;
   a snippet sends those visitors to the new site. Do this at launch.

## 1. Email sign-ups

Every email form on the site (the footer, the gift card, The Ritual's waitlist)
adds the address to Shopify as a customer subscribed to email marketing, tagged
with where it came from:

| Tag | Means |
|---|---|
| `site-signup` | Signed up on the new site |
| `site-footer`, `site-quiz`, `site-ritual-shop`, … | The form they used |
| `welcome-10` | Was promised 10% off their next order |
| `ritual-waitlist` | Wants an email the day The Ritual opens |

Signing up twice from the same form changes nothing, so nobody is counted or
emailed twice. Until step A is done the forms still work, but nothing is kept.

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

### B. Email the team on every sign-up (Shopify Flow, 3 minutes)

1. Apps → Flow → Create workflow.
2. Trigger: **Customer tags added**.
3. Condition: Tags (the tags just added), at least one, starts with `site-`.
4. Action: **Send internal email** to admin@alassaltco.com. Subject "New sign-up
   on the website"; in the message, add the variables for the customer's email
   and the tags.
5. Turn the workflow on.

### C. Send the 10% code by email

The footer and the gift card promise 10% off, and both show the code on screen.
The email is the copy people keep. Shopify's ready-made "Welcome new
subscribers" automation only runs for Shopify's own storefront forms, so it will
not see sign-ups from this site. Build the same thing on the tag instead:

1. Marketing → Automations → create an automation (or a Flow workflow).
2. Trigger: **Customer tags added**. Condition: the added tags include
   `welcome-10`.
3. Action: **Send marketing email**, with the welcome message and the code.

The code in that email must be the one the site shows (`GIFT.code` in
`src/components/gift/gift-store.ts`, a placeholder until it is set) and must
exist under Discounts.

### D. The day The Ritual opens

In Customers, filter by the tag `ritual-waitlist`: that is the list to email.
Then set `sellingPlanId` in `src/data/ritual.ts` so the buttons start taking
orders.

### Test it

Sign up once on the site with your own address. Within a minute the customer
shows in Customers with the tags and "Subscribed", admin@ has the Flow email, and
the welcome email has arrived. If the site answers "We could not add you just
now", check the two Vercel values and that the app is installed.

## 2. Close the old storefront

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
