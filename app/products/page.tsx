import type { Metadata } from "next";

import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/shopify";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Shop",
  description: "Aegean mineral sea salt, hand-harvested.",
};

export default async function ProductsPage() {
  const products = await getProducts({ sortKey: "PRICE" });
  const withPlans = products.filter((p) => p.sellingPlanGroups.length > 0);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Álas Salt Co.</p>
        <h1>Shop</h1>
        <p className={styles.lede}>
          {products.length} products, live from Shopify.{" "}
          {withPlans.length === 0
            ? "No subscription plans are attached to any product yet."
            : `${withPlans.length} carry a subscription plan.`}
        </p>
      </header>

      <ul className={styles.grid}>
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </main>
  );
}
