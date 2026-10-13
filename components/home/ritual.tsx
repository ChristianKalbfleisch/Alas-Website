import { CtaLink } from "@/components/cta-link";
import type { Product } from "@/lib/shopify";

import styles from "./ritual.module.css";

/**
 * Copy verbatim from the live site.
 *
 * The CTA is derived from live Shopify data rather than assumed. The Ritual
 * plan exists in Shopify but is attached to no product, so on the live site
 * "Join the Ritual Now" leads to nothing purchasable. Rather than reproduce a
 * dead promise, this links to the first product that actually carries a
 * selling plan, and says plainly that it is not yet open when none does.
 *
 * The moment Justin attaches the plan in Shopify, the CTA appears on its own.
 */
export function Ritual({ products }: { products: Product[] }) {
  const subscribable = products.find((p) => p.sellingPlanGroups.length > 0);

  return (
    <section
      className={styles.section}
      data-surface="black"
      aria-labelledby="ritual-heading"
    >
      <div className={styles.inner}>
        <h2 id="ritual-heading" className={styles.heading}>
          The Ritual &mdash; Your Hydration Subscription Membership
        </h2>

        <div className={styles.body}>
          <p className={styles.lede}>
            Experience complete hydration support with a monthly subscription to
            Aegean Mineral Salt.
          </p>
          <p className={styles.text}>
            Your first order includes a complimentary Welcome Box with the
            canister, glass water bottle, stainless steel spoon, 5 hydration
            sticks for when you are on the go
          </p>

          <div className={styles.actions}>
            {subscribable ? (
              <CtaLink href={`/products/${subscribable.handle}`}>
                Join the Ritual Now
              </CtaLink>
            ) : (
              <CtaLink href="/products">Shop All</CtaLink>
            )}
          </div>

          {!subscribable && (
            <p className={styles.pending}>
              Subscriptions are not open yet &mdash; the Ritual plan is not
              attached to a product in Shopify. This becomes a sign-up the
              moment it is.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
