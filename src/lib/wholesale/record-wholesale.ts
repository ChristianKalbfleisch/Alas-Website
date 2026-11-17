import {
  applicationNote,
  type WholesaleApplication,
  wholesaleTags,
} from "@/data/wholesale";
import { type AdminClient, AdminError } from "@/lib/shopify/admin";

/** Shopify refused the address itself, so asking again will not help. */
export class WholesaleRejected extends Error {
  override name = "WholesaleRejected";
}

type UserError = { field?: string[] | null; message: string };
type Found = { id: string; note: string | null; marketingState: string | null };

const FIND = `query WholesaleFind($email: String!) {
  customerByIdentifier(identifier: { emailAddress: $email }) {
    id
    note
    defaultEmailAddress { marketingState }
  }
}`;

const CREATE = `mutation WholesaleCreate($input: CustomerInput!) {
  customerCreate(input: $input) {
    customer { id }
    userErrors { field message }
  }
}`;

const NOTE = `mutation WholesaleNote($input: CustomerInput!) {
  customerUpdate(input: $input) {
    userErrors { field message }
  }
}`;

const CONSENT = `mutation WholesaleConsent($input: CustomerEmailMarketingConsentUpdateInput!) {
  customerEmailMarketingConsentUpdate(input: $input) {
    userErrors { field message code }
  }
}`;

const TAG = `mutation WholesaleTag($id: ID!, $tags: [String!]!) {
  tagsAdd(id: $id, tags: $tags) {
    userErrors { field message }
  }
}`;

const RESUBSCRIBE = new Set(["NOT_SUBSCRIBED", "UNSUBSCRIBED"]);

const messages = (errors: UserError[]) =>
  errors.map((e) => e.message).join("; ");

async function find(client: AdminClient, email: string): Promise<Found | null> {
  const data = await client.graphql<{
    customerByIdentifier: {
      id: string;
      note: string | null;
      defaultEmailAddress: { marketingState: string } | null;
    } | null;
  }>(FIND, { email });
  const customer = data.customerByIdentifier;
  if (!customer) return null;
  return {
    id: customer.id,
    note: customer.note,
    marketingState: customer.defaultEmailAddress?.marketingState ?? null,
  };
}

function splitName(name: string) {
  const [first, ...rest] = name.split(" ");
  return { firstName: first, lastName: rest.join(" ") || undefined };
}

/**
 * Files one wholesale application in Shopify: a new customer carries it as its
 * note; a customer already on file gets it added under their earlier note,
 * which is never replaced. The phone number lives in the note only, so it never
 * signs anyone up for texts. Then the wholesale tags go on, and Flow emails the team.
 */
export async function recordWholesale(
  client: AdminClient,
  app: WholesaleApplication,
  now: Date = new Date(),
): Promise<{ customerId: string; created: boolean }> {
  const note = applicationNote(app, now);
  const consent = {
    marketingState: "SUBSCRIBED",
    marketingOptInLevel: "SINGLE_OPT_IN",
    consentUpdatedAt: now.toISOString(),
  };

  let customer = await find(client, app.email);
  let created = false;

  if (!customer) {
    const data = await client.graphql<{
      customerCreate: {
        customer: { id: string } | null;
        userErrors: UserError[];
      };
    }>(CREATE, {
      input: {
        email: app.email,
        ...splitName(app.name),
        note,
        ...(app.updates ? { emailMarketingConsent: consent } : {}),
      },
    });
    const { customer: made, userErrors } = data.customerCreate;
    if (made) {
      customer = { id: made.id, note, marketingState: null };
      created = true;
    } else {
      // Two submissions at once: the other request made the customer first.
      customer = await find(client, app.email);
      if (!customer) {
        if (userErrors.some((e) => e.field?.includes("email"))) {
          throw new WholesaleRejected(messages(userErrors));
        }
        throw new AdminError(`customerCreate: ${messages(userErrors)}`);
      }
    }
  }

  if (!created) {
    const updated = await client.graphql<{
      customerUpdate: { userErrors: UserError[] };
    }>(NOTE, {
      input: {
        id: customer.id,
        note: customer.note ? `${customer.note}\n\n${note}` : note,
      },
    });
    if (updated.customerUpdate.userErrors.length) {
      throw new AdminError(
        `customerUpdate: ${messages(updated.customerUpdate.userErrors)}`,
      );
    }
    if (app.updates && RESUBSCRIBE.has(customer.marketingState ?? "")) {
      await client.graphql(CONSENT, {
        input: { customerId: customer.id, emailMarketingConsent: consent },
      });
    }
  }

  const tagged = await client.graphql<{
    tagsAdd: { userErrors: UserError[] };
  }>(TAG, { id: customer.id, tags: wholesaleTags(app) });
  if (tagged.tagsAdd.userErrors.length) {
    throw new AdminError(`tagsAdd: ${messages(tagged.tagsAdd.userErrors)}`);
  }

  return { customerId: customer.id, created };
}
