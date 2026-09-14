import "server-only";

import { flatten, storefront } from "./client";
import { PRODUCT_FRAGMENT } from "./fragments";
import type {
  Image,
  Money,
  Product,
  ProductVariant,
  SellingPlanGroup,
} from "./types";

/* -------------------------------------------------------------------------
 * Raw Storefront shapes. Kept local — nothing outside this file sees them.
 * ---------------------------------------------------------------------- */

type Connection<T> = { edges: { node: T }[] };

type RawSellingPlan = {
  id: string;
  name: string;
  recurringDeliveries: boolean;
  priceAdjustments: {
    adjustmentValue: { adjustmentPercentage?: number };
  }[];
};

type RawProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  availableForSale: boolean;
  updatedAt: string;
  seo: { title: string | null; description: string | null };
  featuredImage: Image | null;
  images: Connection<Image>;
  priceRange: { minVariantPrice: Money };
  compareAtPriceRange: { minVariantPrice: Money | null };
  variants: Connection<Omit<ProductVariant, "image"> & { image: Image | null }>;
  sellingPlanGroups: Connection<{
    appName: string | null;
    name: string;
    sellingPlans: Connection<RawSellingPlan>;
  }>;
};

/* -------------------------------------------------------------------------
 * Normalisation
 * ---------------------------------------------------------------------- */

function normaliseSellingPlanGroups(
  raw: RawProduct["sellingPlanGroups"],
): SellingPlanGroup[] {
  return flatten(raw).map((group, index) => ({
    // Groups have no id in this query; the name is stable enough as a key.
    id: `${group.name}-${index}`,
    name: group.name,
    appName: group.appName,
    sellingPlans: flatten(group.sellingPlans).map((plan) => ({
      id: plan.id,
      name: plan.name,
      recurringDeliveries: plan.recurringDeliveries,
      discountPercentage:
        plan.priceAdjustments.find(
          (a) => typeof a.adjustmentValue.adjustmentPercentage === "number",
        )?.adjustmentValue.adjustmentPercentage ?? null,
    })),
  }));
}

function normaliseProduct(raw: RawProduct): Product {
  const compareAt = raw.compareAtPriceRange?.minVariantPrice ?? null;

  return {
    id: raw.id,
    handle: raw.handle,
    title: raw.title,
    description: raw.description,
    descriptionHtml: raw.descriptionHtml,
    availableForSale: raw.availableForSale,
    updatedAt: raw.updatedAt,
    seo: raw.seo,
    featuredImage: raw.featuredImage,
    images: flatten(raw.images),
    price: raw.priceRange.minVariantPrice,
    // Shopify reports a zero compare-at rather than null when none is set.
    compareAtPrice:
      compareAt && Number(compareAt.amount) > 0 ? compareAt : null,
    variants: flatten(raw.variants),
    sellingPlanGroups: normaliseSellingPlanGroups(raw.sellingPlanGroups),
  };
}

/* -------------------------------------------------------------------------
 * Queries
 * ---------------------------------------------------------------------- */

/**
 * Every query and mutation is pinned to the US market with
 * `@inContext(country: US)`.
 *
 * Without it Shopify infers the buyer's country from the request, and the
 * catalogue and the cart disagree: product queries return the shop currency
 * while the cart converts to wherever the server happens to sit. A $9.99
 * product came back as CA$14.10 in the cart when this was left unset.
 * ALAS is a US/USD business, so US is the context everywhere.
 */
const PRODUCTS_QUERY = /* GraphQL */ `
  query Products($first: Int!, $sortKey: ProductSortKeys, $reverse: Boolean)
  @inContext(country: US) {
    products(first: $first, sortKey: $sortKey, reverse: $reverse) {
      edges {
        node {
          ...ProductFields
        }
      }
    }
  }
  ${PRODUCT_FRAGMENT}
`;

const PRODUCT_BY_HANDLE_QUERY = /* GraphQL */ `
  query Product($handle: String!) @inContext(country: US) {
    product(handle: $handle) {
      ...ProductFields
    }
  }
  ${PRODUCT_FRAGMENT}
`;

export type ProductSortKey = "TITLE" | "PRICE" | "BEST_SELLING" | "CREATED_AT";

export async function getProducts({
  first = 50,
  sortKey = "PRICE",
  reverse = false,
}: {
  first?: number;
  sortKey?: ProductSortKey;
  reverse?: boolean;
} = {}): Promise<Product[]> {
  const data = await storefront<{ products: Connection<RawProduct> }>(
    PRODUCTS_QUERY,
    { variables: { first, sortKey, reverse }, tags: ["products"] },
  );
  return flatten(data.products).map(normaliseProduct);
}

export async function getProduct(handle: string): Promise<Product | null> {
  const data = await storefront<{ product: RawProduct | null }>(
    PRODUCT_BY_HANDLE_QUERY,
    { variables: { handle }, tags: ["products", `product:${handle}`] },
  );
  return data.product ? normaliseProduct(data.product) : null;
}
