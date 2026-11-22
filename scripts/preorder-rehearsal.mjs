// A rehearsal of a pre-order by email, with no network at all.
//   node scripts/preorder-rehearsal.mjs [folder for the results]
//
// It runs the sign-up endpoint's own code (src/app/api/subscribe/route.ts) for
// one cart: one Lemon Pouch, one set and two packs of five Lemon sticks.
//
// 1. With no store connection: the answer must say nothing was stored.
// 2. Against a pretend store that records every call: the answer must say
//    stored, and the customer's note must hold the reference, the day on the
//    US Pacific coast, the three lines with quantities 1, 1 and 2 and the total
//    worked out here from the catalogue.
// 3. Against a pretend store that keeps what it is given: a try whose tag call
//    fails and is sent again is written once; a second pre-order gets a block
//    and a tag of its own; a request that names the top step with nothing
//    behind it is recorded at the email step; a customer who had unsubscribed
//    stays unsubscribed; a figure to pay that is not the server's is refused
//    with nothing written.
//
// The runs are written as JSON (default folder: shots/preorder-rehearsal) and
// a short pass or fail is printed. Any real network call fails the rehearsal.
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.resolve(process.argv[2] ?? "shots/preorder-rehearsal");

// The site's code is TypeScript with "@/…" imports and no file endings. Node
// drops the types by itself; this finds the files.
registerHooks({
  resolve(specifier, context, next) {
    let target = specifier;
    if (specifier.startsWith("@/")) {
      target = pathToFileURL(path.join(root, "src", specifier.slice(2))).href;
    }
    if (/^(\.|file:)/.test(target) && !/\.\w+(\?.*)?$/.test(target)) {
      const file = new URL(`${target}.ts`, context.parentURL);
      if (existsSync(file)) target = file.href;
    }
    return next(target, context);
  },
});

const { getProduct } = await import("@/data/products");
const { stepsAt } = await import("@/data/gift");

const CART = [
  { handle: "lemon-pouch", qty: 1 },
  { handle: "discovery-set", qty: 1 },
  { handle: "lemon-sticks-5", qty: 2 },
];
const EMAIL = "rehearsal@example.com";
const REF = "k7q2mxd9";
const OFFER = stepsAt(Date.now());
// What a visitor who has answered no question is shown: the first step of the
// offer in force today.
const PERCENT = OFFER.start.percent;
const TOP = OFFER.top.percent;

// What the note has to say, worked out here from the catalogue alone.
const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const money = (cents) => usd.format(cents / 100);
const expected = CART.map(({ handle, qty }) => {
  const product = getProduct(handle);
  const each = Math.round(product.price * 100);
  const name =
    product.kind === "sticks"
      ? `${product.name} (pack of ${product.sticks})`
      : product.name;
  return { handle, name, qty, each, total: each * qty };
});
const totalCents = expected.reduce((sum, line) => sum + line.total, 0);
const after = (percent) => Math.round((totalCents * (100 - percent)) / 100);
const toPayCents = after(PERCENT);
const expectedLines = expected.map(
  (l) => `${l.name} × ${l.qty}, ${money(l.each)} each, ${money(l.total)}`,
);
// Today on the US Pacific coast, as 2026-11-21.
const day = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Los_Angeles",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

/** What the cart sends: its reference, its lines, the percentage and the figure it showed. */
const sent = (extra = {}) => {
  const percent = extra.percent ?? PERCENT;
  return {
    email: EMAIL,
    source: "preorder",
    ref: REF,
    lines: CART,
    percent,
    toPay: after(percent) / 100,
    answers: {},
    ...extra,
  };
};

const request = (body) =>
  new Request("http://localhost/api/subscribe", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      host: "localhost",
      "x-forwarded-for": "203.0.113.7",
    },
    body: JSON.stringify(body),
  });

/**
 * Loads the endpoint freshly, with `fetch` replaced by `store`, and gives a
 * function that posts to it and the list of calls the store received.
 */
async function endpoint(name, env, store) {
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("SHOPIFY_")) delete process.env[key];
  }
  Object.assign(process.env, env);
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    const { query, variables } = JSON.parse(String(init.body ?? "{}"));
    const op = String(query).match(/(?:query|mutation) (\w+)/)?.[1] ?? "?";
    calls.push({ url: String(url), op, variables });
    return store(op, variables);
  };
  const route = pathToFileURL(
    path.join(root, "src/app/api/subscribe/route.ts"),
  );
  const { POST } = await import(`${route.href}?run=${name}`);
  const post = async (body) => {
    const response = await POST(request(body));
    return { status: response.status, body: await response.json() };
  };
  return { post, calls };
}

/** A pretend store that keeps customers by address; `fail` names a call that fails once. */
function keeper(fail = []) {
  const customers = new Map();
  const byId = (id) => [...customers.values()].find((c) => c.id === id);
  const apply = (op, variables) => {
    const input = variables.input ?? {};
    if (op === "SignupFind") {
      const c = customers.get(variables.email);
      return {
        customerByIdentifier: c
          ? {
              id: c.id,
              note: c.note,
              defaultEmailAddress: { marketingState: c.marketingState },
              defaultPhoneNumber: null,
            }
          : null,
      };
    }
    if (op === "SignupCreate") {
      const id = `gid://shopify/Customer/${customers.size + 1}`;
      customers.set(input.email, {
        id,
        note: input.note ?? null,
        tags: new Set(),
        marketingState: "SUBSCRIBED",
      });
      return { customerCreate: { customer: { id }, userErrors: [] } };
    }
    if (op === "SignupConsent") {
      byId(input.customerId).marketingState = "SUBSCRIBED";
      return { customerEmailMarketingConsentUpdate: { userErrors: [] } };
    }
    if (op === "SignupNote") {
      byId(input.id).note = input.note;
      return { customerUpdate: { userErrors: [] } };
    }
    if (op === "SignupTag") {
      for (const tag of variables.tags) byId(variables.id).tags.add(tag);
      return { tagsAdd: { userErrors: [] } };
    }
    throw new Error(`pretend store: unexpected ${op}`);
  };
  const store = (op, variables) => {
    const at = fail.indexOf(op);
    if (at >= 0) {
      fail.splice(at, 1);
      return new Response("down", { status: 500 });
    }
    return Response.json({ data: apply(op, variables) });
  };
  const blocks = () =>
    (customers.get(EMAIL)?.note ?? "").split("Pre-order by email").length - 1;
  return { store, customers, blocks };
}

const CONNECTED = {
  SHOPIFY_ADMIN_TOKEN: "rehearsal",
  SHOPIFY_STORE_DOMAIN: "store.invalid",
};
const realFetch = globalThis.fetch;
const quiet = { warn: console.warn, error: console.error };
console.warn = () => {};
console.error = () => {};

const results = [];
function check(run, label, ok, detail) {
  results.push({ run, label, ok: Boolean(ok), ...(ok ? {} : { detail }) });
}

// 1. No store connection: accepted, and the answer says nothing was stored.
const offlineRun = await endpoint("not-connected", {}, () => {
  throw new Error("a network call was made without a store connection");
});
const offline = { ...(await offlineRun.post(sent())), calls: offlineRun.calls };
check(
  "not connected",
  "the answer says not stored",
  offline.status === 200 &&
    offline.body.ok === true &&
    offline.body.stored === false,
  offline.body,
);
check(
  "not connected",
  "nothing was sent anywhere",
  offline.calls.length === 0,
  offline.calls,
);

// 2. A pretend store that takes a new customer and records every call.
const answers = {
  SignupFind: { customerByIdentifier: null },
  SignupCreate: {
    customerCreate: {
      customer: { id: "gid://shopify/Customer/1" },
      userErrors: [],
    },
  },
  SignupTag: { tagsAdd: { userErrors: [] } },
};
const pretendRun = await endpoint("pretend-store", CONNECTED, (op) =>
  Response.json({ data: answers[op] }),
);
const pretend = { ...(await pretendRun.post(sent())), calls: pretendRun.calls };
const created = pretend.calls.find((c) => c.op === "SignupCreate");
const tagged = pretend.calls.find((c) => c.op === "SignupTag");
const note = String(created?.variables?.input?.note ?? "");
const noteLines = note.split("\n");
const tags = tagged?.variables?.tags ?? [];

check(
  "pretend store",
  "the answer says stored",
  pretend.status === 200 &&
    pretend.body.ok === true &&
    pretend.body.stored === true,
  pretend.body,
);
check(
  "pretend store",
  "every call went to the pretend store",
  pretend.calls.length > 0 &&
    pretend.calls.every((c) => c.url.startsWith("https://store.invalid/")),
  pretend.calls.map((c) => c.url),
);
check(
  "pretend store",
  "the note is headed by the reference and today's date on the US Pacific coast",
  noteLines[0] ===
    `Pre-order by email, ref ${REF}, ${day} US Pacific time (website)`,
  noteLines[0],
);
check(
  "pretend store",
  "the note holds the three lines with quantities 1, 1 and 2",
  expectedLines.every((line) => noteLines.includes(line)) &&
    noteLines.filter((line) => line.includes(" each, ")).length === 3,
  { note, expectedLines },
);
check(
  "pretend store",
  "a pack of sticks is named so that its quantity cannot be read as a sum",
  noteLines.includes("Lemon Sticks (pack of 5) × 2, $12.99 each, $25.98"),
  note,
);
check(
  "pretend store",
  `the note's total is the catalogue's: ${money(totalCents)}`,
  noteLines.includes(`Total: ${money(totalCents)}`),
  note,
);
check(
  "pretend store",
  `the note ends on what the shopper was told: ${PERCENT}% off, ${money(toPayCents)}`,
  noteLines.at(-1) ===
    `Confirmed to the shopper: ${PERCENT}% off, ${money(toPayCents)} to pay`,
  note,
);
check(
  "pretend store",
  "the tags name the pre-order, each product, the day and the reference",
  [
    "site-preorder",
    ...CART.map((l) => `site-preorder-${l.handle}`),
    `site-preorder-${day.replaceAll("-", "")}`,
    `site-preorder-ref-${REF}`,
  ].every((tag) => tags.includes(tag)),
  tags,
);
check(
  "pretend store",
  "the note is written before the tags go on",
  pretend.calls.indexOf(created) >= 0 &&
    pretend.calls.indexOf(created) < pretend.calls.indexOf(tagged),
  pretend.calls.map((c) => c.op),
);
check(
  "pretend store",
  "the shopper's confirmation is the saved pre-order, line for line, with its reference and day",
  JSON.stringify(
    pretend.body.order?.lines?.map((l) => [l.handle, l.name, l.qty, l.total]),
  ) ===
    JSON.stringify(
      expected.map((l) => [l.handle, l.name, l.qty, l.total / 100]),
    ) &&
    pretend.body.order?.total === totalCents / 100 &&
    pretend.body.order?.toPay === toPayCents / 100 &&
    pretend.body.order?.ref === REF &&
    pretend.body.order?.day === day,
  pretend.body.order,
);

// 3. A pretend store that keeps what it is given.
const RUN3 = "a store that keeps things";
{
  // The tag call fails once; the cart sends the same pre-order again.
  const kept = keeper(["SignupTag"]);
  const { post } = await endpoint("try-again", CONNECTED, kept.store);
  const first = await post(sent());
  const afterFirst = kept.blocks();
  const second = await post(sent());
  check(
    RUN3,
    "a try whose tag call fails is not answered as kept, although the note is written",
    first.status === 502 && afterFirst === 1,
    { first, afterFirst },
  );
  check(
    RUN3,
    "sent again with the same reference, it is answered as kept and written once",
    second.body.stored === true &&
      kept.blocks() === 1 &&
      kept.customers.get(EMAIL).tags.has(`site-preorder-ref-${REF}`),
    { second: second.body, blocks: kept.blocks() },
  );

  // A second pre-order, the same day, for a product already pre-ordered.
  const before = new Set(kept.customers.get(EMAIL).tags);
  const one = [{ handle: "lemon-pouch", qty: 1 }];
  const price = Math.round(getProduct("lemon-pouch").price * 100);
  const third = await post(
    sent({
      ref: "k7q2mxd8",
      lines: one,
      toPay: Math.round((price * (100 - PERCENT)) / 100) / 100,
    }),
  );
  const fresh = [...kept.customers.get(EMAIL).tags].filter(
    (tag) => !before.has(tag),
  );
  check(
    RUN3,
    "a second pre-order gets a block of its own and one tag the customer did not have",
    third.body.stored === true &&
      kept.blocks() === 2 &&
      fresh.join(" ") === "site-preorder-ref-k7q2mxd8",
    { third: third.body, blocks: kept.blocks(), fresh },
  );
}
{
  // The top step named with no answer and no number behind it.
  const kept = keeper();
  const { post } = await endpoint("names-more", CONNECTED, kept.store);
  const answer = await post(sent({ percent: TOP }));
  const last = (kept.customers.get(EMAIL)?.note ?? "").split("\n").at(-1);
  check(
    RUN3,
    `a request that names ${TOP}% with nothing behind it is recorded at ${PERCENT}%, and the confirmation says so`,
    answer.body.order?.percent === PERCENT &&
      answer.body.order?.toPay === toPayCents / 100 &&
      answer.body.order?.asked === TOP &&
      last ===
        `Confirmed to the shopper: ${PERCENT}% off, ${money(toPayCents)} to pay`,
    { order: answer.body.order, last },
  );
}
{
  // A customer who had unsubscribed from emails.
  const kept = keeper();
  kept.customers.set(EMAIL, {
    id: "gid://shopify/Customer/9",
    note: null,
    tags: new Set(),
    marketingState: "UNSUBSCRIBED",
  });
  const { post, calls } = await endpoint("unsubscribed", CONNECTED, kept.store);
  const answer = await post(sent());
  check(
    RUN3,
    "a customer who had unsubscribed keeps that state; the note and the tags are still written",
    answer.body.stored === true &&
      kept.customers.get(EMAIL).marketingState === "UNSUBSCRIBED" &&
      kept.blocks() === 1 &&
      !calls.some((c) => c.op === "SignupConsent"),
    { answer: answer.body, calls: calls.map((c) => c.op) },
  );
}
{
  // A figure to pay that is not the server's own: the page is out of date.
  const kept = keeper();
  const { post, calls } = await endpoint("out-of-date", CONNECTED, kept.store);
  const answer = await post(sent({ toPay: toPayCents / 100 - 1 }));
  check(
    RUN3,
    "a figure to pay that is not the server's own is refused, and nothing is written",
    answer.status === 409 &&
      answer.body.error === "total_changed" &&
      calls.length === 0,
    { answer, calls: calls.map((c) => c.op) },
  );
}

globalThis.fetch = realFetch;
console.warn = quiet.warn;
console.error = quiet.error;

const passed = results.every((r) => r.ok);
await mkdir(out, { recursive: true });
for (const [file, name, result] of [
  ["rehearsal-not-connected.json", "not connected", offline],
  ["rehearsal-pretend-store.json", "pretend store", pretend],
]) {
  await writeFile(
    path.join(out, file),
    `${JSON.stringify(
      {
        run: name,
        sent: sent(),
        answer: { status: result.status, body: result.body },
        callsToTheStore: result.calls,
        checks: results.filter((r) => r.run === name),
      },
      null,
      2,
    )}\n`,
  );
}
await writeFile(
  path.join(out, "rehearsal-a-store-that-keeps-things.json"),
  `${JSON.stringify({ run: RUN3, checks: results.filter((r) => r.run === RUN3) }, null, 2)}\n`,
);

for (const r of results) {
  console.log(`${r.ok ? "pass" : "FAIL"}  ${r.run}: ${r.label}`);
  if (!r.ok) console.log(`      ${JSON.stringify(r.detail)}`);
}
console.log(
  `${passed ? "PASS" : "FAIL"}: ${results.filter((r) => r.ok).length} of ${results.length} checks. Results in ${out}`,
);
process.exitCode = passed ? 0 : 1;
