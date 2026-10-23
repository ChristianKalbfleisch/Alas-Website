import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  getCustomer,
  type AccessToken,
} from "@/lib/shopify/customer";
import type { Customer } from "@/lib/shopify";

/**
 * The customer session is one cookie holding one Shopify access token.
 *
 * No profile data is cached locally and no session table exists: the token is
 * the session, and Shopify is the record. That keeps personal data out of this
 * app entirely — we never hold a name, an address or an order.
 *
 * Mirrors `lib/cart/session.ts` deliberately. Difference: this cookie is
 * sensitive, so its lifetime comes from Shopify's own `expiresAt` rather than
 * a number we choose.
 */
const CUSTOMER_COOKIE = "alas_customer";

/** Where an unauthenticated visitor is sent. */
export const LOGIN_PATH = "/account/login";

export async function readCustomerToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(CUSTOMER_COOKIE)?.value ?? null;
}

/**
 * Stores the token. Only callable from a Server Action or Route Handler —
 * Next cannot set a cookie once a Server Component has begun streaming.
 */
export async function writeCustomerToken(token: AccessToken): Promise<void> {
  const store = await cookies();

  // Shopify tokens last a fortnight or so. Take its word for it rather than
  // picking our own figure, and floor at zero so a clock skew cannot mint a
  // negative max-age (which browsers read as a session cookie).
  const seconds = Math.max(
    0,
    Math.floor((new Date(token.expiresAt).getTime() - Date.now()) / 1000),
  );

  store.set(CUSTOMER_COOKIE, token.accessToken, {
    maxAge: seconds,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function clearCustomerToken(): Promise<void> {
  const store = await cookies();
  store.delete(CUSTOMER_COOKIE);
}

/**
 * The signed-in customer, or null.
 *
 * Null covers both "never signed in" and "token expired or revoked" — the
 * caller cannot tell them apart and does not need to. Note that a dead cookie
 * is deliberately *not* cleared here: this runs during render, where setting a
 * cookie is not allowed. It is harmless, and the next sign-in overwrites it.
 */
export async function getSessionCustomer(): Promise<Customer | null> {
  const token = await readCustomerToken();
  if (!token) return null;
  return getCustomer(token);
}

/**
 * The signed-in customer and their token, or a redirect to sign-in.
 *
 * Returning the token alongside matters: `customerUpdate` rejects a dead token
 * with a top-level ACCESS_DENIED rather than a user error, so anything that
 * writes should come through here first and pass the token it was handed.
 */
export async function requireCustomer(): Promise<{
  customer: Customer;
  token: string;
}> {
  const token = await readCustomerToken();
  if (!token) redirect(LOGIN_PATH);

  const customer = await getCustomer(token);
  if (!customer) redirect(LOGIN_PATH);

  return { customer, token };
}
