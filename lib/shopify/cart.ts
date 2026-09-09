import "server-only";

import { flatten, storefront } from "./client";
import { CART_FRAGMENT } from "./fragments";
import type { Cart, CartLine, Image, Money } from "./types";

/**
 * Cart lives entirely in Shopify. We create it, add lines to it, and hand the
 * customer to `checkoutUrl`. Nothing here touches payment, tax or fulfilment —
 * that is Shopify's, and it stays that way.
 *
 * Cart reads and writes are never cached.
 */

type Connection<T> = { edges: { node: T }[] };

type RawCartLine = {
  id: string;
  quantity: number;
  cost: { totalAmount: Money };
  sellingPlanAllocation: { sellingPlan: { name: string } } | null;
  merchandise: {
    id: string;
    title: string;
    product: { handle: string; title: string; featuredImage: Image | null };
  };
};

type RawCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: Money; totalAmount: Money };
  lines: Connection<RawCartLine>;
};

function normaliseCart(raw: RawCart): Cart {
  return {
    id: raw.id,
    checkoutUrl: raw.checkoutUrl,
    totalQuantity: raw.totalQuantity,
    cost: raw.cost,
    lines: flatten(raw.lines).map(
      (line): CartLine => ({
        id: line.id,
        quantity: line.quantity,
        cost: line.cost,
        merchandise: line.merchandise,
        sellingPlanName: line.sellingPlanAllocation?.sellingPlan.name ?? null,
      }),
    ),
  };
}

const CART_QUERY = /* GraphQL */ `
  query Cart($id: ID!) {
    cart(id: $id) {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;

const CART_CREATE = /* GraphQL */ `
  mutation CartCreate($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

const CART_LINES_ADD = /* GraphQL */ `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

const CART_LINES_UPDATE = /* GraphQL */ `
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

const CART_LINES_REMOVE = /* GraphQL */ `
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

type UserError = { field: string[] | null; message: string };

function unwrap(
  result: { cart: RawCart | null; userErrors: UserError[] },
  operation: string,
): Cart {
  if (result.userErrors?.length) {
    throw new Error(
      `${operation}: ${result.userErrors.map((e) => e.message).join("; ")}`,
    );
  }
  if (!result.cart) {
    throw new Error(`${operation} returned no cart`);
  }
  return normaliseCart(result.cart);
}

export type CartLineInput = {
  merchandiseId: string;
  quantity?: number;
  /** Present when the customer chose a subscription rather than one-time. */
  sellingPlanId?: string;
};

export async function getCart(cartId: string): Promise<Cart | null> {
  const data = await storefront<{ cart: RawCart | null }>(CART_QUERY, {
    variables: { id: cartId },
    revalidate: false,
  });
  return data.cart ? normaliseCart(data.cart) : null;
}

export async function createCart(lines: CartLineInput[] = []): Promise<Cart> {
  const data = await storefront<{
    cartCreate: { cart: RawCart | null; userErrors: UserError[] };
  }>(CART_CREATE, { variables: { lines }, revalidate: false });
  return unwrap(data.cartCreate, "cartCreate");
}

export async function addCartLines(
  cartId: string,
  lines: CartLineInput[],
): Promise<Cart> {
  const data = await storefront<{
    cartLinesAdd: { cart: RawCart | null; userErrors: UserError[] };
  }>(CART_LINES_ADD, { variables: { cartId, lines }, revalidate: false });
  return unwrap(data.cartLinesAdd, "cartLinesAdd");
}

export async function updateCartLines(
  cartId: string,
  lines: { id: string; quantity: number }[],
): Promise<Cart> {
  const data = await storefront<{
    cartLinesUpdate: { cart: RawCart | null; userErrors: UserError[] };
  }>(CART_LINES_UPDATE, { variables: { cartId, lines }, revalidate: false });
  return unwrap(data.cartLinesUpdate, "cartLinesUpdate");
}

export async function removeCartLines(
  cartId: string,
  lineIds: string[],
): Promise<Cart> {
  const data = await storefront<{
    cartLinesRemove: { cart: RawCart | null; userErrors: UserError[] };
  }>(CART_LINES_REMOVE, { variables: { cartId, lineIds }, revalidate: false });
  return unwrap(data.cartLinesRemove, "cartLinesRemove");
}
