import { SHOPIFY_DOMAIN } from "@/data/products";

/** The Admin API release the server calls. Shopify supports each release for a year. */
export const ADMIN_API_VERSION = "2026-10";

const TIMEOUT_MS = 8000;
/** Ask for a new token this long before Shopify's 24-hour expiry. */
const REFRESH_EARLY_MS = 5 * 60_000;

export class AdminError extends Error {
  override name = "AdminError";
}

type Credentials =
  | { kind: "token"; token: string }
  | { kind: "client"; clientId: string; clientSecret: string };

export type AdminConfig = { shop: string; credentials: Credentials };

/** process.env, or a plain object of the same names in tests. */
export type AdminEnv = Record<string, string | undefined>;

/**
 * Admin API credentials from the environment, or null while the store is not
 * connected. A Dev Dashboard app gives a client ID and secret, traded for a
 * 24-hour token; an app made in the Shopify admin before 2026 gives a token.
 */
export function adminConfig(env: AdminEnv = process.env): AdminConfig | null {
  const shop = env.SHOPIFY_STORE_DOMAIN?.trim() || SHOPIFY_DOMAIN;
  const token = env.SHOPIFY_ADMIN_TOKEN?.trim();
  if (token) return { shop, credentials: { kind: "token", token } };
  const clientId = env.SHOPIFY_CLIENT_ID?.trim();
  const clientSecret = env.SHOPIFY_CLIENT_SECRET?.trim();
  if (clientId && clientSecret) {
    return { shop, credentials: { kind: "client", clientId, clientSecret } };
  }
  return null;
}

export type AdminClient = {
  graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T>;
};

type Deps = { fetch?: typeof fetch; now?: () => number };

/** A GraphQL Admin API client for one store. It keeps its token between calls. */
export function createAdminClient(
  config: AdminConfig,
  deps: Deps = {},
): AdminClient {
  const send: typeof fetch = deps.fetch ?? ((...args) => fetch(...args));
  const now = deps.now ?? Date.now;
  const { shop, credentials } = config;
  let cached: { token: string; expiresAt: number } | null = null;

  async function token(fresh: boolean): Promise<string> {
    if (credentials.kind === "token") return credentials.token;
    if (!fresh && cached && cached.expiresAt - REFRESH_EARLY_MS > now()) {
      return cached.token;
    }
    const res = await send(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new AdminError(`token request failed: ${res.status}`);
    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!data.access_token) throw new AdminError("token missing in response");
    cached = {
      token: data.access_token,
      expiresAt: now() + (data.expires_in ?? 86_399) * 1000,
    };
    return cached.token;
  }

  function post(body: string, accessToken: string) {
    return send(`https://${shop}/admin/api/${ADMIN_API_VERSION}/graphql.json`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-shopify-access-token": accessToken,
      },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  }

  return {
    async graphql<T>(query: string, variables: Record<string, unknown> = {}) {
      const body = JSON.stringify({ query, variables });
      let res = await post(body, await token(false));
      // A revoked or rotated secret: one fresh token, then give up.
      if (res.status === 401 && credentials.kind === "client") {
        res = await post(body, await token(true));
      }
      if (!res.ok) throw new AdminError(`admin request failed: ${res.status}`);
      const json = (await res.json()) as {
        data?: T;
        errors?: { message: string }[];
      };
      if (json.errors?.length) {
        throw new AdminError(json.errors.map((e) => e.message).join("; "));
      }
      if (!json.data) throw new AdminError("admin response had no data");
      return json.data;
    },
  };
}
