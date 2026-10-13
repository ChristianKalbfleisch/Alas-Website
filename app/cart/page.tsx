import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { getSessionCart } from "@/lib/cart/session";
import { formatMoney } from "@/lib/shopify";

import styles from "./page.module.css";

export const metadata: Metadata = { title: "Cart" };

// Cart contents are per-visitor and must never be cached or prerendered.
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const cart = await getSessionCart();
  const lines = cart?.lines ?? [];

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Cart</h1>

      {lines.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>Your cart is empty.</p>
          <Link href="/products" className={styles.emptyLink}>
            Browse the shop
          </Link>
        </div>
      ) : (
        <div className={styles.layout}>
          <ul className={styles.lines}>
            {lines.map((line) => (
              <li key={line.id} className={styles.line}>
                <div className={styles.media}>
                  {line.merchandise.product.featuredImage ? (
                    <Image
                      src={line.merchandise.product.featuredImage.url}
                      alt=""
                      fill
                      sizes="88px"
                      className={styles.image}
                    />
                  ) : (
                    <div className={styles.placeholder} aria-hidden="true" />
                  )}
                </div>

                <div className={styles.lineBody}>
                  <Link
                    href={`/products/${line.merchandise.product.handle}`}
                    className={styles.lineTitle}
                  >
                    {line.merchandise.product.title}
                  </Link>
                  {line.sellingPlanName && (
                    <p className={styles.plan}>{line.sellingPlanName}</p>
                  )}
                  <p className={styles.quantity}>Quantity {line.quantity}</p>
                </div>

                <p className={styles.lineCost}>
                  {formatMoney(line.cost.totalAmount)}
                </p>
              </li>
            ))}
          </ul>

          <aside className={styles.summary} aria-label="Order summary">
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>{cart && formatMoney(cart.cost.subtotalAmount)}</span>
            </div>
            <p className={styles.summaryNote}>
              Shipping and tax are calculated at checkout.
            </p>

            {/* Hand-off point. Everything past here is Shopify's: payment,
                tax, fulfilment. We do not touch any of it. */}
            <a className={styles.checkout} href={cart?.checkoutUrl ?? "#"}>
              Checkout
            </a>

            <Link href="/products" className={styles.keepShopping}>
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
