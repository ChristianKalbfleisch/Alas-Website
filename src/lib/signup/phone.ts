/**
 * Phone numbers as Shopify stores them (E.164). Ten digits are read as a US or
 * Canadian number; any other country needs its + code. Returns null for
 * anything that cannot be a real number, so the visitor can fix it.
 */
export function normalisePhone(raw: string): string | null {
  const typed = raw.trim();
  if (!typed || /[^\d\s()+.-]/.test(typed)) return null;
  const digits = typed.replace(/\D/g, "");
  if (typed.startsWith("+")) {
    if (digits.startsWith("1")) return northAmerican(digits.slice(1));
    return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return northAmerican(digits.slice(1));
  }
  return northAmerican(digits);
}

/** Area codes and exchanges never start with 0 or 1. */
function northAmerican(digits: string): string | null {
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(digits) ? `+1${digits}` : null;
}
