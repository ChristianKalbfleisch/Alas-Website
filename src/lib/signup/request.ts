/** Request checks shared by the site's form endpoints. */

export const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;

/** The domain is case-blind, so it is stored lowercase; the name is kept as typed. */
export function normaliseEmail(email: string) {
  const at = email.lastIndexOf("@");
  return email.slice(0, at) + email.slice(at).toLowerCase();
}

/** Browsers name the page a request came from; refuse other sites posting here. */
export function crossSite(request: Request) {
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

export function visitor(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export const fail = (error: string, status: number) =>
  Response.json({ ok: false, error }, { status });
