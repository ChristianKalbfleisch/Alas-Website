import { describe, expect, it } from "vitest";
import type { AdminClient } from "@/lib/shopify/admin";
import {
  recordSignup,
  SignupRejected,
  signupPurpose,
  signupTags,
} from "./record-signup";

type Call = { op: string; variables: Record<string, unknown> };
type Script = Record<string, (variables: Record<string, unknown>) => unknown>;

/** A pretend Admin API: answers by operation name and records every call. */
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

const NOW = new Date("2026-10-26T12:00:00Z");
const CONSENT = {
  marketingState: "SUBSCRIBED",
  marketingOptInLevel: "SINGLE_OPT_IN",
  consentUpdatedAt: "2026-10-26T12:00:00.000Z",
};
const tagged = () => ({ tagsAdd: { userErrors: [] } });
const existing = (marketingState: string) => () => ({
  customerByIdentifier: {
    id: "gid://shopify/Customer/7",
    defaultEmailAddress: { marketingState },
  },
});

describe("signupTags", () => {
  it("marks The Ritual's forms as its waitlist and the rest as the welcome offer", () => {
    expect(signupPurpose("ritual-shop")).toBe("ritual-waitlist");
    expect(signupPurpose("club")).toBe("ritual-waitlist");
    expect(signupPurpose("footer")).toBe("welcome-10");
    expect(signupPurpose("quiz")).toBe("welcome-10");
    expect(signupTags("ritual-cart")).toEqual([
      "site-signup",
      "site-ritual-cart",
      "ritual-waitlist",
    ]);
  });
});

describe("recordSignup", () => {
  it("creates a new customer subscribed, then tags them", async () => {
    const admin = fakeAdmin({
      SignupFind: () => ({ customerByIdentifier: null }),
      SignupCreate: () => ({
        customerCreate: {
          customer: { id: "gid://shopify/Customer/1" },
          userErrors: [],
        },
      }),
      SignupTag: tagged,
    });

    const result = await recordSignup(
      admin.client,
      "ana@gmail.com",
      "footer",
      NOW,
    );

    expect(result).toEqual({
      customerId: "gid://shopify/Customer/1",
      created: true,
      subscribed: true,
    });
    expect(admin.ops()).toEqual(["SignupFind", "SignupCreate", "SignupTag"]);
    expect(admin.calls[1].variables).toEqual({
      input: { email: "ana@gmail.com", emailMarketingConsent: CONSENT },
    });
    expect(admin.calls[2].variables).toEqual({
      id: "gid://shopify/Customer/1",
      tags: ["site-signup", "site-footer", "welcome-10"],
    });
  });

  it("only adds tags for a customer who is already subscribed", async () => {
    const admin = fakeAdmin({
      SignupFind: existing("SUBSCRIBED"),
      SignupTag: tagged,
    });
    const result = await recordSignup(
      admin.client,
      "ana@gmail.com",
      "club",
      NOW,
    );
    expect(admin.ops()).toEqual(["SignupFind", "SignupTag"]);
    expect(result).toMatchObject({ created: false, subscribed: true });
  });

  it("subscribes an existing customer who had unsubscribed", async () => {
    const admin = fakeAdmin({
      SignupFind: existing("UNSUBSCRIBED"),
      SignupConsent: () => ({
        customerEmailMarketingConsentUpdate: { userErrors: [] },
      }),
      SignupTag: tagged,
    });
    const result = await recordSignup(
      admin.client,
      "ana@gmail.com",
      "quiz",
      NOW,
    );
    expect(admin.ops()).toEqual(["SignupFind", "SignupConsent", "SignupTag"]);
    expect(admin.calls[1].variables).toEqual({
      input: {
        customerId: "gid://shopify/Customer/7",
        emailMarketingConsent: CONSENT,
      },
    });
    expect(result.subscribed).toBe(true);
  });

  it("leaves a pending double opt-in alone but still tags", async () => {
    const admin = fakeAdmin({
      SignupFind: existing("PENDING"),
      SignupTag: tagged,
    });
    const result = await recordSignup(
      admin.client,
      "ana@gmail.com",
      "footer",
      NOW,
    );
    expect(admin.ops()).toEqual(["SignupFind", "SignupTag"]);
    expect(result.subscribed).toBe(false);
  });

  it("recovers when another request created the customer first", async () => {
    let finds = 0;
    const admin = fakeAdmin({
      SignupFind: () =>
        ++finds === 1
          ? { customerByIdentifier: null }
          : existing("SUBSCRIBED")(),
      SignupCreate: () => ({
        customerCreate: {
          customer: null,
          userErrors: [
            { field: ["email"], message: "Email has already been taken" },
          ],
        },
      }),
      SignupTag: tagged,
    });
    const result = await recordSignup(
      admin.client,
      "ana@gmail.com",
      "footer",
      NOW,
    );
    expect(admin.ops()).toEqual([
      "SignupFind",
      "SignupCreate",
      "SignupFind",
      "SignupTag",
    ]);
    expect(result).toMatchObject({
      customerId: "gid://shopify/Customer/7",
      created: false,
    });
  });

  it("reports an address Shopify will not take", async () => {
    const admin = fakeAdmin({
      SignupFind: () => ({ customerByIdentifier: null }),
      SignupCreate: () => ({
        customerCreate: {
          customer: null,
          userErrors: [{ field: ["email"], message: "Email is invalid" }],
        },
      }),
    });
    await expect(
      recordSignup(admin.client, "ana@example.invalid", "footer", NOW),
    ).rejects.toBeInstanceOf(SignupRejected);
  });

  it("fails when the tags cannot be written, so the visitor can retry", async () => {
    const admin = fakeAdmin({
      SignupFind: existing("SUBSCRIBED"),
      SignupTag: () => ({
        tagsAdd: {
          userErrors: [{ field: ["tags"], message: "Too many tags" }],
        },
      }),
    });
    await expect(
      recordSignup(admin.client, "ana@gmail.com", "footer", NOW),
    ).rejects.toThrow("tagsAdd");
  });
});
