import { describe, expect, it } from "vitest";
import { checkApplication, type WholesaleApplication } from "@/data/wholesale";
import type { AdminClient } from "@/lib/shopify/admin";
import { recordWholesale, WholesaleRejected } from "./record-wholesale";

type Call = { op: string; variables: Record<string, unknown> };
type Script = Record<string, (variables: Record<string, unknown>) => unknown>;

function fakeAdmin(script: Script) {
  const calls: Call[] = [];
  const client: AdminClient = {
    async graphql<T>(query: string, variables: Record<string, unknown> = {}) {
      const op = query.match(/(?:query|mutation) (\w+)/)?.[1] ?? "?";
      calls.push({ op, variables });
      const answer = script[op];
      if (!answer) throw new Error(`unexpected ${op}`);
      return answer(variables) as T;
    },
  };
  return { client, calls, ops: () => calls.map((c) => c.op) };
}

const NOW = new Date("2026-11-13T09:00:00Z");

function application(
  extra: Record<string, unknown> = {},
): WholesaleApplication {
  const checked = checkApplication({
    business: "Salt & Stone",
    name: "Maya de la Cruz",
    email: "maya@saltstone.com",
    type: "gym",
    location: "Miami, FL",
    ...extra,
  });
  if (!checked.ok) throw new Error(checked.error);
  return checked.value;
}

const tagged = () => ({ tagsAdd: { userErrors: [] } });

describe("recordWholesale", () => {
  it("creates a customer with the application as its note, then tags it", async () => {
    const admin = fakeAdmin({
      WholesaleFind: () => ({ customerByIdentifier: null }),
      WholesaleCreate: () => ({
        customerCreate: {
          customer: { id: "gid://shopify/Customer/3" },
          userErrors: [],
        },
      }),
      WholesaleTag: tagged,
    });
    const result = await recordWholesale(admin.client, application(), NOW);
    expect(result).toEqual({
      customerId: "gid://shopify/Customer/3",
      created: true,
    });
    expect(admin.ops()).toEqual([
      "WholesaleFind",
      "WholesaleCreate",
      "WholesaleTag",
    ]);
    const input = (
      admin.calls[1].variables as { input: Record<string, unknown> }
    ).input;
    expect(input).toMatchObject({
      email: "maya@saltstone.com",
      firstName: "Maya",
      lastName: "de la Cruz",
    });
    expect(String(input.note)).toContain("Type: Gym or studio");
    expect(input).not.toHaveProperty("emailMarketingConsent");
    expect(input).not.toHaveProperty("phone");
    expect(admin.calls[2].variables.tags).toEqual([
      "site-wholesale",
      "wholesale-applicant",
      "wholesale-gym",
    ]);
  });

  it("subscribes a new applicant only when they ask for wholesale news", async () => {
    const admin = fakeAdmin({
      WholesaleFind: () => ({ customerByIdentifier: null }),
      WholesaleCreate: () => ({
        customerCreate: {
          customer: { id: "gid://shopify/Customer/3" },
          userErrors: [],
        },
      }),
      WholesaleTag: tagged,
    });
    await recordWholesale(admin.client, application({ updates: true }), NOW);
    expect(admin.calls[1].variables).toMatchObject({
      input: {
        emailMarketingConsent: {
          marketingState: "SUBSCRIBED",
          marketingOptInLevel: "SINGLE_OPT_IN",
        },
      },
    });
  });

  it("adds the application under a known customer's earlier note", async () => {
    const admin = fakeAdmin({
      WholesaleFind: () => ({
        customerByIdentifier: {
          id: "gid://shopify/Customer/7",
          note: "VIP from the launch party",
          defaultEmailAddress: { marketingState: "SUBSCRIBED" },
        },
      }),
      WholesaleNote: () => ({ customerUpdate: { userErrors: [] } }),
      WholesaleTag: tagged,
    });
    const result = await recordWholesale(admin.client, application(), NOW);
    expect(result.created).toBe(false);
    expect(admin.ops()).toEqual([
      "WholesaleFind",
      "WholesaleNote",
      "WholesaleTag",
    ]);
    const note = String(
      (admin.calls[1].variables as { input: { note: string } }).input.note,
    );
    expect(
      note.startsWith(
        "VIP from the launch party\n\nWholesale application, 2026-11-13",
      ),
    ).toBe(true);
  });

  it("reports an address Shopify will not take", async () => {
    const admin = fakeAdmin({
      WholesaleFind: () => ({ customerByIdentifier: null }),
      WholesaleCreate: () => ({
        customerCreate: {
          customer: null,
          userErrors: [{ field: ["email"], message: "Email is invalid" }],
        },
      }),
    });
    await expect(
      recordWholesale(admin.client, application(), NOW),
    ).rejects.toBeInstanceOf(WholesaleRejected);
  });

  it("fails when the note cannot be saved, so nothing is lost silently", async () => {
    const admin = fakeAdmin({
      WholesaleFind: () => ({
        customerByIdentifier: {
          id: "gid://shopify/Customer/7",
          note: null,
          defaultEmailAddress: null,
        },
      }),
      WholesaleNote: () => ({
        customerUpdate: {
          userErrors: [{ field: ["note"], message: "Note is too long" }],
        },
      }),
    });
    await expect(
      recordWholesale(admin.client, application(), NOW),
    ).rejects.toThrow("customerUpdate");
  });
});
