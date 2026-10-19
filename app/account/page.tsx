import type { Metadata } from "next";
import Link from "next/link";

import { ProfileForm } from "@/components/account/profile-form";
import { SignOutButton } from "@/components/account/sign-out-button";
import { requireCustomer } from "@/lib/customer/session";
import { formatMoney } from "@/lib/shopify";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Account",
  // Nothing here should ever reach an index.
  robots: { index: false, follow: false },
};

// Per-customer. Never cached, never prerendered.
export const dynamic = "force-dynamic";

/*
 * TODO(points): the rewards programme Justin asked about is not here yet, and
 * nothing on this page hints at one until it is. Two things block it:
 *
 *   1. The earn and redeem rules are the business's to set — points per
 *      dollar, what a pouch costs in points, whether they expire. None of
 *      that gets guessed.
 *   2. A balance has to live somewhere. Customer metafields are readable over
 *      the Storefront API but only writable with an Admin token, which this
 *      repo is not allowed to hold. So the ledger needs either a Shopify
 *      loyalty app or a separate service that holds those credentials.
 *
 * The accounts layer below is what a points balance would hang off, so none
 * of this work is wasted either way.
 */

const DATE = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

/**
 * Shopify status enums are SCREAMING_SNAKE. Turning PARTIALLY_FULFILLED into
 * "Partially fulfilled" is a mechanical transform of Shopify's own value — it
 * never substitutes wording of ours.
 */
function humanise(value: string): string {
  const words = value.toLowerCase().replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export default async function AccountPage() {
  // Redirects to sign-in when there is no session.
  const { customer } = await requireCustomer();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>
            {customer.firstName ?? customer.displayName}
          </h1>
          <p className={styles.subtitle}>
            Member since {DATE.format(new Date(customer.createdAt))}
          </p>
        </div>
        <SignOutButton />
      </header>

      <section className={styles.section} aria-labelledby="details-heading">
        <h2 className={styles.sectionTitle} id="details-heading">
          Account
        </h2>

        <dl className={styles.details}>
          <div>
            <dt className={styles.detailKey}>Email</dt>
            <dd className={styles.detailValue}>{customer.email ?? "—"}</dd>
          </div>
          <div>
            <dt className={styles.detailKey}>Orders</dt>
            <dd className={styles.detailValue}>{customer.numberOfOrders}</dd>
          </div>
        </dl>

        {customer.defaultAddress && (
          <>
            <h3 className={styles.detailKey}>Default address</h3>
            {/* Shopify formats the address for its country; we print its own
                lines rather than assembling a US-shaped one. */}
            <address className={styles.address}>
              {customer.defaultAddress.formatted.map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </address>
            <p className={styles.addressNote}>
              Shipping and billing details are confirmed at checkout.
            </p>
          </>
        )}
      </section>

      <section className={styles.section} aria-labelledby="profile-heading">
        <h2 className={styles.sectionTitle} id="profile-heading">
          Your details
        </h2>
        <ProfileForm customer={customer} />
      </section>

      <section className={styles.section} aria-labelledby="orders-heading">
        <h2 className={styles.sectionTitle} id="orders-heading">
          Orders
        </h2>

        {customer.orders.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>No orders yet.</p>
            <Link href="/products" className={styles.emptyLink}>
              Browse the shop
            </Link>
          </div>
        ) : (
          <ul className={styles.orders}>
            {customer.orders.map((order) => (
              <li key={order.id} className={styles.order}>
                <div className={styles.orderHead}>
                  <h3 className={styles.orderNumber}>{order.name}</h3>
                  <p className={styles.orderTotal}>
                    {formatMoney(order.totalPrice)}
                  </p>
                </div>

                <p className={styles.orderMeta}>
                  <span>{DATE.format(new Date(order.processedAt))}</span>
                  {order.financialStatus && (
                    <span>{humanise(order.financialStatus)}</span>
                  )}
                  <span>{humanise(order.fulfillmentStatus)}</span>
                </p>

                <ul className={styles.orderLines}>
                  {order.lines.map((line, index) => (
                    <li
                      // Titles can repeat across lines, so the index is part
                      // of the key.
                      key={`${line.title}-${index}`}
                      className={styles.orderLine}
                    >
                      <span>
                        {line.title} × {line.quantity}
                      </span>
                      <span>{formatMoney(line.total)}</span>
                    </li>
                  ))}
                </ul>

                {/* Order status, tracking and reorder all live in Shopify.
                    We link out and stop. */}
                <a
                  className={styles.orderLink}
                  href={order.statusUrl}
                  aria-label={`View order ${order.name}`}
                >
                  View order
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
