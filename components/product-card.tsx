import Image from "next/image";
import Link from "next/link";

import { formatMoney } from "@/lib/shopify";
import type { Product } from "@/lib/shopify";

import styles from "./product-card.module.css";

export function ProductCard({ product }: { product: Product }) {
  const subscription = product.sellingPlanGroups[0];
  const image = product.featuredImage;

  return (
    <article className={styles.card}>
      <Link href={`/products/${product.handle}`} className={styles.link}>
        <div className={styles.media}>
          {image ? (
            <Image
              src={image.url}
              // Shopify has no alt text on any product image yet. Falling back
              // to the title keeps this announced rather than silent.
              alt={image.altText ?? product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 25vw"
              className={styles.image}
            />
          ) : (
            <div className={styles.placeholder} aria-hidden="true" />
          )}
          {!product.availableForSale && (
            <span className={styles.badge}>Sold out</span>
          )}
        </div>

        <div className={styles.body}>
          <h3 className={styles.title}>{product.title}</h3>
          <p className={styles.price}>
            {formatMoney(product.price)}
            {product.compareAtPrice && (
              <span className={styles.compareAt}>
                {formatMoney(product.compareAtPrice)}
              </span>
            )}
          </p>
          {subscription && (
            <p className={styles.subscription}>{subscription.name}</p>
          )}
        </div>
      </Link>
    </article>
  );
}
