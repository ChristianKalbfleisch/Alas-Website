import "server-only";

import { cookies } from "next/headers";

import { addCartLines, createCart, getCart } from "@/lib/shopify";
import type { Cart, CartLineInput } from "@/lib/shopify";

/**
 * The cart id is the only thing we keep. Everything else — contents, totals,
 * tax, the checkout URL — lives in Shopify and is read back on demand.
 *
 * Shopify carts persist for months, so the cookie is long-lived, but it holds
 * no personal data: a Storefront cart id and nothing else.
 */
const CART_COOKIE = "alas_cart";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function readCartId(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

async function writeCartId(id: string) {
  const store = await cookies();
  store.set(CART_COOKIE, id, {
    maxAge: CART_COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

/**
 * The cart for this visitor, or null when they have never added anything.
 *
 * A cart id can go stale — Shopify expires carts, and a completed checkout
 * retires one. In both cases the query returns null rather than throwing, and
 * the caller should treat the visitor as having no cart.
 */
export async function getSessionCart(): Promise<Cart | null> {
  const id = await readCartId();
  if (!id) return null;
  return getCart(id);
}

/**
 * Adds lines, creating the cart if there is not one yet, and recovering if the
 * stored id has gone stale.
 */
export async function addToSessionCart(lines: CartLineInput[]): Promise<Cart> {
  const id = await readCartId();

  if (id) {
    try {
      return await addCartLines(id, lines);
    } catch {
      // Stale or retired cart id — fall through and start a new one rather
      // than surfacing an error the customer cannot act on.
    }
  }

  const cart = await createCart(lines);
  await writeCartId(cart.id);
  return cart;
}
