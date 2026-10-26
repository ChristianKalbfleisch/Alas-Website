# Shopify: close the old storefront

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

## When to install

At launch, once the new site is on its real domain. Until then the new site is an
unlisted preview, and sending the live store to it would take the store's pages
out of Google.

## How to install (2 minutes)

1. Shopify admin → Online Store → Themes.
2. On the current theme: `…` → Edit code.
3. Open `layout/theme.liquid`.
4. Paste the whole snippet right after the opening `<head>` tag.
5. Change `alas_site` to the new site's domain. Save.
6. Test: open the old store's home page and a product page; each should land on
   the new site. Then add something to the cart on the new site, go to checkout,
   and click the logo: it should come back to the new site.

To undo, delete the snippet and save.
