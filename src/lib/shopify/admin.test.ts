import { describe, expect, it } from "vitest";
import { ADMIN_API_VERSION, adminConfig, createAdminClient } from "./admin";

type Sent = { url: string; init: RequestInit };

/** A pretend Shopify: the token endpoint and the GraphQL endpoint, scripted per call. */
function fakeShopify(graphqlStatuses: number[] = []) {
  const sent: Sent[] = [];
  let tokens = 0;
  const fetcher = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    sent.push({ url, init });
    if (url.endsWith("/admin/oauth/access_token")) {
      tokens += 1;
      return Response.json({
        access_token: `token-${tokens}`,
        expires_in: 86_399,
      });
    }
    const status = graphqlStatuses.shift() ?? 200;
    if (status !== 200) return new Response("nope", { status });
    return Response.json({ data: { shop: { name: "ALAS" } } });
  }) as typeof fetch;
  return {
    fetcher,
    sent,
    tokenRequests: () => sent.filter((s) => s.url.includes("oauth")).length,
    headerOf: (i: number) =>
      new Headers(sent[i].init.headers).get("x-shopify-access-token"),
  };
}

const CLIENT = {
  shop: "alassaltco.myshopify.com",
  credentials: { kind: "client", clientId: "id", clientSecret: "secret" },
} as const;

describe("adminConfig", () => {
  it("is null until credentials are set", () => {
    expect(adminConfig({})).toBeNull();
    expect(adminConfig({ SHOPIFY_CLIENT_ID: "id" })).toBeNull();
  });

  it("prefers an admin token, then a client ID and secret", () => {
    expect(
      adminConfig({
        SHOPIFY_ADMIN_TOKEN: "t",
        SHOPIFY_CLIENT_ID: "id",
        SHOPIFY_CLIENT_SECRET: "s",
      }),
    ).toEqual({
      shop: "alassaltco.myshopify.com",
      credentials: { kind: "token", token: "t" },
    });
    expect(
      adminConfig({
        SHOPIFY_CLIENT_ID: "id",
        SHOPIFY_CLIENT_SECRET: "s",
        SHOPIFY_STORE_DOMAIN: "alas-dev.myshopify.com",
      }),
    ).toEqual({
      shop: "alas-dev.myshopify.com",
      credentials: { kind: "client", clientId: "id", clientSecret: "s" },
    });
  });
});

describe("createAdminClient", () => {
  it("trades the client ID and secret for a token once and reuses it", async () => {
    const shopify = fakeShopify();
    const client = createAdminClient(CLIENT, { fetch: shopify.fetcher });

    await client.graphql("{ shop { name } }");
    await client.graphql("{ shop { name } }");

    expect(shopify.tokenRequests()).toBe(1);
    const tokenCall = shopify.sent[0];
    expect(tokenCall.url).toBe(
      "https://alassaltco.myshopify.com/admin/oauth/access_token",
    );
    expect(String(tokenCall.init.body)).toBe(
      "grant_type=client_credentials&client_id=id&client_secret=secret",
    );
    expect(shopify.sent[1].url).toBe(
      `https://alassaltco.myshopify.com/admin/api/${ADMIN_API_VERSION}/graphql.json`,
    );
    expect(shopify.headerOf(1)).toBe("token-1");
  });

  it("asks for a new token shortly before the old one expires", async () => {
    const shopify = fakeShopify();
    let now = 0;
    const client = createAdminClient(CLIENT, {
      fetch: shopify.fetcher,
      now: () => now,
    });

    await client.graphql("{ shop { name } }");
    now = 23 * 3_600_000;
    await client.graphql("{ shop { name } }");
    expect(shopify.tokenRequests()).toBe(1);
    now = 86_399_000 - 60_000;
    await client.graphql("{ shop { name } }");
    expect(shopify.tokenRequests()).toBe(2);
  });

  it("retries once with a fresh token after a 401", async () => {
    const shopify = fakeShopify([401, 200]);
    const client = createAdminClient(CLIENT, { fetch: shopify.fetcher });
    await expect(client.graphql("{ shop { name } }")).resolves.toEqual({
      shop: { name: "ALAS" },
    });
    expect(shopify.tokenRequests()).toBe(2);
  });

  it("sends an admin token as is and never calls the token endpoint", async () => {
    const shopify = fakeShopify();
    const client = createAdminClient(
      {
        shop: "alassaltco.myshopify.com",
        credentials: { kind: "token", token: "shpat_x" },
      },
      { fetch: shopify.fetcher },
    );
    await client.graphql("{ shop { name } }");
    expect(shopify.tokenRequests()).toBe(0);
    expect(shopify.headerOf(0)).toBe("shpat_x");
  });

  it("throws on GraphQL errors and failed requests", async () => {
    const errors = (async () =>
      Response.json({
        errors: [{ message: "Throttled" }],
      })) as unknown as typeof fetch;
    const token = {
      shop: "s.myshopify.com",
      credentials: { kind: "token", token: "t" },
    } as const;
    await expect(
      createAdminClient(token, { fetch: errors }).graphql("{ shop { name } }"),
    ).rejects.toThrow("Throttled");

    const down = fakeShopify([500]);
    await expect(
      createAdminClient(token, { fetch: down.fetcher }).graphql(
        "{ shop { name } }",
      ),
    ).rejects.toThrow("500");
  });
});
