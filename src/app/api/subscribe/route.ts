import {
  type AdminClient,
  adminConfig,
  createAdminClient,
} from "@/lib/shopify/admin";
import { createRateLimit } from "@/lib/signup/rate-limit";
import { recordSignup, SignupRejected } from "@/lib/signup/record-signup";

/**
 * Every email form on the site posts `{ email, source }` here. With Shopify
 * credentials set (see .env.example) the address becomes a subscribed customer
 * in the store's admin, tagged with the form it came from; Shopify Flow then
 * emails the team. Without credentials it is checked and accepted but not kept,
 * so the preview keeps working.
 */

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
const SOURCE = /^[a-z0-9-]{1,32}$/;

const allow = createRateLimit({ max: 8, windowMs: 10 * 60_000 });

let client: AdminClient | null | undefined;
function store(): AdminClient | null {
  if (client === undefined) {
    const config = adminConfig();
    client = config ? createAdminClient(config) : null;
    if (!client) {
      console.warn(
        "[subscribe] Shopify is not connected: sign-ups are accepted, not stored",
      );
    }
  }
  return client;
}

/** The domain is case-blind, so it is stored lowercase; the name is kept as typed. */
function normalise(email: string) {
  const at = email.lastIndexOf("@");
  return email.slice(0, at) + email.slice(at).toLowerCase();
}

/** Browsers name the page a request came from; refuse other sites posting here. */
function crossSite(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

function visitor(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

const fail = (error: string, status: number) =>
  Response.json({ ok: false, error }, { status });

export async function POST(request: Request) {
  if (crossSite(request)) return fail("cross_site", 403);

  let body: { email?: unknown; source?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail("invalid_body", 400);
  }

  const raw = typeof body?.email === "string" ? body.email.trim() : "";
  if (!raw || raw.length > 254 || !EMAIL.test(raw)) {
    return fail("invalid_email", 400);
  }
  const source = typeof body.source === "string" ? body.source : "site";
  if (!SOURCE.test(source)) return fail("invalid_source", 400);

  if (!allow(visitor(request))) return fail("rate_limited", 429);

  const admin = store();
  if (!admin) return Response.json({ ok: true, stored: false });

  try {
    const result = await recordSignup(admin, normalise(raw), source);
    if (!result.subscribed) {
      console.warn(
        `[subscribe] ${source}: customer kept its earlier email state`,
      );
    }
    return Response.json({ ok: true, stored: true });
  } catch (error) {
    if (error instanceof SignupRejected) return fail("invalid_email", 422);
    // Never log the address itself.
    console.error(
      `[subscribe] ${source}: ${error instanceof Error ? error.message : "unknown error"}`,
    );
    return fail("store_unavailable", 502);
  }
}
