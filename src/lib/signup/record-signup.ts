import {
  answeredCount,
  answerTags,
  type GiftAnswers,
  offerTag,
  type Progress,
} from "@/data/gift";
import { type AdminClient, AdminError } from "@/lib/shopify/admin";

/**
 * Every form on the site is a sign-up for ALAS emails. The Ritual's buttons are
 * its waitlist and the Discover Set's form is that set's waitlist. Every other
 * form joins the Founding Members, tagged with the offer in force and the
 * percentage earned: the base for an email, a step for each question answered
 * and a last step for a phone number. During Black Friday that runs from
 * friday-5 to friday-25; under the standing offer the tags start with founder-.
 */
export type SignupPurpose =
  | "ritual-waitlist"
  | "discover-waitlist"
  | `${string}-${number}`;

/** Added to every Founding Member sign-up; waitlists do not get it. */
export const FOUNDING_LEAD = "founding-member-lead";

const JOINED: Progress = { answers: 0, phone: false };

export function signupPurpose(
  source: string,
  progress: Progress = JOINED,
): SignupPurpose {
  if (source === "club" || source.startsWith("ritual")) {
    return "ritual-waitlist";
  }
  if (source.startsWith("discover")) return "discover-waitlist";
  return offerTag(progress) as SignupPurpose;
}

/**
 * Tags written on the Shopify customer. Shopify Flow's "Customer tags added"
 * runs only for tags new to that customer, so signing up again adds nothing and
 * sends no second email, unless the member has since earned a higher step (more
 * answers, or a phone number), which adds that step's tag.
 */
export function signupTags({
  source,
  answers = {},
  phone = null,
}: Pick<Signup, "source" | "answers" | "phone">): string[] {
  const purpose = signupPurpose(source, {
    answers: answeredCount(answers),
    phone: Boolean(phone),
  });
  return [
    "site-signup",
    `site-${source}`,
    purpose,
    ...(purpose.endsWith("-waitlist") ? [] : [FOUNDING_LEAD]),
    ...answerTags(answers),
  ];
}

export type Signup = {
  email: string;
  source: string;
  /** E.164, given with consent to marketing texts; worth the offer's last step. */
  phone?: string | null;
  /** The answers to the questions; each one is worth a step. */
  answers?: GiftAnswers;
};

/** Shopify refused the address itself, so asking again will not help. */
export class SignupRejected extends Error {
  override name = "SignupRejected";
}

export type SignupResult = {
  customerId: string;
  created: boolean;
  /** False when Shopify kept an earlier state (a pending double opt-in, a bounced address). */
  subscribed: boolean;
  /** True when the phone number is on the customer and subscribed to texts. */
  texting: boolean;
};

type Found = {
  id: string;
  marketingState: string | null;
  phone: string | null;
  smsState: string | null;
};
type UserError = { field?: string[] | null; message: string };
type Consent = {
  marketingState: string;
  marketingOptInLevel: string;
  consentUpdatedAt: string;
};

const FIND = `query SignupFind($email: String!) {
  customerByIdentifier(identifier: { emailAddress: $email }) {
    id
    defaultEmailAddress { marketingState }
    defaultPhoneNumber { phoneNumber smsMarketingConsent { state } }
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

const PHONE = `mutation SignupPhone($input: CustomerInput!) {
  customerUpdate(input: $input) {
    userErrors { field message }
  }
}`;

const TEXTS = `mutation SignupTexts($input: CustomerSmsMarketingConsentUpdateInput!) {
  customerSmsMarketingConsentUpdate(input: $input) {
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
      defaultPhoneNumber: {
        phoneNumber: string;
        smsMarketingConsent: { state: string } | null;
      } | null;
    } | null;
  }>(FIND, { email });
  const customer = data.customerByIdentifier;
  if (!customer) return null;
  return {
    id: customer.id,
    marketingState: customer.defaultEmailAddress?.marketingState ?? null,
    phone: customer.defaultPhoneNumber?.phoneNumber ?? null,
    smsState: customer.defaultPhoneNumber?.smsMarketingConsent?.state ?? null,
  };
}

async function create(client: AdminClient, input: Record<string, unknown>) {
  const data = await client.graphql<{
    customerCreate: {
      customer: { id: string } | null;
      userErrors: UserError[];
    };
  }>(CREATE, { input });
  return data.customerCreate;
}

const messages = (errors: UserError[]) =>
  errors.map((e) => e.message).join("; ");

/** The number a customer already gets texts on, which keeps its step of the offer. */
const textsOn = (customer: Found): string | null =>
  customer.smsState === "SUBSCRIBED" ? customer.phone : null;

const onField = (errors: UserError[], field: string) =>
  errors.some((e) => e.field?.includes(field));

/**
 * Adds the number to a customer who signed up before, and subscribes it to
 * texts. A different number already on file is kept: it is theirs to change.
 */
async function addPhone(
  client: AdminClient,
  customer: Found,
  phone: string,
  consent: Consent,
): Promise<boolean> {
  if (customer.phone && customer.phone !== phone) return false;
  if (customer.phone) {
    if (customer.smsState === "SUBSCRIBED") return true;
    if (!RESUBSCRIBE.has(customer.smsState ?? "")) return false;
  } else {
    const set = await client.graphql<{
      customerUpdate: { userErrors: UserError[] };
    }>(PHONE, { input: { id: customer.id, phone } });
    // Another customer has this number, or Shopify will not take it: keep the email.
    if (set.customerUpdate.userErrors.length) return false;
  }
  const data = await client.graphql<{
    customerSmsMarketingConsentUpdate: { userErrors: UserError[] };
  }>(TEXTS, {
    input: { customerId: customer.id, smsMarketingConsent: consent },
  });
  return data.customerSmsMarketingConsentUpdate.userErrors.length === 0;
}

/**
 * Puts one sign-up into Shopify: finds or creates the customer, subscribes them
 * to email marketing (and texts, when they gave a number), then adds the tags.
 */
export async function recordSignup(
  client: AdminClient,
  signup: Signup,
  now: Date = new Date(),
): Promise<SignupResult> {
  const { email, source, phone = null, answers = {} } = signup;
  const consent: Consent = {
    marketingState: "SUBSCRIBED",
    marketingOptInLevel: "SINGLE_OPT_IN",
    consentUpdatedAt: now.toISOString(),
  };

  let customer = await find(client, email);
  const textedBefore = customer ? textsOn(customer) : null;
  let created = false;
  let texting = false;
  let subscribed = customer?.marketingState === "SUBSCRIBED";

  if (!customer) {
    const base = { email, emailMarketingConsent: consent };
    let made = await create(
      client,
      phone ? { ...base, phone, smsMarketingConsent: consent } : base,
    );
    if (made.customer) {
      texting = Boolean(phone);
    } else if (phone && onField(made.userErrors, "phone")) {
      // A number Shopify will not take, or one another customer has: keep the email.
      made = await create(client, base);
    }
    if (made.customer) {
      customer = {
        id: made.customer.id,
        marketingState: "SUBSCRIBED",
        phone: texting ? phone : null,
        smsState: texting ? "SUBSCRIBED" : null,
      };
      created = true;
      subscribed = true;
    } else {
      // Two sign-ups at once: the other request made the customer first.
      customer = await find(client, email);
      if (!customer) {
        if (onField(made.userErrors, "email")) {
          throw new SignupRejected(messages(made.userErrors));
        }
        throw new AdminError(`customerCreate: ${messages(made.userErrors)}`);
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

  if (phone && !created) {
    texting = await addPhone(client, customer, phone, consent);
  }

  const tagged = await client.graphql<{
    tagsAdd: { userErrors: UserError[] };
  }>(TAG, {
    id: customer.id,
    tags: signupTags({ source, answers, phone: phone ?? textedBefore }),
  });
  if (tagged.tagsAdd.userErrors.length) {
    throw new AdminError(`tagsAdd: ${messages(tagged.tagsAdd.userErrors)}`);
  }

  return { customerId: customer.id, created, subscribed, texting };
}

/** The source of a post that only adds answers for someone who joined before. */
export const PREFERENCES = "preferences";

/**
 * Adds the answers a member gave after joining, and the tag of the step those
 * answers have earned. Someone the store does not know is left alone: answers
 * on their own are not a sign-up, so no customer is created and nobody is
 * subscribed.
 */
export async function recordPreferences(
  client: AdminClient,
  email: string,
  answers: GiftAnswers,
): Promise<boolean> {
  const given = answerTags(answers);
  if (!given.length) return false;
  const customer = await find(client, email);
  if (!customer) return false;
  const step = offerTag({
    answers: given.length,
    phone: Boolean(textsOn(customer)),
  });
  const tagged = await client.graphql<{
    tagsAdd: { userErrors: UserError[] };
  }>(TAG, { id: customer.id, tags: [step, ...given] });
  if (tagged.tagsAdd.userErrors.length) {
    throw new AdminError(`tagsAdd: ${messages(tagged.tagsAdd.userErrors)}`);
  }
  return true;
}
