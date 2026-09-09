import "server-only";

/**
 * Storefront API client.
 *
 * Every call goes through here so there is one place that knows about
 * credentials, error shapes and caching. Marked `server-only`: the token is
 * public by design, but keeping requests on the server means we control
 * caching and never ship query documents to the browser.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

const DOMAIN = required("NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN");
const API_VERSION = required("NEXT_PUBLIC_SHOPIFY_API_VERSION");
const TOKEN = required("NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN");

const ENDPOINT = `https://${DOMAIN}/api/${API_VERSION}/graphql.json`;

/** Catalogue changes rarely. Cart never caches — see `cache: "no-store"` below. */
export const CATALOGUE_REVALIDATE_SECONDS = 300;

type GraphQLError = {
  message: string;
  path?: (string | number)[];
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: GraphQLError[];
};

export class StorefrontError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly errors?: GraphQLError[],
  ) {
    super(message);
    this.name = "StorefrontError";
  }
}

type FetchOptions = {
  variables?: Record<string, unknown>;
  /** Seconds to cache. Pass `false` to opt out entirely (cart, anything mutating). */
  revalidate?: number | false;
  tags?: string[];
};

export async function storefront<T>(
  query: string,
  { variables, revalidate = CATALOGUE_REVALIDATE_SECONDS, tags }: FetchOptions = {},
): Promise<T> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query, variables }),
    ...(revalidate === false
      ? { cache: "no-store" as const }
      : { next: { revalidate, tags } }),
  });

  if (!response.ok) {
    throw new StorefrontError(
      `Storefront API returned ${response.status} ${response.statusText}`,
      response.status,
    );
  }

  const body = (await response.json()) as GraphQLResponse<T>;

  // A GraphQL response can be 200 and still carry errors. Surface them rather
  // than letting a missing field turn into a confusing undefined downstream.
  if (body.errors?.length) {
    throw new StorefrontError(
      body.errors.map((e) => e.message).join("; "),
      response.status,
      body.errors,
    );
  }

  if (!body.data) {
    throw new StorefrontError("Storefront API returned no data", response.status);
  }

  return body.data;
}

/** Shopify wraps every list in edges/nodes. Callers should never see that. */
export function flatten<T>(connection?: { edges: { node: T }[] }): T[] {
  return connection?.edges.map((edge) => edge.node) ?? [];
}
