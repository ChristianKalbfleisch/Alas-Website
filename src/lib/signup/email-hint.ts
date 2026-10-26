/**
 * Catches the slips people make typing an email ("gmial.com", "yahoo.con") and
 * offers the likely address. It only suggests; the visitor decides.
 */

/** Real mail domains, country editions included so they are never "corrected". */
const DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.ca",
  "yahoo.co.uk",
  "yahoo.com.au",
  "yahoo.de",
  "yahoo.fr",
  "yahoo.es",
  "yahoo.it",
  "yahoo.co.jp",
  "ymail.com",
  "hotmail.com",
  "hotmail.ca",
  "hotmail.co.uk",
  "hotmail.de",
  "hotmail.fr",
  "hotmail.es",
  "hotmail.it",
  "outlook.com",
  "outlook.de",
  "outlook.fr",
  "live.com",
  "live.ca",
  "live.co.uk",
  "live.de",
  "live.fr",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "comcast.net",
  "verizon.net",
  "att.net",
  "sbcglobal.net",
  "gmx.com",
  "gmx.de",
  "gmx.net",
  "web.de",
  "btinternet.com",
  "bigpond.com",
];

/** Names long enough to correct safely; short ones (aol, msn, att) sit too close to real company domains. */
const PROVIDERS = [
  ...new Set(DOMAINS.map((d) => d.slice(0, d.indexOf(".")))),
].filter((name) => name.length >= 5);

const TLDS = new Set([
  "com",
  "net",
  "org",
  "edu",
  "gov",
  "co",
  "io",
  "me",
  "us",
  "ca",
  "uk",
  "co.uk",
  "ie",
  "au",
  "com.au",
  "nz",
  "co.nz",
  "de",
  "fr",
  "es",
  "it",
  "nl",
  "be",
  "ch",
  "at",
  "se",
  "dk",
  "fi",
  "no",
  "pl",
  "pt",
  "cz",
  "gr",
  "jp",
  "co.jp",
  "kr",
  "sg",
  "hk",
  "my",
  "ae",
  "il",
  "co.il",
]);

/** Edits between two strings, a swap of neighbours counting as one. */
export function editDistance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0,
    ),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
      }
    }
  }
  return rows[a.length][b.length];
}

function closest(word: string, options: Iterable<string>, limit: number) {
  let best: string | null = null;
  let bestDistance = limit + 1;
  for (const option of options) {
    const d = editDistance(word, option);
    if (d < bestDistance) {
      best = option;
      bestDistance = d;
    }
  }
  return best;
}

/** The address the visitor probably meant, or null when it looks fine. */
export function suggestEmail(input: string): string | null {
  const email = input.trim();
  const at = email.lastIndexOf("@");
  if (at < 1 || at === email.length - 1) return null;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1).toLowerCase();
  if (DOMAINS.includes(domain)) return null;

  const dot = domain.indexOf(".");
  if (dot < 1 || dot === domain.length - 1) return null;
  let name = domain.slice(0, dot);
  const tld = domain.slice(dot + 1);

  if (!PROVIDERS.includes(name) && name.length >= 4) {
    name = closest(name, PROVIDERS, name.length >= 6 ? 2 : 1) ?? name;
  }

  const own = DOMAINS.filter((d) => d.startsWith(`${name}.`));
  if (own.length) {
    // A webmail address: snap to that provider's nearest real domain. A valid
    // ending (gmail.co) gets one edit of leeway, a broken one (yahoo.con) two.
    const pick = closest(`${name}.${tld}`, own, TLDS.has(tld) ? 1 : 2);
    return pick && pick !== domain ? `${local}@${pick}` : null;
  }

  if (!TLDS.has(tld)) {
    const fixed = closest(tld, TLDS, 1);
    if (fixed) return `${local}@${name}.${fixed}`;
  }
  return null;
}
