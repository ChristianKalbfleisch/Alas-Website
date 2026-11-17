import { describe, expect, it } from "vitest";
import { offerTag } from "@/data/gift";
import type { AdminClient } from "@/lib/shopify/admin";
import {
  recordPreferences,
  recordSignup,
  SignupRejected,
  signupPurpose,
  signupTags,
} from "./record-signup";

/** The step for an email alone, and the same with a phone number. */
const EMAIL_TAG = offerTag({ answers: 0, phone: false });
const PHONE_TAG = offerTag({ answers: 0, phone: true });
const step = (answers: number, phone = false) => offerTag({ answers, phone });

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
const PHONE = "+15125550147";
const tagged = () => ({ tagsAdd: { userErrors: [] } });
const fine = { userErrors: [] };
const made =
  (id = "gid://shopify/Customer/1") =>
  () => ({
    customerCreate: { customer: { id }, userErrors: [] },
  });
const existing =
  (marketingState: string, phone?: { number: string; state: string }) =>
  () => ({
    customerByIdentifier: {
      id: "gid://shopify/Customer/7",
      defaultEmailAddress: { marketingState },
      defaultPhoneNumber: phone
        ? {
            phoneNumber: phone.number,
            smsMarketingConsent: { state: phone.state },
          }
        : null,
    },
  });
const nobody = () => ({ customerByIdentifier: null });

describe("signupTags", () => {
  it("marks The Ritual's forms as its waitlist and the rest as Founding Members", () => {
    expect(signupPurpose("ritual-shop")).toBe("ritual-waitlist");
    expect(signupPurpose("club")).toBe("ritual-waitlist");
    expect(signupPurpose("discover-shop")).toBe("discover-waitlist");
    expect(signupPurpose("footer")).toBe(EMAIL_TAG);
    expect(signupPurpose("quiz")).toBe(EMAIL_TAG);
    expect(signupTags({ source: "ritual-cart" })).toEqual([
      "site-signup",
      "site-ritual-cart",
      "ritual-waitlist",
    ]);
    expect(signupTags({ source: "discover-shop", phone: PHONE })).toEqual([
      "site-signup",
      "site-discover-shop",
      "discover-waitlist",
    ]);
  });

  it("climbs a step for each answer and a last one for a phone number", () => {
    expect(signupPurpose("gift", { answers: 0, phone: true })).toBe(PHONE_TAG);
    expect(signupPurpose("gift", { answers: 2, phone: false })).toBe(step(2));
    expect(signupTags({ source: "footer" })).toEqual([
      "site-signup",
      "site-footer",
      EMAIL_TAG,
      "founding-member-lead",
    ]);
    expect(
      signupTags({
        source: "popup",
        phone: PHONE,
        answers: { goal: "hydration", flavour: "lemon", learn: "rituals" },
      }),
    ).toEqual([
      "site-signup",
      "site-popup",
      step(3, true),
      "founding-member-lead",
      "pref-goal-hydration",
      "pref-flavour-lemon",
      "pref-learn-rituals",
    ]);
    expect(
      signupTags({ source: "gift", answers: { goal: "training" } }),
    ).toEqual([
      "site-signup",
      "site-gift",
      step(1),
      "founding-member-lead",
      "pref-goal-training",
    ]);
    expect(
      signupTags({ source: "gift", answers: { goal: "training", learn: "x" } }),
    ).toContain(step(1));
  });
});

describe("recordSignup", () => {
  it("creates a new customer subscribed, then tags them", async () => {
    const admin = fakeAdmin({
      SignupFind: nobody,
      SignupCreate: made(),
      SignupTag: tagged,
    });

    const result = await recordSignup(
      admin.client,
      { email: "ana@gmail.com", source: "footer" },
      NOW,
    );

    expect(result).toEqual({
      customerId: "gid://shopify/Customer/1",
      created: true,
      subscribed: true,
      texting: false,
    });
    expect(admin.ops()).toEqual(["SignupFind", "SignupCreate", "SignupTag"]);
    expect(admin.calls[1].variables).toEqual({
      input: { email: "ana@gmail.com", emailMarketingConsent: CONSENT },
    });
    expect(admin.calls[2].variables).toEqual({
      id: "gid://shopify/Customer/1",
      tags: ["site-signup", "site-footer", EMAIL_TAG, "founding-member-lead"],
    });
  });

  it("subscribes a new customer's number to texts as well", async () => {
    const admin = fakeAdmin({
      SignupFind: nobody,
      SignupCreate: made(),
      SignupTag: tagged,
    });
    const result = await recordSignup(
      admin.client,
      { email: "ana@gmail.com", source: "gift", phone: PHONE },
      NOW,
    );
    expect(admin.calls[1].variables).toEqual({
      input: {
        email: "ana@gmail.com",
        emailMarketingConsent: CONSENT,
        phone: PHONE,
        smsMarketingConsent: CONSENT,
      },
    });
    expect(admin.calls[2].variables.tags).toEqual([
      "site-signup",
      "site-gift",
      PHONE_TAG,
      "founding-member-lead",
    ]);
    expect(result.texting).toBe(true);
  });

  it("keeps the email when Shopify will not take the number", async () => {
    let creates = 0;
    const admin = fakeAdmin({
      SignupFind: nobody,
      SignupCreate: () =>
        ++creates === 1
          ? {
              customerCreate: {
                customer: null,
                userErrors: [
                  { field: ["phone"], message: "Phone has already been taken" },
                ],
              },
            }
          : made()(),
      SignupTag: tagged,
    });
    const result = await recordSignup(
      admin.client,
      { email: "ana@gmail.com", source: "gift", phone: PHONE },
      NOW,
    );
    expect(admin.ops()).toEqual([
      "SignupFind",
      "SignupCreate",
      "SignupCreate",
      "SignupTag",
    ]);
    expect(admin.calls[2].variables).toEqual({
      input: { email: "ana@gmail.com", emailMarketingConsent: CONSENT },
    });
    expect(result).toMatchObject({ created: true, texting: false });
    // The visitor gave a real number and was shown the higher code: the tag agrees.
    expect(admin.calls[3].variables.tags).toContain(PHONE_TAG);
  });

  it("adds a number to a customer who had none and subscribes it to texts", async () => {
    const admin = fakeAdmin({
      SignupFind: existing("SUBSCRIBED"),
      SignupPhone: () => ({ customerUpdate: fine }),
      SignupTexts: () => ({ customerSmsMarketingConsentUpdate: fine }),
      SignupTag: tagged,
    });
    const result = await recordSignup(
      admin.client,
      { email: "ana@gmail.com", source: "gift", phone: PHONE },
      NOW,
    );
    expect(admin.ops()).toEqual([
      "SignupFind",
      "SignupPhone",
      "SignupTexts",
      "SignupTag",
    ]);
    expect(admin.calls[1].variables).toEqual({
      input: { id: "gid://shopify/Customer/7", phone: PHONE },
    });
    expect(admin.calls[2].variables).toEqual({
      input: {
        customerId: "gid://shopify/Customer/7",
        smsMarketingConsent: CONSENT,
      },
    });
    // A member who joined with an email moves up a step.
    expect(admin.calls[3].variables.tags).toEqual([
      "site-signup",
      "site-gift",
      PHONE_TAG,
      "founding-member-lead",
    ]);
    expect(result.texting).toBe(true);
  });

  it("resubscribes the same number to texts", async () => {
    const admin = fakeAdmin({
      SignupFind: existing("SUBSCRIBED", {
        number: PHONE,
        state: "UNSUBSCRIBED",
      }),
      SignupTexts: () => ({ customerSmsMarketingConsentUpdate: fine }),
      SignupTag: tagged,
    });
    const result = await recordSignup(
      admin.client,
      { email: "ana@gmail.com", source: "gift", phone: PHONE },
      NOW,
    );
    expect(admin.ops()).toEqual(["SignupFind", "SignupTexts", "SignupTag"]);
    expect(result.texting).toBe(true);
  });

  it("keeps a different number already on file", async () => {
    const admin = fakeAdmin({
      SignupFind: existing("SUBSCRIBED", {
        number: "+14165550199",
        state: "SUBSCRIBED",
      }),
      SignupTag: tagged,
    });
    const result = await recordSignup(
      admin.client,
      { email: "ana@gmail.com", source: "gift", phone: PHONE },
      NOW,
    );
    expect(admin.ops()).toEqual(["SignupFind", "SignupTag"]);
    expect(result.texting).toBe(false);
  });

  it("still signs up the email when the number belongs to someone else", async () => {
    const admin = fakeAdmin({
      SignupFind: existing("SUBSCRIBED"),
      SignupPhone: () => ({
        customerUpdate: {
          userErrors: [
            { field: ["phone"], message: "Phone has already been taken" },
          ],
        },
      }),
      SignupTag: tagged,
    });
    const result = await recordSignup(
      admin.client,
      { email: "ana@gmail.com", source: "gift", phone: PHONE },
      NOW,
    );
    expect(admin.ops()).toEqual(["SignupFind", "SignupPhone", "SignupTag"]);
    expect(result).toMatchObject({ subscribed: true, texting: false });
  });

  it("only adds tags for a customer who is already subscribed", async () => {
    const admin = fakeAdmin({
      SignupFind: existing("SUBSCRIBED"),
      SignupTag: tagged,
    });
    const result = await recordSignup(
      admin.client,
      { email: "ana@gmail.com", source: "club" },
      NOW,
    );
    expect(admin.ops()).toEqual(["SignupFind", "SignupTag"]);
    expect(result).toMatchObject({ created: false, subscribed: true });
  });

  it("subscribes an existing customer who had unsubscribed", async () => {
    const admin = fakeAdmin({
      SignupFind: existing("UNSUBSCRIBED"),
      SignupConsent: () => ({ customerEmailMarketingConsentUpdate: fine }),
      SignupTag: tagged,
    });
    const result = await recordSignup(
      admin.client,
      { email: "ana@gmail.com", source: "quiz" },
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
      { email: "ana@gmail.com", source: "footer" },
      NOW,
    );
    expect(admin.ops()).toEqual(["SignupFind", "SignupTag"]);
    expect(result.subscribed).toBe(false);
  });

  it("recovers when another request created the customer first", async () => {
    let finds = 0;
    const admin = fakeAdmin({
      SignupFind: () => (++finds === 1 ? nobody() : existing("SUBSCRIBED")()),
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
      { email: "ana@gmail.com", source: "footer" },
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
      SignupFind: nobody,
      SignupCreate: () => ({
        customerCreate: {
          customer: null,
          userErrors: [{ field: ["email"], message: "Email is invalid" }],
        },
      }),
    });
    await expect(
      recordSignup(
        admin.client,
        { email: "ana@example.invalid", source: "footer" },
        NOW,
      ),
    ).rejects.toBeInstanceOf(SignupRejected);
  });

  it("keeps the phone step for a member who already gets texts and signs up again", async () => {
    const admin = fakeAdmin({
      SignupFind: existing("SUBSCRIBED", {
        number: PHONE,
        state: "SUBSCRIBED",
      }),
      SignupTag: tagged,
    });
    await recordSignup(
      admin.client,
      {
        email: "ana@gmail.com",
        source: "footer",
        answers: { goal: "ritual", flavour: "both" },
      },
      NOW,
    );
    expect(admin.ops()).toEqual(["SignupFind", "SignupTag"]);
    expect(admin.calls[1].variables.tags).toEqual([
      "site-signup",
      "site-footer",
      step(2, true),
      "founding-member-lead",
      "pref-goal-ritual",
      "pref-flavour-both",
    ]);
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
      recordSignup(
        admin.client,
        { email: "ana@gmail.com", source: "footer" },
        NOW,
      ),
    ).rejects.toThrow("tagsAdd");
  });
});

describe("recordPreferences", () => {
  it("adds the answers and the step they earn to a customer who has joined", async () => {
    const { client, calls, ops } = fakeAdmin({
      SignupFind: existing("SUBSCRIBED"),
      SignupTag: tagged,
    });
    const done = await recordPreferences(client, "ana@example.com", {
      goal: "training",
      flavour: "lemon",
    });
    expect(done).toBe(true);
    expect(ops()).toEqual(["SignupFind", "SignupTag"]);
    expect(calls[1].variables.tags).toEqual([
      step(2),
      "pref-goal-training",
      "pref-flavour-lemon",
    ]);
  });

  it("keeps the phone step for a member who already gets texts", async () => {
    const { client, calls } = fakeAdmin({
      SignupFind: existing("SUBSCRIBED", {
        number: PHONE,
        state: "SUBSCRIBED",
      }),
      SignupTag: tagged,
    });
    await recordPreferences(client, "ana@example.com", {
      goal: "training",
      flavour: "lemon",
      learn: "offers",
    });
    expect(calls[1].variables.tags).toContain(step(3, true));
  });

  it("does not count a number that has left the texts", async () => {
    const { client, calls } = fakeAdmin({
      SignupFind: existing("SUBSCRIBED", {
        number: PHONE,
        state: "UNSUBSCRIBED",
      }),
      SignupTag: tagged,
    });
    await recordPreferences(client, "ana@example.com", { goal: "training" });
    expect(calls[1].variables.tags).toContain(step(1));
  });

  it("never creates or subscribes someone the store does not know", async () => {
    const { client, ops } = fakeAdmin({ SignupFind: nobody });
    expect(
      await recordPreferences(client, "new@example.com", { goal: "ritual" }),
    ).toBe(false);
    expect(ops()).toEqual(["SignupFind"]);
  });

  it("does nothing without a real answer", async () => {
    const { client, ops } = fakeAdmin({});
    expect(await recordPreferences(client, "ana@example.com", {})).toBe(false);
    expect(ops()).toEqual([]);
  });
});
