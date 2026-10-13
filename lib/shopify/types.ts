/**
 * Domain types.
 *
 * These are what the rest of the app sees — flat, no edges/nodes, no nullable
 * soup. The raw Storefront shapes stay inside lib/shopify.
 */

export type Money = {
  amount: string;
  currencyCode: string;
};

export type Image = {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

export type SellingPlan = {
  id: string;
  name: string;
  recurringDeliveries: boolean;
  /** Percentage off, when the plan is a straightforward percentage discount. */
  discountPercentage: number | null;
};

export type SellingPlanGroup = {
  id: string;
  name: string;
  /** The app that created the plan, e.g. "Shopify Subscriptions". */
  appName: string | null;
  sellingPlans: SellingPlan[];
};

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  compareAtPrice: Money | null;
  image: Image | null;
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  availableForSale: boolean;
  featuredImage: Image | null;
  images: Image[];
  price: Money;
  compareAtPrice: Money | null;
  variants: ProductVariant[];
  sellingPlanGroups: SellingPlanGroup[];
  seo: { title: string | null; description: string | null };
  updatedAt: string;
};

export type CartLine = {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    product: { handle: string; title: string; featuredImage: Image | null };
  };
  cost: { totalAmount: Money };
  sellingPlanName: string | null;
};

export type Cart = {
  id: string;
  /** Shopify-hosted checkout. We hand off here and stop. */
  checkoutUrl: string;
  totalQuantity: number;
  lines: CartLine[];
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
  };
};
