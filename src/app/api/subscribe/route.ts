import { cleanAnswers } from "@/data/gift";
import {
  type AdminClient,
  adminConfig,
  createAdminClient,
} from "@/lib/shopify/admin";
import { normalisePhone } from "@/lib/signup/phone";
import { createRateLimit } from "@/lib/signup/rate-limit";
import {
  PREFERENCES,
  recordPreferences,
  recordSignup,
  SignupRejected,
} from "@/lib/signup/record-signup";
import {
  crossSite,
  EMAIL,
  fail,
  normaliseEmail,
  visitor,
} from "@/lib/signup/request";

/**
 * Every email form on the site posts `{ email, source }` here, with the answers
 * this visitor has given to the offer's questions; the Founding Member form
 * also sends a phone number for texts when the visitor gives one. Each answer
 * and the phone number are worth a step of the offer (the tags are in
 * src/lib/signup/record-signup.ts). With Shopify credentials set (see
 * .env.example) the address becomes a subscribed customer in the store's admin,
 * tagged with the form it came from, the step earned and the answers; Shopify
 * Flow then emails the team. A post with the source "preferences" adds answers,
 * and the step they earn, for someone who has already joined. Without
 * credentials everything is checked and accepted but not kept, so the preview
 * keeps working.
 */

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

export async function POST(request: Request) {
  if (crossSite(request)) return fail("cross_site", 403);

  let body: {
    email?: unknown;
    source?: unknown;
    phone?: unknown;
    answers?: unknown;
  };
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

  let phone: string | null = null;
  if (typeof body.phone === "string" && body.phone.trim()) {
    phone = body.phone.length <= 32 ? normalisePhone(body.phone) : null;
    if (!phone) return fail("invalid_phone", 400);
  }
  const answers = cleanAnswers(body.answers);

  if (!allow(visitor(request))) return fail("rate_limited", 429);

  const admin = store();
  if (!admin) return Response.json({ ok: true, stored: false });

  try {
    if (source === PREFERENCES) {
      await recordPreferences(admin, normaliseEmail(raw), answers);
      return Response.json({ ok: true, stored: true });
    }
    const result = await recordSignup(admin, {
      email: normaliseEmail(raw),
      source,
      phone,
      answers,
    });
    if (!result.subscribed) {
      console.warn(
        `[subscribe] ${source}: customer kept its earlier email state`,
      );
    }
    if (phone && !result.texting) {
      console.warn(`[subscribe] ${source}: phone number not added`);
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
