import { cleanAnswers, percentFor, stepsAt } from "@/data/gift";
import {
  type AdminClient,
  adminConfig,
  createAdminClient,
} from "@/lib/shopify/admin";
import { normalisePhone } from "@/lib/signup/phone";
import {
  checkPreorder,
  holdsRef,
  PREORDER,
  type Preorder,
  preorderNote,
  preorderTags,
  settle,
} from "@/lib/signup/preorder";
import { createRateLimit } from "@/lib/signup/rate-limit";
import {
  NoteFull,
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
 * and the step they earn, for someone who has already joined.
 *
 * The cart posts a pre-order by email here too, as the source "preorder": the
 * address, a reference the browser made for it, every line with its quantity,
 * the percentage the cart showed and the figure it showed to pay, in one
 * request that counts once against the limit below. The lines are priced from
 * the catalogue and written to the customer's note with the tags
 * site-preorder, one per product, one for the day and one for the reference;
 * the answer carries the same lines and amounts back, for the shopper's
 * confirmation. The same pre-order sent again, with the same reference, is
 * answered as kept and written once.
 *
 * Nothing is recorded with more off than the request and the store's record
 * back: the email, a step for each answer sent, and the phone step only for a
 * number sent with a sign-up or a customer the store shows as getting texts. A
 * pre-order that names more is recorded at what is backed, and the answer
 * says so. A pre-order never brings a phone number and never switches email
 * marketing back on for a customer who had unsubscribed.
 *
 * The offer in force is read from the clock for every request: the step a
 * sign-up is tagged with and the percentages a pre-order may carry are those
 * of the campaign while it runs and of the standing offer from its last moment
 * on. A pre-order that still carries a step of the offer that has ended is
 * refused with "offer_changed" (409), and one whose figure to pay is not the
 * one worked out here with "total_changed" (409); nothing is written: the page
 * that sent it is out of date. A customer whose note has no room left gets
 * "note_full" (409).
 *
 * A kept sign-up is answered with what it was recorded under (`recorded`: the
 * offer's tag, and whether the phone step is part of it), so a device whose
 * own memory says more can correct itself. Answers sent on their own
 * ("preferences") are answered as kept only when a customer took them.
 *
 * Without credentials everything is checked and accepted but not kept, and the
 * answer says so (`stored: false`), so no screen claims otherwise.
 */

const SOURCE = /^[a-z0-9-]{1,32}$/;

/** Refusals that mean the page that sent a pre-order shows what no longer holds. */
const STALE = new Set(["offer_changed", "total_changed"]);

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
    ref?: unknown;
    lines?: unknown;
    percent?: unknown;
    toPay?: unknown;
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
  // One product per request, with no quantity, is how pre-orders used to
  // arrive: refused, so a product tag always comes with the lines in the note.
  if (!SOURCE.test(source) || source.startsWith(`${PREORDER}-`)) {
    return fail("invalid_source", 400);
  }

  let phone: string | null = null;
  // The cart's form asks for no number and says nothing about texts.
  if (
    source !== PREORDER &&
    typeof body.phone === "string" &&
    body.phone.trim()
  ) {
    phone = body.phone.length <= 32 ? normalisePhone(body.phone) : null;
    if (!phone) return fail("invalid_phone", 400);
  }
  const answers = cleanAnswers(body.answers);

  const now = new Date();
  const offer = stepsAt(now.getTime());
  let order: Preorder | null = null;
  if (source === PREORDER) {
    const checked = checkPreorder(body, offer, now);
    if (!checked.ok) {
      return fail(checked.error, STALE.has(checked.error) ? 409 : 400);
    }
    order = checked.order;
  }

  if (!allow(visitor(request))) return fail("rate_limited", 429);

  const admin = store();
  if (!admin) {
    return Response.json({ ok: true, stored: false, ...(order && { order }) });
  }

  try {
    if (source === PREFERENCES) {
      const stored = await recordPreferences(
        admin,
        normaliseEmail(raw),
        answers,
        now,
      );
      return Response.json({ ok: true, stored });
    }
    const asked = order;
    const result = await recordSignup(
      admin,
      {
        email: normaliseEmail(raw),
        source,
        phone,
        answers,
        ...(asked && {
          keepUnsubscribed: true,
          entry: (earned) => {
            order = settle(asked, percentFor(offer, earned));
            return {
              holds: (note) => holdsRef(note, asked.ref),
              text: preorderNote(order),
              tags: preorderTags(order),
            };
          },
        }),
      },
      now,
    );
    if (!result.subscribed) {
      console.warn(
        `[subscribe] ${source}: customer kept its earlier email state`,
      );
    }
    if (phone && !result.texting) {
      console.warn(`[subscribe] ${source}: phone number not added`);
    }
    return Response.json({
      ok: true,
      stored: true,
      recorded: { offer: offer.tag, phone: result.earned.phone },
      ...(order && { order }),
    });
  } catch (error) {
    if (error instanceof SignupRejected) return fail("invalid_email", 422);
    if (error instanceof NoteFull) return fail("note_full", 409);
    // Never log the address itself.
    console.error(
      `[subscribe] ${source}: ${error instanceof Error ? error.message : "unknown error"}`,
    );
    return fail("store_unavailable", 502);
  }
}
