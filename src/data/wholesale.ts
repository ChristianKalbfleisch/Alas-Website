import { normalisePhone } from "@/lib/signup/phone";
import { EMAIL } from "@/lib/signup/request";

/**
 * The wholesale application: who is asking, what they run, what they want.
 * Applications land in Shopify as a customer with the details in its note and
 * wholesale tags, and Shopify Flow emails the team (see shopify/README.md).
 * No prices or terms are promised here; the team replies with those.
 */

export const WHOLESALE_TYPES = [
  { id: "shop", label: "Shop or market" },
  { id: "gym", label: "Gym or studio" },
  { id: "spa", label: "Spa or salon" },
  { id: "food", label: "Café or restaurant" },
  { id: "gifts", label: "Gifts for clients or teams" },
  { id: "distributor", label: "Distributor" },
  { id: "other", label: "Something else" },
] as const;

export const WHOLESALE_VOLUMES = [
  { id: "starting", label: "Just starting out" },
  { id: "under-50", label: "Under 50 units a month" },
  { id: "50-200", label: "50 to 200 a month" },
  { id: "200-1000", label: "200 to 1,000 a month" },
  { id: "1000-plus", label: "More than 1,000 a month" },
] as const;

export const WHOLESALE_PRODUCTS = [
  { id: "pouches", label: "Pouches" },
  { id: "sticks", label: "Classic Sticks" },
  { id: "boxes", label: "Welcome Boxes" },
] as const;

export type WholesaleApplication = {
  business: string;
  name: string;
  email: string;
  phone: string | null;
  website: string;
  type: string;
  location: string;
  volume: string;
  products: string[];
  message: string;
  /** Wants wholesale news by email (marketing consent). */
  updates: boolean;
};

export type WholesaleError =
  | "missing_business"
  | "missing_name"
  | "invalid_email"
  | "invalid_phone"
  | "invalid_type"
  | "missing_location"
  | "too_long";

const LIMITS = {
  business: 120,
  name: 80,
  website: 200,
  location: 120,
  message: 1500,
} as const;

const text = (value: unknown) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

const label = <T extends readonly { id: string; label: string }[]>(
  list: T,
  id: string,
) => list.find((item) => item.id === id)?.label ?? "";

/** Checks an application from the form; the same rules run in the browser and the endpoint. */
export function checkApplication(
  raw: unknown,
):
  | { ok: true; value: WholesaleApplication }
  | { ok: false; error: WholesaleError } {
  const given = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const business = text(given.business);
  const name = text(given.name);
  const email = text(given.email);
  const website = text(given.website);
  const location = text(given.location);
  const message = typeof given.message === "string" ? given.message.trim() : "";
  const type = text(given.type);
  const volume = text(given.volume);
  const phoneTyped = text(given.phone);

  if (!business) return { ok: false, error: "missing_business" };
  if (!name) return { ok: false, error: "missing_name" };
  if (!email || email.length > 254 || !EMAIL.test(email)) {
    return { ok: false, error: "invalid_email" };
  }
  const phone = phoneTyped ? normalisePhone(phoneTyped) : null;
  if (phoneTyped && !phone) return { ok: false, error: "invalid_phone" };
  if (!label(WHOLESALE_TYPES, type))
    return { ok: false, error: "invalid_type" };
  if (!location) return { ok: false, error: "missing_location" };
  if (
    business.length > LIMITS.business ||
    name.length > LIMITS.name ||
    website.length > LIMITS.website ||
    location.length > LIMITS.location ||
    message.length > LIMITS.message
  ) {
    return { ok: false, error: "too_long" };
  }

  const products = Array.isArray(given.products)
    ? WHOLESALE_PRODUCTS.filter((p) =>
        (given.products as unknown[]).includes(p.id),
      ).map((p) => p.id)
    : [];

  return {
    ok: true,
    value: {
      business,
      name,
      email,
      phone,
      website,
      type,
      location,
      volume: label(WHOLESALE_VOLUMES, volume) ? volume : "",
      products,
      message,
      updates: given.updates === true,
    },
  };
}

/** The application as it reads in the customer's note in Shopify. */
export function applicationNote(app: WholesaleApplication, on: Date): string {
  const lines = [
    `Wholesale application, ${on.toISOString().slice(0, 10)} (website)`,
    `Business: ${app.business}`,
    `Contact: ${app.name}`,
    `Type: ${label(WHOLESALE_TYPES, app.type)}`,
    `Location: ${app.location}`,
  ];
  if (app.website) lines.push(`Website: ${app.website}`);
  if (app.phone) lines.push(`Phone: ${app.phone}`);
  if (app.volume) {
    lines.push(`Monthly order: ${label(WHOLESALE_VOLUMES, app.volume)}`);
  }
  if (app.products.length) {
    lines.push(
      `Interested in: ${app.products.map((id) => label(WHOLESALE_PRODUCTS, id)).join(", ")}`,
    );
  }
  if (app.message) lines.push(`Message: ${app.message}`);
  lines.push(`Wholesale news by email: ${app.updates ? "yes" : "no"}`);
  return lines.join("\n");
}

export const wholesaleTags = (app: WholesaleApplication) => [
  "site-wholesale",
  "wholesale-applicant",
  `wholesale-${app.type}`,
];
