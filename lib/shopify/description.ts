/**
 * Shopify's product descriptions were authored in Framer and carry its
 * leftovers: `framer-styles-preset-…` classes that style nothing outside
 * Framer, inline styles, and — in the 15-pack — two empty <img> tags that
 * render as broken images.
 *
 * This reduces the HTML to a small allowlist of structural tags with no
 * attributes, apart from href on links. Anything not on the list has its tags
 * dropped and its text kept, so no copy is lost.
 *
 * These are the store's own descriptions, but the output still goes through
 * dangerouslySetInnerHTML, so treat this as a sanitiser and keep the list
 * tight.
 */
const ALLOWED = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "a",
]);

/** Dropped outright, content and all. */
const VOIDED = /<(script|style|iframe|object|embed|img|svg)\b[^>]*>[\s\S]*?<\/\1>|<(img|br\s*\/|hr)\b[^>]*\/?>/gi;

export function sanitiseDescription(html: string): string {
  if (!html) return "";

  let out = html
    // Comments first, so a comment cannot hide a tag from the pass below.
    .replace(/<!--[\s\S]*?-->/g, "")
    // Drop embedded and replaced elements. <br> is put back below.
    .replace(VOIDED, (match) => (/^<br/i.test(match) ? "<br />" : ""));

  out = out.replace(
    /<(\/?)([a-zA-Z0-9]+)\b([^>]*)>/g,
    (_match, slash: string, rawTag: string, attrs: string) => {
      const tag = rawTag.toLowerCase();
      if (!ALLOWED.has(tag)) return "";
      if (slash) return `</${tag}>`;
      if (tag === "br") return "<br />";

      if (tag === "a") {
        const href = attrs.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
        const value = (href?.[2] ?? href?.[3] ?? href?.[4] ?? "").trim();
        // Relative, http and https only — no javascript: or data: URLs.
        const safe = /^(https?:\/\/|\/|#|mailto:)/i.test(value);
        return safe
          ? `<a href="${value.replace(/"/g, "&quot;")}" rel="noopener noreferrer">`
          : "<a>";
      }

      // Every other allowed tag keeps its name and loses its attributes.
      return `<${tag}>`;
    },
  );

  return (
    out
      // Framer leaves paragraphs holding nothing but whitespace or a stray nbsp.
      .replace(/<p>(\s|&nbsp;|<br \/>)*<\/p>/gi, "")
      .trim()
  );
}
