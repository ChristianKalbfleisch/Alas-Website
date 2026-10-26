/**
 * Email capture stand-in. Validates `{ email, source }` and answers `{ ok: true }`.
 * It stores and sends nothing until the owners choose an email tool; wire that tool in
 * here and every form on the site (gift, quiz, club, others) starts working for real.
 */

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
const SOURCE = /^[a-z0-9-]{1,32}$/;

type Payload = { email?: unknown; source?: unknown };

export async function POST(request: Request) {
  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!email || email.length > 254 || !EMAIL.test(email)) {
    return Response.json(
      { ok: false, error: "invalid_email" },
      { status: 400 },
    );
  }

  const source = typeof body.source === "string" ? body.source : "site";
  if (!SOURCE.test(source)) {
    return Response.json(
      { ok: false, error: "invalid_source" },
      { status: 400 },
    );
  }

  return Response.json({ ok: true });
}
