import { type AdminClient, AdminError } from "@/lib/shopify/admin";

/**
 * Every form on the site is a sign-up for ALAS emails. The Ritual's buttons and
 * the club page are its waitlist; every other form carries the 10% welcome offer.
 */
export type SignupPurpose = "ritual-waitlist" | "welcome-10";

export function signupPurpose(source: string): SignupPurpose {
  return source === "club" || source.startsWith("ritual")
    ? "ritual-waitlist"
    : "welcome-10";
}

/**
 * Tags written on the Shopify customer. Shopify Flow's "Customer tags added"
 * runs only for tags new to that customer, so a repeat sign-up from the same
 * form adds nothing and sends no second email.
 */
export function signupTags(source: string): string[] {
  return ["site-signup", `site-${source}`, signupPurpose(source)];
}

/** Shopify refused the address itself, so asking again will not help. */
export class SignupRejected extends Error {
  override name = "SignupRejected";
}

export type SignupResult = {
  customerId: string;
  created: boolean;
  /** False when Shopify kept an earlier state (a pending double opt-in, a bounced address). */
  subscribed: boolean;
};

type Found = { id: string; marketingState: string | null };
type UserError = { field?: string[] | null; message: string };

const FIND = `query SignupFind($email: String!) {
  customerByIdentifier(identifier: { emailAddress: $email }) {
    id
    defaultEmailAddress { marketingState }
  }
}`;

const CREATE = `mutation SignupCreate($input: CustomerInput!) {
  customerCreate(input: $input) {
    customer { id }
    userErrors { field message }
  }
}`;

const CONSENT = `mutation SignupConsent($input: CustomerEmailMarketingConsentUpdateInput!) {
  customerEmailMarketingConsentUpdate(input: $input) {
    userErrors { field message code }
  }
}`;

const TAG = `mutation SignupTag($id: ID!, $tags: [String!]!) {
  tagsAdd(id: $id, tags: $tags) {
    userErrors { field message }
  }
}`;

/** States a fresh sign-up may move to subscribed. Pending and invalid stay as Shopify set them. */
const RESUBSCRIBE = new Set(["NOT_SUBSCRIBED", "UNSUBSCRIBED"]);

async function find(client: AdminClient, email: string): Promise<Found | null> {
  const data = await client.graphql<{
    customerByIdentifier: {
      id: string;
      defaultEmailAddress: { marketingState: string } | null;
    } | null;
  }>(FIND, { email });
  const customer = data.customerByIdentifier;
  if (!customer) return null;
  return {
    id: customer.id,
    marketingState: customer.defaultEmailAddress?.marketingState ?? null,
  };
}

const messages = (errors: UserError[]) =>
  errors.map((e) => e.message).join("; ");

/**
 * Puts one sign-up into Shopify: finds or creates the customer, subscribes them
 * to email marketing, then adds the sign-up tags.
 */
export async function recordSignup(
  client: AdminClient,
  email: string,
  source: string,
  now: Date = new Date(),
): Promise<SignupResult> {
  const consent = {
    marketingState: "SUBSCRIBED",
    marketingOptInLevel: "SINGLE_OPT_IN",
    consentUpdatedAt: now.toISOString(),
  };

  let customer = await find(client, email);
  let created = false;
  let subscribed = customer?.marketingState === "SUBSCRIBED";

  if (!customer) {
    const data = await client.graphql<{
      customerCreate: {
        customer: { id: string } | null;
        userErrors: UserError[];
      };
    }>(CREATE, { input: { email, emailMarketingConsent: consent } });
    const { customer: made, userErrors } = data.customerCreate;
    if (made) {
      customer = { id: made.id, marketingState: "SUBSCRIBED" };
      created = true;
      subscribed = true;
    } else {
      // Two sign-ups at once: the other request made the customer first.
      customer = await find(client, email);
      if (!customer) {
        if (userErrors.some((e) => e.field?.includes("email"))) {
          throw new SignupRejected(messages(userErrors));
        }
        throw new AdminError(`customerCreate: ${messages(userErrors)}`);
      }
      subscribed = customer.marketingState === "SUBSCRIBED";
    }
  }

  if (!subscribed && RESUBSCRIBE.has(customer.marketingState ?? "")) {
    const data = await client.graphql<{
      customerEmailMarketingConsentUpdate: { userErrors: UserError[] };
    }>(CONSENT, {
      input: { customerId: customer.id, emailMarketingConsent: consent },
    });
    subscribed =
      data.customerEmailMarketingConsentUpdate.userErrors.length === 0;
  }

  const tagged = await client.graphql<{
    tagsAdd: { userErrors: UserError[] };
  }>(TAG, { id: customer.id, tags: signupTags(source) });
  if (tagged.tagsAdd.userErrors.length) {
    throw new AdminError(`tagsAdd: ${messages(tagged.tagsAdd.userErrors)}`);
  }

  return { customerId: customer.id, created, subscribed };
}
