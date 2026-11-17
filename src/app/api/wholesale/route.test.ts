import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SITE = "http://localhost:3000";
const ENV = { ...process.env };

async function route(env: Record<string, string> = {}) {
  vi.resetModules();
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("SHOPIFY_")) delete process.env[key];
  }
  Object.assign(process.env, env);
  return import("./route");
}

function shopify(answer: (op: string) => unknown) {
  const ops: { op: string; variables: Record<string, unknown> }[] = [];
  const fetcher = vi.fn(async (_url: unknown, init: RequestInit = {}) => {
    const { query, variables } = JSON.parse(String(init.body));
    const op = String(query).match(/(?:query|mutation) (\w+)/)?.[1] ?? "?";
    ops.push({ op, variables });
    return Response.json({ data: answer(op) });
  });
  vi.stubGlobal("fetch", fetcher);
  return { fetcher, ops };
}

const newCustomer = (op: string) =>
  ({
    WholesaleFind: { customerByIdentifier: null },
    WholesaleCreate: {
      customerCreate: {
        customer: { id: "gid://shopify/Customer/3" },
        userErrors: [],
      },
    },
    WholesaleTag: { tagsAdd: { userErrors: [] } },
  })[op];

const FORM = {
  business: "Salt & Stone",
  name: "Maya Ortiz",
  email: "Maya@SaltStone.COM",
  type: "spa",
  location: "Miami, FL",
};

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request(`${SITE}/api/wholesale`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: SITE,
      "x-forwarded-host": "localhost:3000",
      "x-forwarded-for": "203.0.113.9",
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

describe("POST /api/wholesale", () => {
  it("accepts but keeps nothing while Shopify is not connected", async () => {
    const { POST } = await route();
    const store = shopify(newCustomer);
    const res = await POST(post(FORM));
    expect(await res.json()).toEqual({ ok: true, stored: false });
    expect(store.fetcher).not.toHaveBeenCalled();
  });

  it("files the application in Shopify once connected", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    const store = shopify(newCustomer);
    const res = await POST(post(FORM));
    expect(await res.json()).toEqual({ ok: true, stored: true });
    expect(store.ops.map((o) => o.op)).toEqual([
      "WholesaleFind",
      "WholesaleCreate",
      "WholesaleTag",
    ]);
    expect(store.ops[0].variables).toEqual({ email: "Maya@saltstone.com" });
    expect(store.ops[2].variables.tags).toContain("wholesale-spa");
  });

  it("says which field needs another look", async () => {
    const { POST } = await route();
    const res = await POST(post({ ...FORM, location: "" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      ok: false,
      error: "missing_location",
    });
    expect((await POST(post("not json"))).status).toBe(400);
  });

  it("turns away posts from other sites", async () => {
    const { POST } = await route();
    const res = await POST(post(FORM, { origin: "https://elsewhere.example" }));
    expect(res.status).toBe(403);
  });

  it("slows down one visitor sending many applications", async () => {
    const { POST } = await route();
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) statuses.push((await POST(post(FORM))).status);
    expect(statuses.slice(0, 5).every((s) => s === 200)).toBe(true);
    expect(statuses[5]).toBe(429);
  });
});
