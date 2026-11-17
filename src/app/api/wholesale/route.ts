import { checkApplication } from "@/data/wholesale";
import {
  type AdminClient,
  adminConfig,
  createAdminClient,
} from "@/lib/shopify/admin";
import { createRateLimit } from "@/lib/signup/rate-limit";
import { crossSite, fail, normaliseEmail, visitor } from "@/lib/signup/request";
import {
  recordWholesale,
  WholesaleRejected,
} from "@/lib/wholesale/record-wholesale";

/**
 * The wholesale page posts its application here. With Shopify credentials set
 * (the same app as the email sign-ups) it is filed as a customer with the
 * details in its note and wholesale tags; Flow emails the team. Without them it
 * is checked and accepted but not kept, so the preview keeps working.
 */

const allow = createRateLimit({ max: 5, windowMs: 10 * 60_000 });

let client: AdminClient | null | undefined;
function store(): AdminClient | null {
  if (client === undefined) {
    const config = adminConfig();
    client = config ? createAdminClient(config) : null;
    if (!client) {
      console.warn(
        "[wholesale] Shopify is not connected: applications are accepted, not stored",
      );
    }
  }
  return client;
}

export async function POST(request: Request) {
  if (crossSite(request)) return fail("cross_site", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("invalid_body", 400);
  }

  const checked = checkApplication(body);
  if (!checked.ok) return fail(checked.error, 400);

  if (!allow(visitor(request))) return fail("rate_limited", 429);

  const admin = store();
  if (!admin) return Response.json({ ok: true, stored: false });

  const app = { ...checked.value, email: normaliseEmail(checked.value.email) };
  try {
    await recordWholesale(admin, app);
    return Response.json({ ok: true, stored: true });
  } catch (error) {
    if (error instanceof WholesaleRejected) return fail("invalid_email", 422);
    // Never log the application itself.
    console.error(
      `[wholesale] ${error instanceof Error ? error.message : "unknown error"}`,
    );
    return fail("store_unavailable", 502);
  }
}
