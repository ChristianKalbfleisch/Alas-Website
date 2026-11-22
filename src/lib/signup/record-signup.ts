import type { Offer } from "@/data/campaign";
import {
  answeredCount,
  answerTags,
  type GiftAnswers,
  offerTag,
  type Progress,
  stepsAt,
} from "@/data/gift";
import { type AdminClient, AdminError } from "@/lib/shopify/admin";

/**
 * Every form on the site is a sign-up for ALAS emails. The Ritual's buttons are
 * its waitlist and the Discovery Set's form is that set's waitlist. Every other
 * form joins the Founding Members, tagged with the offer in force when the
 * sign-up arrives and the percentage earned under it: the base for an email, a
 * step for each question answered and, while the offer has one, a last step
 * for a phone number. While a campaign runs the tags carry its name
 * (friday-5 to friday-25); from its last moment on they are the standing
 * offer's (founder-5 to founder-20), whatever the page that sent the sign-up
 * still showed.
 */
export type SignupPurpose =
  | "ritual-waitlist"
  | "discovery-waitlist"
  | `${string}-${number}`;

/** Added to every Founding Member sign-up; waitlists do not get it. */
export const FOUNDING_LEAD = "founding-member-lead";

const JOINED: Progress = { answers: 0, phone: false };

export function signupPurpose(
  source: string,
  offer: Offer,
  progress: Progress = JOINED,
): SignupPurpose {
  if (source === "club" || source.startsWith("ritual")) {
    return "ritual-waitlist";
  }
  if (source.startsWith("discover")) return "discovery-waitlist";
  return offerTag(offer, progress) as SignupPurpose;
}

/**
 * Tags written on the Shopify customer. Shopify Flow's "Customer tags added"
 * runs only for tags new to that customer, so signing up again adds nothing and
 * sends no second email, unless the member has since earned a higher step (more
 * answers, or a phone number), which adds that step's tag.
 */
export function signupTags(
  {
    source,
    answers = {},
    phone = null,
  }: Pick<Signup, "source" | "answers" | "phone">,
  offer: Offer,
): string[] {
  const purpose = signupPurpose(source, offer, {
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

/** A block for the customer's note, with the tags that go on with it. */
export type NoteEntry = {
  /**
   * What marks the block. A note that already holds it is left as it is, so
   * the same sign-up sent again is never written twice.
   */
  holds: (note: string | null) => boolean;
  text: string;
  /** More tags, added together with the sign-up's own. */
  tags: string[];
};

export type Signup = {
  email: string;
  source: string;
  /** E.164, given with consent to marketing texts; worth the offer's last step. */
  phone?: string | null;
  /** The answers to the questions; each one is worth a step. */
  answers?: GiftAnswers;
  /**
   * A block for the customer's note (a pre-order's lines and amounts), made
   * once the customer has been looked up, from what this sign-up has earned:
   * the answers sent, and a phone step only when a number came with it or the
   * store's record shows that the customer gets texts. The block goes under an
   * earlier note, which is never replaced, and it is written before the tags,
   * so whatever the tags set off can read it.
   */
  entry?: (earned: Progress) => NoteEntry;
  /**
   * A customer who had unsubscribed from email marketing stays unsubscribed.
   * For a form that is not a marketing sign-up first: a pre-order.
   */
  keepUnsubscribed?: boolean;
};

/** Shopify refused the address itself, so asking again will not help. */
export class SignupRejected extends Error {
  override name = "SignupRejected";
}

/** The customer's note has no room left for the block, so trying again will not help. */
export class NoteFull extends Error {
  override name = "NoteFull";
}

/** The most a customer's note is written to; a block that would pass it is refused. */
export const NOTE_MAX = 5000;

export type SignupResult = {
  customerId: string;
  created: boolean;
  /** False when Shopify kept an earlier state (a pending double opt-in, a bounced address). */
  subscribed: boolean;
  /** True when the phone number is on the customer and subscribed to texts. */
  texting: boolean;
  /** What the sign-up was recorded with: the answers sent, and the phone step when it is backed. */
  earned: Progress;
  /** True when the note already held this sign-up's block: it was sent before. */
  repeated: boolean;
};

type Found = {
  id: string;
  note: string | null;
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
    note
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

const NOTE = `mutation SignupNote($input: CustomerInput!) {
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

/**
 * States a fresh sign-up may move to subscribed; pending and invalid stay as
 * Shopify set them. A customer who never subscribed is named differently for
 * email (NOT_SUBSCRIBED) and for texts (NEVER_SUBSCRIBED, in the consent this
 * code reads; NOT_SUBSCRIBED is the name the older field gives the same state).
 */
const EMAIL_RESUBSCRIBE = new Set(["NOT_SUBSCRIBED", "UNSUBSCRIBED"]);
const TEXTS_RESUBSCRIBE = new Set([
  "NEVER_SUBSCRIBED",
  "NOT_SUBSCRIBED",
  "UNSUBSCRIBED",
]);

async function find(client: AdminClient, email: string): Promise<Found | null> {
  const data = await client.graphql<{
    customerByIdentifier: {
      id: string;
      note?: string | null;
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
    note: customer.note ?? null,
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

/** Shopify's own refusal of a note that has grown past what it keeps. */
const tooLong = (errors: UserError[]) =>
  errors.some((e) => e.field?.includes("note") || /too long/i.test(e.message));

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
    if (!TEXTS_RESUBSCRIBE.has(customer.smsState ?? "")) return false;
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

/** A note with one more block under what it holds; refused when it would be too long. */
function extended(held: string | null, block: string): string {
  const note = held ? `${held}\n\n${block}` : block;
  if (note.length > NOTE_MAX) throw new NoteFull("the note has no room left");
  return note;
}

/**
 * Puts one sign-up into Shopify: finds or creates the customer, subscribes them
 * to email marketing (and texts, when they gave a number), writes the note when
 * the sign-up carries one, then adds the tags. The step's tag is the one of the
 * offer in force at `now`. Sending the same sign-up again is safe: a note block
 * that is already there is not written twice, and tags are only ever added.
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
  const earned: Progress = {
    answers: answeredCount(answers),
    phone: Boolean(phone ?? textedBefore),
  };
  const entry = signup.entry?.(earned);
  let repeated = false;
  let created = false;
  let texting = false;
  let subscribed = customer?.marketingState === "SUBSCRIBED";

  if (!customer) {
    const base = {
      email,
      emailMarketingConsent: consent,
      ...(entry ? { note: extended(null, entry.text) } : {}),
    };
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
        note: entry?.text ?? null,
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

  const state = customer.marketingState ?? "";
  if (
    !subscribed &&
    EMAIL_RESUBSCRIBE.has(state) &&
    !(signup.keepUnsubscribed && state === "UNSUBSCRIBED")
  ) {
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

  if (entry && !created) {
    if (entry.holds(customer.note)) {
      // Sent before, and the note was written then: only the tags are left.
      repeated = true;
    } else {
      const noted = await client.graphql<{
        customerUpdate: { userErrors: UserError[] };
      }>(NOTE, {
        input: { id: customer.id, note: extended(customer.note, entry.text) },
      });
      const errors = noted.customerUpdate.userErrors;
      if (tooLong(errors)) throw new NoteFull(messages(errors));
      if (errors.length) {
        throw new AdminError(`customerUpdate: ${messages(errors)}`);
      }
    }
  }

  const tagged = await client.graphql<{
    tagsAdd: { userErrors: UserError[] };
  }>(TAG, {
    id: customer.id,
    tags: [
      ...signupTags(
        { source, answers, phone: phone ?? textedBefore },
        stepsAt(now.getTime()),
      ),
      ...(entry?.tags ?? []),
    ],
  });
  if (tagged.tagsAdd.userErrors.length) {
    throw new AdminError(`tagsAdd: ${messages(tagged.tagsAdd.userErrors)}`);
  }

  return {
    customerId: customer.id,
    created,
    subscribed,
    texting,
    earned,
    repeated,
  };
}

/** The source of a post that only adds answers for someone who joined before. */
export const PREFERENCES = "preferences";

/**
 * Adds the answers a member gave after joining, and the tag of the step those
 * answers have earned under the offer in force at `now`. Someone the store
 * does not know is left alone: answers on their own are not a sign-up, so no
 * customer is created and nobody is subscribed.
 */
export async function recordPreferences(
  client: AdminClient,
  email: string,
  answers: GiftAnswers,
  now: Date = new Date(),
): Promise<boolean> {
  const given = answerTags(answers);
  if (!given.length) return false;
  const customer = await find(client, email);
  if (!customer) return false;
  const step = offerTag(stepsAt(now.getTime()), {
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
