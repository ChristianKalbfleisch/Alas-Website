import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SITE = "http://localhost:3000";
const ENV = { ...process.env };

type Answer = (op: string, variables: Record<string, unknown>) => unknown;

/** Loads the route fresh, so each test reads its own environment. */
async function route(env: Record<string, string> = {}) {
  vi.resetModules();
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("SHOPIFY_")) delete process.env[key];
  }
  Object.assign(process.env, env);
  return import("./route");
}

/** A pretend Admin API behind the global fetch, answering by operation name. */
function shopify(answer: Answer, status = 200) {
  const ops: { op: string; variables: Record<string, unknown> }[] = [];
  const fetcher = vi.fn(async (_url: unknown, init: RequestInit = {}) => {
    if (status !== 200) return new Response("down", { status });
    const { query, variables } = JSON.parse(String(init.body));
    const op = String(query).match(/(?:query|mutation) (\w+)/)?.[1] ?? "?";
    ops.push({ op, variables });
    return Response.json({ data: answer(op, variables) });
  });
  vi.stubGlobal("fetch", fetcher);
  return { fetcher, ops };
}

const newCustomer: Answer = (op) =>
  ({
    SignupFind: { customerByIdentifier: null },
    SignupCreate: {
      customerCreate: {
        customer: { id: "gid://shopify/Customer/1" },
        userErrors: [],
      },
    },
    SignupTag: { tagsAdd: { userErrors: [] } },
  })[op];

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request(`${SITE}/api/subscribe`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: SITE,
      "x-forwarded-host": "localhost:3000",
      "x-forwarded-for": "203.0.113.7",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  process.env = { ...ENV };
});

describe("POST /api/subscribe", () => {
  it("accepts but keeps nothing while Shopify is not connected", async () => {
    const { POST } = await route();
    const store = shopify(newCustomer);
    const res = await POST(post({ email: "ana@gmail.com", source: "footer" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, stored: false });
    expect(store.fetcher).not.toHaveBeenCalled();
  });

  it("stores the sign-up in Shopify once connected", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    const store = shopify(newCustomer);
    const res = await POST(
      post({ email: " Ana@GMAIL.com ", source: "ritual-shop" }),
    );
    expect(await res.json()).toEqual({ ok: true, stored: true });
    expect(store.ops.map((o) => o.op)).toEqual([
      "SignupFind",
      "SignupCreate",
      "SignupTag",
    ]);
    expect(store.ops[0].variables).toEqual({ email: "Ana@gmail.com" });
    expect(store.ops[2].variables.tags).toEqual([
      "site-signup",
      "site-ritual-shop",
      "ritual-waitlist",
    ]);
  });

  it("turns away posts from other sites", async () => {
    const { POST } = await route();
    const res = await POST(
      post({ email: "ana@gmail.com" }, { origin: "https://elsewhere.example" }),
    );
    expect(res.status).toBe(403);
  });

  it("checks the address and the form name", async () => {
    const { POST } = await route();
    expect((await POST(post({ email: "ana@" }))).status).toBe(400);
    expect(
      (await POST(post({ email: "ana@gmail.com", source: "Bad Name" }))).status,
    ).toBe(400);
    expect((await POST(post("not json"))).status).toBe(400);
  });

  it("says so when the store cannot be reached", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    shopify(newCustomer, 500);
    const res = await POST(post({ email: "ana@gmail.com", source: "footer" }));
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ ok: false, error: "store_unavailable" });
  });

  it("passes on Shopify refusing the address", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    shopify((op) =>
      op === "SignupFind"
        ? { customerByIdentifier: null }
        : {
            customerCreate: {
              customer: null,
              userErrors: [{ field: ["email"], message: "Email is invalid" }],
            },
          },
    );
    const res = await POST(
      post({ email: "ana@example.web", source: "footer" }),
    );
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ ok: false, error: "invalid_email" });
  });

  it("slows down one visitor sending many sign-ups", async () => {
    const { POST } = await route();
    const statuses: number[] = [];
    for (let i = 0; i < 9; i++) {
      statuses.push((await POST(post({ email: `a${i}@gmail.com` }))).status);
    }
    expect(statuses.slice(0, 8).every((s) => s === 200)).toBe(true);
    expect(statuses[8]).toBe(429);
    const other = await POST(
      post({ email: "b@gmail.com" }, { "x-forwarded-for": "198.51.100.2" }),
    );
    expect(other.status).toBe(200);
  });
});
