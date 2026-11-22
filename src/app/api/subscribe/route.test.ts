import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BLACK_FRIDAY, discounted } from "@/data/campaign";
import { offerTag, STANDING_STEPS, stepsAt } from "@/data/gift";
import { canOrder, getProduct, isPriced, products } from "@/data/products";
import { formatPrice } from "@/lib/cart/cart-math";
import { listName } from "@/lib/signup/preorder";

/** A moment while the campaign runs, and the offer in force then. */
const DURING = new Date("2026-11-21T09:30:00Z");
const OFFER = stepsAt(DURING.getTime());
/** One second and one day after the campaign's last moment. */
const END = Date.parse(BLACK_FRIDAY.ends);
const JUST_AFTER = new Date(END + 1000);
const A_DAY_AFTER = new Date(END + 86_400_000);

const EMAIL_TAG = offerTag(OFFER, { answers: 0, phone: false });

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
  // The offer in force is read from the clock: every test names its moment.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(DURING);
});

afterEach(() => {
  vi.useRealTimers();
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
    expect(await res.json()).toEqual({
      ok: true,
      stored: true,
      recorded: { offer: "friday", phone: false },
    });
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

  it("joins the Founding Members at the email step with an email alone", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    const store = shopify(newCustomer);
    const res = await POST(post({ email: "ana@gmail.com", source: "footer" }));
    expect(await res.json()).toMatchObject({ ok: true, stored: true });
    expect(store.ops[2].variables.tags).toEqual([
      "site-signup",
      "site-footer",
      EMAIL_TAG,
      "founding-member-lead",
    ]);
  });

  it("counts the real answers and the phone number towards the step", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    const store = shopify(newCustomer);
    const res = await POST(
      post({
        email: "ana@gmail.com",
        source: "gift",
        phone: "(512) 555-0147",
        answers: { goal: "training", flavour: "lemon", learn: "nope" },
      }),
    );
    expect(await res.json()).toEqual({
      ok: true,
      stored: true,
      recorded: { offer: "friday", phone: true },
    });
    expect(store.ops[1].variables).toMatchObject({
      input: { phone: "+15125550147" },
    });
    expect(store.ops[2].variables.tags).toEqual([
      "site-signup",
      "site-gift",
      offerTag(OFFER, { answers: 2, phone: true }),
      "founding-member-lead",
      "pref-goal-training",
      "pref-flavour-lemon",
    ]);
  });

  it("asks again for a phone number that cannot be real", async () => {
    const { POST } = await route();
    const res = await POST(
      post({ email: "ana@gmail.com", source: "gift", phone: "555-01" }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "invalid_phone" });
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

/** Names and prices come from the catalogue, so these follow it when it changes. */
const item = (handle: string) => {
  const product = getProduct(handle);
  if (!product || !canOrder(product)) throw new Error(`no price: ${handle}`);
  return product;
};
const cents = (handle: string) => Math.round(item(handle).price * 100);

const CART = [
  { handle: "lemon-pouch", qty: 1 },
  { handle: "discovery-set", qty: 1 },
  { handle: "lemon-sticks-5", qty: 2 },
];
const TOTAL =
  (cents("lemon-pouch") +
    cents("discovery-set") +
    2 * cents("lemon-sticks-5")) /
  100;
const PERCENT = OFFER.start.percent;
const REF = "k7q2mxd9";
const ORDER = {
  ref: REF,
  day: "2026-11-21",
  lines: CART.map(({ handle, qty }) => ({
    handle,
    name: listName(item(handle)),
    qty,
    each: item(handle).price,
    total: (cents(handle) * qty) / 100,
  })),
  total: TOTAL,
  percent: PERCENT,
  toPay: discounted(TOTAL, PERCENT),
};
const ALL_ANSWERS = { goal: "training", flavour: "lemon", learn: "offers" };

/** What the cart sends: its lines, the percentage it showed and the figure it showed to pay. */
const preorder = (extra: Record<string, unknown> = {}) => {
  const percent = typeof extra.percent === "number" ? extra.percent : PERCENT;
  return {
    email: "ana@gmail.com",
    source: "preorder",
    ref: REF,
    lines: CART,
    percent,
    toPay: discounted(TOTAL, percent),
    ...extra,
  };
};

type Kept = {
  id: string;
  note: string | null;
  tags: Set<string>;
  marketingState: string;
  phone: string | null;
  smsState: string | null;
};

/**
 * A pretend store that keeps what it is given: customers by address, with
 * their note, tags and consent. `fail` names calls that fail once, either
 * before the store does the work or after it (the answer is lost).
 */
function keeper(
  fail: { op: string; afterwards?: boolean }[] = [],
  start: Record<string, Partial<Kept>> = {},
) {
  const customers = new Map<string, Kept>();
  for (const [email, fields] of Object.entries(start)) {
    customers.set(email, {
      id: `gid://shopify/Customer/${customers.size + 1}`,
      note: null,
      tags: new Set(),
      marketingState: "SUBSCRIBED",
      phone: null,
      smsState: null,
      ...fields,
    });
  }
  const byId = (id: unknown) =>
    [...customers.values()].find((c) => c.id === id) as Kept;
  const apply: Answer = (op, variables) => {
    const input = (variables.input ?? {}) as Record<string, unknown>;
    switch (op) {
      case "SignupFind": {
        const c = customers.get(String(variables.email));
        return {
          customerByIdentifier: c
            ? {
                id: c.id,
                note: c.note,
                defaultEmailAddress: { marketingState: c.marketingState },
                defaultPhoneNumber: c.phone
                  ? {
                      phoneNumber: c.phone,
                      smsMarketingConsent: { state: c.smsState },
                    }
                  : null,
              }
            : null,
        };
      }
      case "SignupCreate": {
        const id = `gid://shopify/Customer/${customers.size + 1}`;
        customers.set(String(input.email), {
          id,
          note: (input.note as string) ?? null,
          tags: new Set(),
          marketingState: "SUBSCRIBED",
          phone: (input.phone as string) ?? null,
          smsState: input.phone ? "SUBSCRIBED" : null,
        });
        return { customerCreate: { customer: { id }, userErrors: [] } };
      }
      case "SignupConsent":
        byId(input.customerId).marketingState = "SUBSCRIBED";
        return { customerEmailMarketingConsentUpdate: { userErrors: [] } };
      case "SignupNote":
        byId(input.id).note = String(input.note);
        return { customerUpdate: { userErrors: [] } };
      case "SignupTag": {
        const before = byId(variables.id).tags.size;
        for (const tag of variables.tags as string[]) {
          byId(variables.id).tags.add(tag);
        }
        added.push(byId(variables.id).tags.size - before);
        return { tagsAdd: { userErrors: [] } };
      }
      default:
        throw new Error(`unexpected ${op}`);
    }
  };
  /** How many tags each tag call added that the customer did not have. */
  const added: number[] = [];
  const ops: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: unknown, init: RequestInit = {}) => {
      const { query, variables } = JSON.parse(String(init.body));
      const op = String(query).match(/(?:query|mutation) (\w+)/)?.[1] ?? "?";
      ops.push(op);
      const at = fail.findIndex((f) => f.op === op);
      if (at >= 0) {
        const [failure] = fail.splice(at, 1);
        if (failure.afterwards) apply(op, variables);
        return new Response("down", { status: 500 });
      }
      return Response.json({ data: apply(op, variables) });
    }),
  );
  const blocks = (email = "ana@gmail.com") =>
    (customers.get(email)?.note ?? "").split("Pre-order by email").length - 1;
  return { customers, ops, added, blocks };
}

describe("POST /api/subscribe, a pre-order by email", () => {
  it("stores the whole pre-order in one go: the note, then the tags", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    const store = shopify(newCustomer);
    const res = await POST(post(preorder()));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      stored: true,
      recorded: { offer: "friday", phone: false },
      order: ORDER,
    });
    expect(store.ops.map((o) => o.op)).toEqual([
      "SignupFind",
      "SignupCreate",
      "SignupTag",
    ]);
    const input = store.ops[1].variables.input as { note: string };
    expect(input.note.split("\n")).toEqual([
      `Pre-order by email, ref ${REF}, 2026-11-21 US Pacific time (website)`,
      ...ORDER.lines.map(
        (l) =>
          `${l.name} × ${l.qty}, ${formatPrice(l.each)} each, ${formatPrice(l.total)}`,
      ),
      `Total: ${formatPrice(TOTAL)}`,
      `Confirmed to the shopper: ${PERCENT}% off, ${formatPrice(ORDER.toPay)} to pay`,
    ]);
    expect(input.note).toContain("Lemon Sticks (pack of 5) × 2");
    expect(store.ops[2].variables.tags).toEqual([
      "site-signup",
      "site-preorder",
      EMAIL_TAG,
      "founding-member-lead",
      "site-preorder-lemon-pouch",
      "site-preorder-discovery-set",
      "site-preorder-lemon-sticks-5",
      "site-preorder-20261121",
      `site-preorder-ref-${REF}`,
    ]);
  });

  it("adds the pre-order under the note of a customer already on file", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    const store = keeper([], { "ana@gmail.com": { note: "Earlier note." } });
    const res = await POST(post(preorder()));
    expect((await res.json()).stored).toBe(true);
    expect(store.ops).toEqual(["SignupFind", "SignupNote", "SignupTag"]);
    expect(
      store.customers
        .get("ana@gmail.com")
        ?.note?.startsWith("Earlier note.\n\nPre-order by email, ref "),
    ).toBe(true);
  });

  it("writes it once when the tags fail and the cart tries again, and answers the second try as kept", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    const store = keeper([{ op: "SignupTag" }]);
    const first = await POST(post(preorder()));
    expect(first.status).toBe(502);
    // The note is already in the store although the answer was a failure.
    expect(store.blocks()).toBe(1);
    expect(store.customers.get("ana@gmail.com")?.tags.size).toBe(0);
    const second = await POST(post(preorder()));
    expect(await second.json()).toEqual({
      ok: true,
      stored: true,
      recorded: { offer: "friday", phone: false },
      order: ORDER,
    });
    expect(store.blocks()).toBe(1);
    expect([...(store.customers.get("ana@gmail.com")?.tags ?? [])]).toContain(
      `site-preorder-ref-${REF}`,
    );
  });

  it("writes it once when everything was stored and only the answer was lost", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    for (const lost of ["SignupCreate", "SignupTag"]) {
      const store = keeper([{ op: lost, afterwards: true }]);
      expect((await POST(post(preorder()))).status, lost).toBe(502);
      const again = await POST(post(preorder()));
      expect((await again.json()).order, lost).toEqual(ORDER);
      expect(store.blocks(), lost).toBe(1);
      expect(store.customers.size, lost).toBe(1);
    }
  });

  it("writes a second block for a second pre-order, and gives it a tag the customer did not have", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    const store = keeper();
    const one = [{ handle: "lemon-pouch", qty: 1 }];
    const each = cents("lemon-pouch") / 100;
    const same = (ref: string) =>
      preorder({ ref, lines: one, toPay: discounted(each, PERCENT) });
    await POST(post(same("k7q2mxd9")));
    // The same product, the same day, the same step: only the reference is new.
    await POST(post(same("k7q2mxd8")));
    expect(store.blocks()).toBe(2);
    expect(store.added).toEqual([7, 1]);
    expect([...(store.customers.get("ana@gmail.com")?.tags ?? [])]).toEqual(
      expect.arrayContaining([
        "site-preorder-ref-k7q2mxd9",
        "site-preorder-ref-k7q2mxd8",
      ]),
    );
  });

  it("dates a pre-order of the evening of 30 November on the US Pacific coast 30 November", async () => {
    // 7 pm there; already 1 December in UTC, and still within the campaign.
    vi.setSystemTime(new Date("2026-12-01T03:00:00Z"));
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    const store = shopify(newCustomer);
    const res = await POST(post(preorder()));
    expect((await res.json()).order.day).toBe("2026-11-30");
    const input = store.ops[1].variables.input as { note: string };
    expect(input.note.split("\n")[0]).toBe(
      `Pre-order by email, ref ${REF}, 2026-11-30 US Pacific time (website)`,
    );
    expect(store.ops[2].variables.tags).toContain("site-preorder-20261130");
    expect(store.ops[2].variables.tags).toContain("friday-5");
  });

  it("works the amounts out itself, whatever the browser sends with a line", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    shopify(newCustomer);
    const total = (cents("lemon-pouch") * 3) / 100;
    const res = await POST(
      post(
        preorder({
          lines: [{ handle: "lemon-pouch", qty: 3, each: 0.01, total: 0.03 }],
          total: 0.03,
          percent: 0,
          toPay: total,
        }),
      ),
    );
    const { order } = await res.json();
    expect(order.total).toBe(total);
    expect(order.toPay).toBe(order.total);
    expect(order.lines).toHaveLength(1);
    expect(order.lines[0]).toMatchObject({ handle: "lemon-pouch", qty: 3 });
  });

  it("refuses a figure to pay that is not its own and writes nothing: the page is out of date", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    const store = shopify(newCustomer);
    for (const toPay of [ORDER.toPay - 1, 0.01, undefined]) {
      const res = await POST(post(preorder({ toPay })));
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({ ok: false, error: "total_changed" });
    }
    expect(store.fetcher).not.toHaveBeenCalled();
  });

  it("refuses an unknown product, a retired name, one that goes to checkout, and 0 or 100 of anything", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    const store = shopify(newCustomer);
    const inCheckout = products.find(isPriced)?.handle;
    expect(inCheckout).toBeDefined();
    for (const lines of [
      [{ handle: "sea-water", qty: 1 }],
      [{ handle: "family-box", qty: 1 }],
      [{ handle: inCheckout, qty: 1 }],
      [...CART, { handle: inCheckout, qty: 1 }],
      [{ handle: "lemon-pouch", qty: 0 }],
      [{ handle: "lemon-pouch", qty: 100 }],
      [],
      undefined,
    ]) {
      const res = await POST(post(preorder({ lines })));
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ ok: false, error: "invalid_lines" });
    }
    const res = await POST(post(preorder({ percent: 99 })));
    expect(await res.json()).toEqual({ ok: false, error: "invalid_percent" });
    const noRef = await POST(post(preorder({ ref: "not a reference" })));
    expect(noRef.status).toBe(400);
    expect(await noRef.json()).toEqual({ ok: false, error: "invalid_ref" });
    expect(store.fetcher).not.toHaveBeenCalled();
  });

  it("refuses a pre-order sent one product at a time, without quantities", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    const store = shopify(newCustomer);
    const res = await POST(
      post({ email: "ana@gmail.com", source: "preorder-lemon-pouch" }),
    );
    expect(res.status).toBe(400);
    expect(store.fetcher).not.toHaveBeenCalled();
  });

  it("says it kept nothing while the store is not connected", async () => {
    const { POST } = await route();
    const store = shopify(newCustomer);
    const res = await POST(post(preorder()));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, stored: false, order: ORDER });
    expect(store.fetcher).not.toHaveBeenCalled();
  });

  it("says so when the store fails, and never calls it stored", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    shopify(newCustomer, 500);
    const res = await POST(post(preorder()));
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ ok: false, error: "store_unavailable" });
  });

  it("gives a full note its own answer, and writes neither the note nor the tags", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    // Shopify refuses the longer note.
    const refused = shopify(
      (op) =>
        ({
          SignupFind: {
            customerByIdentifier: {
              id: "gid://shopify/Customer/7",
              note: null,
              defaultEmailAddress: { marketingState: "SUBSCRIBED" },
              defaultPhoneNumber: null,
            },
          },
          SignupNote: {
            customerUpdate: { userErrors: [{ message: "Note is too long" }] },
          },
        })[op],
    );
    const res = await POST(post(preorder()));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ ok: false, error: "note_full" });
    expect(refused.ops.map((o) => o.op)).toEqual(["SignupFind", "SignupNote"]);
    // A note with no room left is not even sent.
    const full = keeper([], { "ana@gmail.com": { note: "x".repeat(4900) } });
    const again = await POST(post(preorder()));
    expect(await again.json()).toEqual({ ok: false, error: "note_full" });
    expect(full.ops).toEqual(["SignupFind"]);
    expect(full.customers.get("ana@gmail.com")?.note).toHaveLength(4900);
  });

  it("leaves a customer who had unsubscribed from emails unsubscribed, and writes the note and the tags", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    const store = keeper([], {
      "ana@gmail.com": { marketingState: "UNSUBSCRIBED" },
    });
    const res = await POST(post(preorder()));
    expect((await res.json()).stored).toBe(true);
    expect(store.ops).toEqual(["SignupFind", "SignupNote", "SignupTag"]);
    const customer = store.customers.get("ana@gmail.com");
    expect(customer?.marketingState).toBe("UNSUBSCRIBED");
    expect(store.blocks()).toBe(1);
    expect([...(customer?.tags ?? [])]).toContain("site-preorder");
  });

  it("still switches emails back on for that customer when they use a sign-up form", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    const store = keeper([], {
      "ana@gmail.com": { marketingState: "UNSUBSCRIBED" },
    });
    await POST(post({ email: "ana@gmail.com", source: "footer" }));
    expect(store.ops).toEqual(["SignupFind", "SignupConsent", "SignupTag"]);
    expect(store.customers.get("ana@gmail.com")?.marketingState).toBe(
      "SUBSCRIBED",
    );
  });

  it("takes no phone number with a pre-order: the cart's form asks for none", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    const store = keeper();
    const res = await POST(post(preorder({ phone: "(512) 555-0147" })));
    expect((await res.json()).recorded).toEqual({
      offer: "friday",
      phone: false,
    });
    expect(store.customers.get("ana@gmail.com")?.phone).toBeNull();
  });

  it("counts a pre-order of several products once against the limit", async () => {
    const { POST } = await route();
    const statuses: number[] = [];
    for (let i = 0; i < 9; i++) {
      statuses.push((await POST(post(preorder()))).status);
    }
    // Eight pre-orders of three products each go through; one request per
    // product would have been stopped during the third.
    expect(statuses.slice(0, 8).every((s) => s === 200)).toBe(true);
    expect(statuses[8]).toBe(429);
    expect(await (await POST(post(preorder()))).json()).toEqual({
      ok: false,
      error: "rate_limited",
    });
  });
});

describe("POST /api/subscribe, a pre-order that names more than it shows", () => {
  const TOP = OFFER.top.percent;
  const noteOf = (store: ReturnType<typeof keeper>) =>
    (store.customers.get("ana@gmail.com")?.note ?? "").split("\n");
  const stepOf = (store: ReturnType<typeof keeper>) =>
    [...(store.customers.get("ana@gmail.com")?.tags ?? [])].filter((tag) =>
      /^(friday|founder)-/.test(tag),
    );

  it("records the email step alone for a request that names the top step with nothing behind it", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    const store = keeper();
    const res = await POST(post(preorder({ percent: TOP })));
    const { order, stored } = await res.json();
    expect(stored).toBe(true);
    // The confirmation carries what was recorded, and what the cart had shown.
    expect(order.percent).toBe(PERCENT);
    expect(order.toPay).toBe(discounted(TOTAL, PERCENT));
    expect(order.asked).toBe(TOP);
    expect(noteOf(store).slice(-2)).toEqual([
      `The cart showed ${TOP}% off; the answers sent and this customer's record back ${PERCENT}% off.`,
      `Confirmed to the shopper: ${PERCENT}% off, ${formatPrice(discounted(TOTAL, PERCENT))} to pay`,
    ]);
    // The note never says more than the step tag written with it.
    expect(stepOf(store)).toEqual([`friday-${PERCENT}`]);
  });

  it("counts one step for each real answer sent, and no more", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    for (const [answers, backed] of [
      [{ goal: "training" }, 10],
      [{ goal: "training", flavour: "nope", extra: "x" }, 10],
      [ALL_ANSWERS, 20],
    ] as const) {
      const store = keeper();
      const res = await POST(post(preorder({ percent: TOP, answers })));
      const { order } = await res.json();
      expect(order.percent).toBe(backed);
      expect(order.toPay).toBe(discounted(TOTAL, backed));
      expect(order.asked).toBe(TOP);
      expect(noteOf(store).at(-1)).toContain(`${backed}% off`);
      expect(stepOf(store)).toEqual([`friday-${backed}`]);
    }
  });

  it("counts the phone step only for a customer the store shows as getting texts", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    for (const [smsState, backed] of [
      ["SUBSCRIBED", TOP],
      ["UNSUBSCRIBED", 20],
      ["NEVER_SUBSCRIBED", 20],
      [null, 20],
    ] as const) {
      const store = keeper([], {
        "ana@gmail.com": { phone: smsState && "+15125550147", smsState },
      });
      const res = await POST(
        post(preorder({ percent: TOP, answers: ALL_ANSWERS })),
      );
      const { order, recorded } = await res.json();
      expect(order.percent, String(smsState)).toBe(backed);
      expect(order.asked, String(smsState)).toBe(
        backed === TOP ? undefined : TOP,
      );
      expect(recorded.phone, String(smsState)).toBe(backed === TOP);
      expect(stepOf(store), String(smsState)).toEqual([`friday-${backed}`]);
    }
  });

  it("records what the cart showed when that is less than what is backed", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    const store = keeper();
    const res = await POST(
      post(preorder({ percent: PERCENT, answers: ALL_ANSWERS })),
    );
    const { order } = await res.json();
    expect(order.percent).toBe(PERCENT);
    expect(order.asked).toBeUndefined();
    expect(noteOf(store).at(-1)).toContain(`${PERCENT}% off`);
  });
});

describe("POST /api/subscribe, answers sent on their own", () => {
  const answers = { goal: "training" };

  it("says nothing was kept for an address the store does not know", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    const store = keeper();
    const res = await POST(
      post({ email: "ana@gmail.com", source: "preferences", answers }),
    );
    expect(await res.json()).toEqual({ ok: true, stored: false });
    expect(store.ops).toEqual(["SignupFind"]);
    expect(store.customers.size).toBe(0);
  });

  it("says kept when a customer took them", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    const store = keeper([], { "ana@gmail.com": {} });
    const res = await POST(
      post({ email: "ana@gmail.com", source: "preferences", answers }),
    );
    expect(await res.json()).toEqual({ ok: true, stored: true });
    expect([...(store.customers.get("ana@gmail.com")?.tags ?? [])]).toEqual([
      "friday-10",
      "pref-goal-training",
    ]);
  });

  it("says nothing was kept when no real answer came", async () => {
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    const store = keeper([], { "ana@gmail.com": {} });
    const res = await POST(
      post({
        email: "ana@gmail.com",
        source: "preferences",
        answers: { goal: "nope" },
      }),
    );
    expect(await res.json()).toEqual({ ok: true, stored: false });
    expect(store.ops).toEqual([]);
  });
});

describe("POST /api/subscribe, on both sides of the campaign's end", () => {
  const all = {
    email: "ana@gmail.com",
    source: "gift",
    phone: "(512) 555-0147",
    answers: { goal: "training", flavour: "lemon", learn: "offers" },
  };
  const stepTag = (tags: unknown) =>
    (tags as string[]).filter((tag) => /^(friday|founder)-/.test(tag));

  it("tags a sign-up with the campaign's step up to its last moment", async () => {
    expect(DURING.getTime()).toBeLessThan(END);
    for (const now of [DURING, new Date(END - 1000), new Date(END)]) {
      vi.setSystemTime(now);
      const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
      const store = shopify(newCustomer);
      await POST(post(all));
      expect(stepTag(store.ops[2].variables.tags)).toEqual(["friday-25"]);
    }
  });

  it("tags the same sign-up with the standing offer's step from one second after", async () => {
    for (const now of [JUST_AFTER, A_DAY_AFTER]) {
      vi.setSystemTime(now);
      const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
      const store = shopify(newCustomer);
      const res = await POST(post(all));
      // The answer names the offer it was recorded under, so a page that still
      // shows the campaign can change over.
      expect(await res.json()).toEqual({
        ok: true,
        stored: true,
        recorded: { offer: "founder", phone: true },
      });
      // The phone number is still saved; it is no longer worth a step.
      expect(store.ops[1].variables).toMatchObject({
        input: { phone: "+15125550147" },
      });
      expect(stepTag(store.ops[2].variables.tags)).toEqual(["founder-20"]);
    }
  });

  it("takes a pre-order at the campaign's top step while the campaign runs, from a member the store shows at that step", async () => {
    vi.setSystemTime(new Date(END - 1000));
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    const store = keeper([], {
      "ana@gmail.com": { phone: "+15125550147", smsState: "SUBSCRIBED" },
    });
    const top = OFFER.top.percent;
    const res = await POST(
      post(preorder({ percent: top, answers: ALL_ANSWERS })),
    );
    const { order } = await res.json();
    expect(order.percent).toBe(top);
    expect(order.toPay).toBe(discounted(TOTAL, top));
    expect(order.day).toBe("2026-11-30");
    expect(store.customers.get("ana@gmail.com")?.note).toContain(
      `Confirmed to the shopper: ${top}% off`,
    );
  });

  it("refuses that pre-order after the end and writes nothing: the page that sent it is out of date", async () => {
    for (const now of [JUST_AFTER, A_DAY_AFTER]) {
      vi.setSystemTime(now);
      const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
      const store = shopify(newCustomer);
      const res = await POST(post(preorder({ percent: OFFER.top.percent })));
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({ ok: false, error: "offer_changed" });
      expect(store.fetcher).not.toHaveBeenCalled();
    }
  });

  it("takes a pre-order at the standing offer's top after the end, tagged founder-", async () => {
    vi.setSystemTime(JUST_AFTER);
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    const store = shopify(newCustomer);
    const top = STANDING_STEPS.top.percent;
    const res = await POST(
      post(preorder({ percent: top, answers: ALL_ANSWERS })),
    );
    const { order, stored, recorded } = await res.json();
    expect(stored).toBe(true);
    expect(recorded.offer).toBe("founder");
    expect(order.percent).toBe(top);
    expect(order.toPay).toBe(discounted(TOTAL, top));
    expect(order.day).toBe("2026-12-01");
    expect(stepTag(store.ops[2].variables.tags)).toEqual(["founder-20"]);
    expect((store.ops[2].variables.tags as string[]).join(" ")).not.toMatch(
      /friday/,
    );
  });

  it("adds answers given after the end under the standing offer", async () => {
    vi.setSystemTime(A_DAY_AFTER);
    const { POST } = await route({ SHOPIFY_ADMIN_TOKEN: "shpat_test" });
    const store = shopify(
      (op) =>
        ({
          SignupFind: {
            customerByIdentifier: {
              id: "gid://shopify/Customer/7",
              note: null,
              defaultEmailAddress: { marketingState: "SUBSCRIBED" },
              defaultPhoneNumber: null,
            },
          },
          SignupTag: { tagsAdd: { userErrors: [] } },
        })[op],
    );
    await POST(
      post({
        email: "ana@gmail.com",
        source: "preferences",
        answers: { goal: "training", flavour: "lemon" },
      }),
    );
    expect(stepTag(store.ops[1].variables.tags)).toEqual(["founder-15"]);
  });
});
