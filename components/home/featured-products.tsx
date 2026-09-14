import { ProductCard } from "@/components/product-card";
import { CtaLink } from "@/components/cta-link";
import type { Product } from "@/lib/shopify";

import styles from "./featured-products.module.css";

/**
 * Live catalogue, cheapest first, so the entry price leads.
 *
 * This stands in the slot the live site gives to a "Begin The Ritual" value
 * stack. That block is not reproduced — see the note in app/page.tsx.
 */
export function FeaturedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="shop-heading">
      <div className={styles.inner}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <p className={styles.eyebrow}>Begin the ritual</p>
            <h2 id="shop-heading" className={styles.heading}>
              A considered introduction to Aegean Mineral Salt, designed for
              daily use.
            </h2>
          </div>
          <CtaLink href="/products" variant="ghost">
            Shop All
          </CtaLink>
        </header>

        <ul className={styles.grid}>
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
