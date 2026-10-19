import "server-only";

import { flatten, storefront } from "./client";
import type {
  Customer,
  CustomerError,
  CustomerOrder,
  Money,
  OrderLine,
} from "./types";

/**
 * Customer accounts, on the classic Storefront API.
 *
 * The customer signs in with an email and a password, Shopify hands back an
 * access token, and that token is what every subsequent read is made with.
 * Verified against the live store on 2026-10-19: all of these mutations are
 * present and not deprecated on 2025-07, and a sign-in attempt against an
 * address that does not exist comes back as UNIDENTIFIED_CUSTOMER rather than
 * an error — which is how we know classic accounts are switched on.
 *
 * This needs no credentials beyond the Storefront token the site already has:
 * no OAuth client, no Admin API, nothing new in Shopify admin.
 *
 * Nothing here is ever cached. Every call passes `revalidate: false`.
 */

/**
 * Expected failures — wrong password, email already taken, password too
 * short — are results, not exceptions: they have to reach the form the
 * customer is looking at. Network and schema failures still throw.
 */
export type CustomerResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: CustomerError[] };

export type AccessToken = {
  accessToken: string;
  expiresAt: string;
};

const CUSTOMER_ERROR_FIELDS = /* GraphQL */ `
  fragment CustomerErrorFields on CustomerUserError {
    code
    field
    message
  }
`;

function fail<T>(errors: CustomerError[]): CustomerResult<T> {
  return { ok: false, errors };
}

/** The last resort when Shopify declines without saying why. */
function unexplained<T>(): CustomerResult<T> {
  return fail([
    { code: null, field: null, message: "Shopify declined without a reason." },
  ]);
}

/* Sign up ---------------------------------------------------------------- */

const CUSTOMER_CREATE = /* GraphQL */ `
  mutation CustomerCreate($input: CustomerCreateInput!)
  @inContext(country: US) {
    customerCreate(input: $input) {
      customer {
        id
      }
      customerUserErrors {
        ...CustomerErrorFields
      }
    }
  }
  ${CUSTOMER_ERROR_FIELDS}
`;

export type CustomerCreateInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  acceptsMarketing?: boolean;
};

export async function createCustomer(
  input: CustomerCreateInput,
): Promise<CustomerResult<{ id: string }>> {
  const data = await storefront<{
    customerCreate: {
      customer: { id: string } | null;
      customerUserErrors: CustomerError[];
    };
  }>(CUSTOMER_CREATE, { variables: { input }, revalidate: false });

  const { customer, customerUserErrors } = data.customerCreate;
  if (customerUserErrors.length) return fail(customerUserErrors);
  if (!customer) return unexplained();
  return { ok: true, data: customer };
}

/* Sign in / sign out ----------------------------------------------------- */

const ACCESS_TOKEN_CREATE = /* GraphQL */ `
  mutation CustomerAccessTokenCreate(
    $input: CustomerAccessTokenCreateInput!
  ) @inContext(country: US) {
    customerAccessTokenCreate(input: $input) {
      customerAccessToken {
        accessToken
        expiresAt
      }
      customerUserErrors {
        ...CustomerErrorFields
      }
    }
  }
  ${CUSTOMER_ERROR_FIELDS}
`;

export async function createAccessToken(
  email: string,
  password: string,
): Promise<CustomerResult<AccessToken>> {
  const data = await storefront<{
    customerAccessTokenCreate: {
      customerAccessToken: AccessToken | null;
      customerUserErrors: CustomerError[];
    };
  }>(ACCESS_TOKEN_CREATE, {
    variables: { input: { email, password } },
    revalidate: false,
  });

  const { customerAccessToken, customerUserErrors } =
    data.customerAccessTokenCreate;
  if (customerUserErrors.length) return fail(customerUserErrors);
  if (!customerAccessToken) return unexplained();
  return { ok: true, data: customerAccessToken };
}

const ACCESS_TOKEN_DELETE = /* GraphQL */ `
  mutation CustomerAccessTokenDelete($customerAccessToken: String!)
  @inContext(country: US) {
    customerAccessTokenDelete(customerAccessToken: $customerAccessToken) {
      deletedAccessToken
      userErrors {
        field
        message
      }
    }
  }
`;

/**
 * Revokes the token at Shopify's end. Best effort on purpose: the cookie is
 * cleared either way, so a failure here must not keep someone signed in on
 * their own browser.
 */
export async function deleteAccessToken(token: string): Promise<void> {
  try {
    await storefront(ACCESS_TOKEN_DELETE, {
      variables: { customerAccessToken: token },
      revalidate: false,
    });
  } catch (error) {
    console.error("customerAccessTokenDelete failed", error);
  }
}

/* Password reset --------------------------------------------------------- */

const CUSTOMER_RECOVER = /* GraphQL */ `
  mutation CustomerRecover($email: String!) @inContext(country: US) {
    customerRecover(email: $email) {
      customerUserErrors {
        ...CustomerErrorFields
      }
    }
  }
  ${CUSTOMER_ERROR_FIELDS}
`;

/**
 * Asks Shopify to send the password-reset email.
 *
 * TODO(admin): confirm where that email's reset link points. Shopify's
 * "Customer account password reset" notification links at the store's own
 * account pages by default, which is not this site. Pointing it here means
 * editing that notification template in Shopify admin and building the
 * landing route against `customerResetByUrl`. Until that is checked, the
 * reset journey finishes on Shopify, not on alassaltco.com.
 */
export async function recoverPassword(
  email: string,
): Promise<CustomerResult<null>> {
  const data = await storefront<{
    customerRecover: { customerUserErrors: CustomerError[] };
  }>(CUSTOMER_RECOVER, { variables: { email }, revalidate: false });

  const { customerUserErrors } = data.customerRecover;
  if (customerUserErrors.length) return fail(customerUserErrors);
  return { ok: true, data: null };
}

/* Read ------------------------------------------------------------------- */

type Connection<T> = { edges: { node: T }[] };

type RawOrderLine = {
  title: string;
  quantity: number;
  originalTotalPrice: Money;
};

type RawOrder = {
  id: string;
  name: string;
  processedAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string;
  totalPrice: Money;
  statusUrl: string;
  lineItems: Connection<RawOrderLine>;
};

type RawCustomer = {
  id: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  numberOfOrders: string;
  acceptsMarketing: boolean;
  defaultAddress: { id: string; formatted: string[] } | null;
  orders: Connection<RawOrder>;
};

/** How much order history one page of the account shows. */
const ORDER_PAGE_SIZE = 20;
const ORDER_LINE_LIMIT = 10;

const CUSTOMER_QUERY = /* GraphQL */ `
  query Customer($token: String!, $orders: Int!, $lines: Int!)
  @inContext(country: US) {
    customer(customerAccessToken: $token) {
      id
      displayName
      firstName
      lastName
      email
      phone
      createdAt
      numberOfOrders
      acceptsMarketing
      defaultAddress {
        id
        formatted
      }
      orders(first: $orders, sortKey: PROCESSED_AT, reverse: true) {
        edges {
          node {
            id
            name
            processedAt
            financialStatus
            fulfillmentStatus
            statusUrl
            totalPrice {
              amount
              currencyCode
            }
            lineItems(first: $lines) {
              edges {
                node {
                  title
                  quantity
                  originalTotalPrice {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

function normaliseOrder(raw: RawOrder): CustomerOrder {
  return {
    id: raw.id,
    name: raw.name,
    processedAt: raw.processedAt,
    financialStatus: raw.financialStatus,
    fulfillmentStatus: raw.fulfillmentStatus,
    totalPrice: raw.totalPrice,
    statusUrl: raw.statusUrl,
    lines: flatten(raw.lineItems).map(
      (line): OrderLine => ({
        title: line.title,
        quantity: line.quantity,
        total: line.originalTotalPrice,
      }),
    ),
  };
}

/**
 * The signed-in customer, or null when the token has expired or been revoked.
 *
 * Shopify returns `customer: null` for a bad token rather than an error, so a
 * null here means "sign in again", not "something broke".
 */
export async function getCustomer(token: string): Promise<Customer | null> {
  const data = await storefront<{ customer: RawCustomer | null }>(
    CUSTOMER_QUERY,
    {
      variables: {
        token,
        orders: ORDER_PAGE_SIZE,
        lines: ORDER_LINE_LIMIT,
      },
      revalidate: false,
    },
  );

  const raw = data.customer;
  if (!raw) return null;

  return {
    id: raw.id,
    displayName: raw.displayName,
    firstName: raw.firstName,
    lastName: raw.lastName,
    email: raw.email,
    phone: raw.phone,
    createdAt: raw.createdAt,
    numberOfOrders: raw.numberOfOrders,
    acceptsMarketing: raw.acceptsMarketing,
    defaultAddress: raw.defaultAddress,
    orders: flatten(raw.orders).map(normaliseOrder),
  };
}

/* Update ----------------------------------------------------------------- */

const CUSTOMER_UPDATE = /* GraphQL */ `
  mutation CustomerUpdate($token: String!, $customer: CustomerUpdateInput!)
  @inContext(country: US) {
    customerUpdate(customerAccessToken: $token, customer: $customer) {
      customerAccessToken {
        accessToken
        expiresAt
      }
      customerUserErrors {
        ...CustomerErrorFields
      }
    }
  }
  ${CUSTOMER_ERROR_FIELDS}
`;

export type CustomerUpdateInput = {
  /** `null` clears the field; an empty string is rejected as invalid. */
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  acceptsMarketing?: boolean;
};

/**
 * Updates the profile.
 *
 * Shopify hands back a replacement token whenever the change invalidates the
 * old one, so the caller must store `data.token` when it is not null. Email
 * and password are deliberately not in `CustomerUpdateInput` above: both
 * change what the customer signs in with, and both deserve their own flow
 * with a confirmation step rather than riding along on a profile form.
 */
export async function updateCustomer(
  token: string,
  customer: CustomerUpdateInput,
): Promise<CustomerResult<{ token: AccessToken | null }>> {
  const data = await storefront<{
    customerUpdate: {
      customerAccessToken: AccessToken | null;
      customerUserErrors: CustomerError[];
    };
  }>(CUSTOMER_UPDATE, { variables: { token, customer }, revalidate: false });

  const { customerAccessToken, customerUserErrors } = data.customerUpdate;
  if (customerUserErrors.length) return fail(customerUserErrors);
  return { ok: true, data: { token: customerAccessToken } };
}
