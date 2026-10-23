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

/* Customer ---------------------------------------------------------------
 *
 * Classic Storefront-API customer accounts: email and password, an access
 * token we hold in a cookie, and everything else read back from Shopify.
 * No Admin API, no OAuth, no extra credentials.
 */

export type Address = {
  id: string;
  /** Shopify's own address formatting for the country. */
  formatted: string[];
};

export type OrderLine = {
  title: string;
  quantity: number;
  total: Money;
};

export type CustomerOrder = {
  id: string;
  /** The customer-facing number, e.g. "#1042". */
  name: string;
  processedAt: string;
  /** Shopify enums, passed through as given: PAID, FULFILLED, UNFULFILLED… */
  financialStatus: string | null;
  fulfillmentStatus: string;
  totalPrice: Money;
  /** Shopify-hosted order status page. We link to it and stop. */
  statusUrl: string;
  lines: OrderLine[];
};

export type Customer = {
  id: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  /** Shopify returns UnsignedInt64 as a string. */
  numberOfOrders: string;
  acceptsMarketing: boolean;
  defaultAddress: Address | null;
  orders: CustomerOrder[];
};

/**
 * What `customerUserErrors` gives back. `code` is a Shopify enum —
 * UNIDENTIFIED_CUSTOMER, TAKEN, TOO_SHORT and so on — and is what we switch
 * on, never the message, which is not a stable contract.
 */
export type CustomerError = {
  code: string | null;
  field: string[] | null;
  message: string;
};
