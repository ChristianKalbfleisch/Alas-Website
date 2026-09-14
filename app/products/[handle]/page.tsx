import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCart } from "@/components/add-to-cart";
import {
  formatMoney,
  getProduct,
  getProducts,
  getSizeGroup,
  sanitiseDescription,
} from "@/lib/shopify";

import styles from "./page.module.css";

type Params = { params: Promise<{ handle: string }> };

/**
 * Every product handle contains Greek characters, so every product URL is
 * percent-encoded. Next hands the route param through still encoded, and the
 * Storefront API wants the decoded handle — without this, every product page
 * 404s. Verified against the running app, not assumed.
 *
 * decodeURIComponent throws on a malformed sequence, which a crawler or a
 * hand-typed URL can easily produce, so a bad escape falls back to the raw
 * value and ends up a clean 404 rather than a 500.
 */
function decodeHandle(handle: string): string {
  try {
    return decodeURIComponent(handle);
  } catch {
    return handle;
  }
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(decodeHandle(handle));
  if (!product) return { title: "Not found" };

  // Shopify has no SEO title or description on any product, so fall back to
  // the product's own fields rather than leaving these empty.
  return {
    title: product.seo.title ?? product.title,
    description: product.seo.description ?? product.description.slice(0, 160),
    openGraph: product.featuredImage
      ? { images: [{ url: product.featuredImage.url }] }
      : undefined,
  };
}

export default async function ProductPage({ params }: Params) {
  const { handle } = await params;
  const [product, all] = await Promise.all([
    getProduct(decodeHandle(handle)),
    getProducts(),
  ]);

  if (!product) notFound();

  const variant = product.variants[0];
  const sizes = getSizeGroup(product, all);
  const description = sanitiseDescription(product.descriptionHtml);
  const gallery = product.images.length
    ? product.images
    : product.featuredImage
      ? [product.featuredImage]
      : [];

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/products" className={styles.breadcrumbLink}>
          Shop
        </Link>
        <span aria-hidden="true">/</span>
        <span>{product.title}</span>
      </nav>

      <div className={styles.layout}>
        <div className={styles.gallery}>
          {gallery.map((image, index) => (
            <div key={image.url} className={styles.figure}>
              <Image
                src={image.url}
                // No Shopify image has alt text. The first image describes the
                // product; the rest are extra views, so they are decorative
                // rather than repeating the same name three times.
                alt={index === 0 ? (image.altText ?? product.title) : ""}
                fill
                priority={index === 0}
                sizes="(max-width: 60rem) 100vw, 45vw"
                className={styles.image}
              />
            </div>
          ))}
          {gallery.length === 0 && (
            <div className={styles.figure}>
              <div className={styles.placeholder} aria-hidden="true" />
            </div>
          )}
        </div>

        <div className={styles.detail}>
          <header className={styles.header}>
            <h1 className={styles.title}>{product.title}</h1>
            <p className={styles.price}>
              {formatMoney(product.price)}
              {product.compareAtPrice && (
                <span className={styles.compareAt}>
                  {formatMoney(product.compareAtPrice)}
                </span>
              )}
            </p>
          </header>

          {sizes && (
            <div className={styles.sizes}>
              <p className={styles.sizesLabel}>{sizes.label}</p>
              <ul className={styles.sizeList}>
                {sizes.options.map((option) => (
                  <li key={option.handle}>
                    <Link
                      href={`/products/${option.handle}`}
                      className={styles.size}
                      aria-current={option.current ? "page" : undefined}
                      data-current={option.current || undefined}
                    >
                      {option.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {variant ? (
            <AddToCart
              variantId={variant.id}
              price={product.price}
              available={product.availableForSale}
              sellingPlanGroups={product.sellingPlanGroups}
            />
          ) : (
            <p className={styles.unavailable}>
              This product has no variant in Shopify and cannot be bought.
            </p>
          )}

          {product.sellingPlanGroups.length === 0 && (
            <p className={styles.noPlan}>
              Subscription not available on this product yet.
            </p>
          )}

          {description && (
            <div
              className={styles.description}
              // Sanitised in lib/shopify/description.ts — an allowlist of
              // structural tags, no attributes except safe hrefs.
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
