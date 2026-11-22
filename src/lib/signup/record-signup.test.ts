import { describe, expect, it } from "vitest";
import { BLACK_FRIDAY } from "@/data/campaign";
import { offerTag, stepsAt } from "@/data/gift";
import type { AdminClient } from "@/lib/shopify/admin";
import {
  NOTE_MAX,
  NoteFull,
  recordPreferences,
  recordSignup,
  type Signup,
  SignupRejected,
  signupPurpose,
  signupTags,
} from "./record-signup";

/** A moment while the campaign runs, and the offer in force then. */
const NOW = new Date("2026-10-26T12:00:00Z");
const OFFER = stepsAt(NOW.getTime());
/** One second and one day after the campaign's last moment. */
const END = Date.parse(BLACK_FRIDAY.ends);
const JUST_AFTER = new Date(END + 1000);
const A_DAY_AFTER = new Date(END + 86_400_000);

/** The step for an email alone, and the same with a phone number. */
const EMAIL_TAG = offerTag(OFFER, { answers: 0, phone: false });
const PHONE_TAG = offerTag(OFFER, { answers: 0, phone: true });
const step = (answers: number, phone = false) =>
  offerTag(OFFER, { answers, phone });

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
    expect(signupPurpose("ritual-shop", OFFER)).toBe("ritual-waitlist");
    expect(signupPurpose("club", OFFER)).toBe("ritual-waitlist");
    expect(signupPurpose("discover-shop", OFFER)).toBe("discovery-waitlist");
    expect(signupPurpose("footer", OFFER)).toBe(EMAIL_TAG);
    expect(signupPurpose("quiz", OFFER)).toBe(EMAIL_TAG);
    expect(signupTags({ source: "ritual-cart" }, OFFER)).toEqual([
      "site-signup",
      "site-ritual-cart",
      "ritual-waitlist",
    ]);
    expect(
      signupTags({ source: "discover-shop", phone: PHONE }, OFFER),
    ).toEqual(["site-signup", "site-discover-shop", "discovery-waitlist"]);
  });

  it("counts a pre-order placed by email as a Founding Member", () => {
    expect(signupTags({ source: "preorder" }, OFFER)).toEqual([
      "site-signup",
      "site-preorder",
      EMAIL_TAG,
      "founding-member-lead",
    ]);
  });

  it("climbs a step for each answer and a last one for a phone number", () => {
    expect(signupPurpose("gift", OFFER, { answers: 0, phone: true })).toBe(
      PHONE_TAG,
    );
    expect(signupPurpose("gift", OFFER, { answers: 2, phone: false })).toBe(
      step(2),
    );
    expect(signupTags({ source: "footer" }, OFFER)).toEqual([
      "site-signup",
      "site-footer",
      EMAIL_TAG,
      "founding-member-lead",
    ]);
    expect(
      signupTags(
        {
          source: "popup",
          phone: PHONE,
          answers: { goal: "hydration", flavour: "lemon", learn: "rituals" },
        },
        OFFER,
      ),
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
      signupTags({ source: "gift", answers: { goal: "training" } }, OFFER),
    ).toEqual([
      "site-signup",
      "site-gift",
      step(1),
      "founding-member-lead",
      "pref-goal-training",
    ]);
    expect(
      signupTags(
        { source: "gift", answers: { goal: "training", learn: "x" } },
        OFFER,
      ),
    ).toContain(step(1));
  });

  it("carries the campaign's name while it runs and the standing offer's after it", () => {
    const all = {
      source: "popup",
      phone: PHONE,
      answers: { goal: "hydration", flavour: "lemon", learn: "rituals" },
    };
    expect(OFFER.campaign).toBe(BLACK_FRIDAY);
    expect(signupTags(all, stepsAt(END))).toContain("friday-25");
    for (const later of [JUST_AFTER, A_DAY_AFTER]) {
      const tags = signupTags(all, stepsAt(later.getTime()));
      // The phone number is no longer a step: three answers are the top.
      expect(tags).toContain("founder-20");
      expect(tags.join(" ")).not.toMatch(/friday|-25/);
    }
    expect(
      signupTags({ source: "footer" }, stepsAt(JUST_AFTER.getTime())),
    ).toEqual([
      "site-signup",
      "site-footer",
      "founder-5",
      "founding-member-lead",
    ]);
  });
});

describe("a sign-up that carries a note and more tags", () => {
  const NOTE = "Pre-order by email, ref k7q2mxd9, 2026-10-26\nOne line";
  const MORE = ["site-preorder-lemon-pouch", "site-preorder-ref-k7q2mxd9"];
  const seen: { answers: number; phone: boolean }[] = [];
  const signup: Signup = {
    email: "ana@gmail.com",
    source: "preorder",
    entry: (earned) => {
      seen.push(earned);
      return {
        holds: (note) => Boolean(note?.includes("ref k7q2mxd9")),
        text: NOTE,
        tags: MORE,
      };
    },
  };
  const onFile =
    (note: string | null, marketingState = "SUBSCRIBED") =>
    () => ({
      customerByIdentifier: {
        id: "gid://shopify/Customer/7",
        note,
        defaultEmailAddress: { marketingState },
        defaultPhoneNumber: null,
      },
    });

  it("gives a new customer the note as they are created, then every tag at once", async () => {
    const admin = fakeAdmin({
      SignupFind: nobody,
      SignupCreate: made(),
      SignupTag: tagged,
    });
    const result = await recordSignup(admin.client, signup, NOW);
    expect(admin.ops()).toEqual(["SignupFind", "SignupCreate", "SignupTag"]);
    expect(admin.calls[1].variables).toEqual({
      input: {
        email: "ana@gmail.com",
        emailMarketingConsent: CONSENT,
        note: NOTE,
      },
    });
    expect(admin.calls[2].variables.tags).toEqual([
      "site-signup",
      "site-preorder",
      EMAIL_TAG,
      "founding-member-lead",
      ...MORE,
    ]);
    expect(result.repeated).toBe(false);
  });

  it("writes the note of a customer on file before the tags go on", async () => {
    const admin = fakeAdmin({
      SignupFind: existing("SUBSCRIBED"),
      SignupNote: () => ({ customerUpdate: fine }),
      SignupTag: tagged,
    });
    await recordSignup(admin.client, signup, NOW);
    expect(admin.ops()).toEqual(["SignupFind", "SignupNote", "SignupTag"]);
    expect(admin.calls[1].variables).toEqual({
      input: { id: "gid://shopify/Customer/7", note: NOTE },
    });
    expect(admin.calls[2].variables.tags).toEqual(
      expect.arrayContaining(["site-preorder", ...MORE]),
    );
  });

  it("adds the note under an earlier one, which is never replaced", async () => {
    const admin = fakeAdmin({
      SignupFind: onFile("Asked about gift wrapping."),
      SignupNote: () => ({ customerUpdate: fine }),
      SignupTag: tagged,
    });
    await recordSignup(admin.client, signup, NOW);
    expect(admin.calls[1].variables).toEqual({
      input: {
        id: "gid://shopify/Customer/7",
        note: `Asked about gift wrapping.\n\n${NOTE}`,
      },
    });
  });

  it("leaves a note that already holds the block as it is, and still adds the tags", async () => {
    const admin = fakeAdmin({
      SignupFind: onFile(`Asked about gift wrapping.\n\n${NOTE}`),
      SignupTag: tagged,
    });
    const result = await recordSignup(admin.client, signup, NOW);
    expect(admin.ops()).toEqual(["SignupFind", "SignupTag"]);
    expect(admin.calls[1].variables.tags).toEqual(
      expect.arrayContaining(["site-preorder", ...MORE]),
    );
    expect(result.repeated).toBe(true);
  });

  it("writes one block when the tags failed the first time and the sign-up is sent again", async () => {
    // A pretend store that keeps what it is given, and fails the first tag call.
    let note: string | null = null;
    const tags = new Set<string>();
    let tagCalls = 0;
    const admin = fakeAdmin({
      SignupFind: () => onFile(note)(),
      SignupNote: (variables) => {
        note = (variables.input as { note: string }).note;
        return { customerUpdate: fine };
      },
      SignupTag: (variables) => {
        tagCalls += 1;
        if (tagCalls === 1) throw new Error("admin request failed: 500");
        for (const tag of variables.tags as string[]) tags.add(tag);
        return tagged();
      },
    });
    await expect(recordSignup(admin.client, signup, NOW)).rejects.toThrow(
      "500",
    );
    expect(note).toBe(NOTE);
    expect(tags.size).toBe(0);
    const again = await recordSignup(admin.client, signup, NOW);
    expect(again.repeated).toBe(true);
    expect(note).toBe(NOTE);
    expect(String(note).split("Pre-order by email").length - 1).toBe(1);
    expect([...tags]).toEqual(expect.arrayContaining(MORE));
    expect(admin.ops()).toEqual([
      "SignupFind",
      "SignupNote",
      "SignupTag",
      "SignupFind",
      "SignupTag",
    ]);
  });

  it("writes one block when the customer was made with the note and the answer was lost", async () => {
    let customer: { note: string } | null = null;
    let creates = 0;
    const admin = fakeAdmin({
      SignupFind: () =>
        customer ? onFile(customer.note)() : { customerByIdentifier: null },
      SignupCreate: (variables) => {
        creates += 1;
        customer = { note: (variables.input as { note: string }).note };
        throw new Error("admin request failed: 504");
      },
      SignupTag: tagged,
    });
    await expect(recordSignup(admin.client, signup, NOW)).rejects.toThrow(
      "504",
    );
    const again = await recordSignup(admin.client, signup, NOW);
    expect(creates).toBe(1);
    expect(again).toMatchObject({ created: false, repeated: true });
    expect(admin.ops()).toEqual([
      "SignupFind",
      "SignupCreate",
      "SignupFind",
      "SignupTag",
    ]);
  });

  it("stops before the tags when Shopify will not take the longer note, and says the note is full", async () => {
    for (const userErrors of [
      [{ message: "Note is too long" }],
      [{ field: ["note"], message: "Note is invalid" }],
    ]) {
      const admin = fakeAdmin({
        SignupFind: existing("SUBSCRIBED"),
        SignupNote: () => ({ customerUpdate: { userErrors } }),
        SignupTag: tagged,
      });
      await expect(
        recordSignup(admin.client, signup, NOW),
      ).rejects.toBeInstanceOf(NoteFull);
      expect(admin.ops()).toEqual(["SignupFind", "SignupNote"]);
    }
  });

  it("does not try to write a note that would pass 5,000 characters", async () => {
    expect(NOTE_MAX).toBe(5000);
    const room = NOTE_MAX - NOTE.length - 2;
    const admin = fakeAdmin({
      SignupFind: onFile("x".repeat(room + 1)),
      SignupTag: tagged,
    });
    await expect(
      recordSignup(admin.client, signup, NOW),
    ).rejects.toBeInstanceOf(NoteFull);
    expect(admin.ops()).toEqual(["SignupFind"]);
    // One character less and it fits exactly.
    const fits = fakeAdmin({
      SignupFind: onFile("x".repeat(room)),
      SignupNote: () => ({ customerUpdate: fine }),
      SignupTag: tagged,
    });
    await recordSignup(fits.client, signup, NOW);
    expect(
      (fits.calls[1].variables.input as { note: string }).note,
    ).toHaveLength(NOTE_MAX);
  });

  it("fails as a store error, not as a full note, for any other refusal of the note call", async () => {
    const admin = fakeAdmin({
      SignupFind: existing("SUBSCRIBED"),
      SignupNote: () => ({
        customerUpdate: { userErrors: [{ message: "Customer is locked" }] },
      }),
      SignupTag: tagged,
    });
    const failed = recordSignup(admin.client, signup, NOW);
    await expect(failed).rejects.toThrow("Customer is locked");
    await expect(failed).rejects.not.toBeInstanceOf(NoteFull);
  });

  it("makes the block from what the sign-up has earned: the answers sent, and the phone step only when it is backed", async () => {
    const withAnswers = { ...signup, answers: { goal: "training", nope: "x" } };
    const texting = {
      number: PHONE,
      state: "SUBSCRIBED",
    };
    for (const [find, wanted] of [
      [nobody, { answers: 1, phone: false }],
      [existing("SUBSCRIBED"), { answers: 1, phone: false }],
      [existing("SUBSCRIBED", texting), { answers: 1, phone: true }],
      [
        existing("SUBSCRIBED", { number: PHONE, state: "UNSUBSCRIBED" }),
        { answers: 1, phone: false },
      ],
    ] as const) {
      seen.length = 0;
      const admin = fakeAdmin({
        SignupFind: find,
        SignupCreate: made(),
        SignupNote: () => ({ customerUpdate: fine }),
        SignupTag: tagged,
      });
      const result = await recordSignup(admin.client, withAnswers, NOW);
      expect(seen).toEqual([wanted]);
      expect(result.earned).toEqual(wanted);
      // The step tag written with it is the same step.
      expect(admin.calls.at(-1)?.variables.tags).toContain(
        step(wanted.answers, wanted.phone),
      );
    }
  });

  it("leaves a customer who had unsubscribed as they are when the form asks for that, and still writes the note and the tags", async () => {
    const admin = fakeAdmin({
      SignupFind: onFile(null, "UNSUBSCRIBED"),
      SignupNote: () => ({ customerUpdate: fine }),
      SignupTag: tagged,
    });
    const result = await recordSignup(
      admin.client,
      { ...signup, keepUnsubscribed: true },
      NOW,
    );
    expect(admin.ops()).toEqual(["SignupFind", "SignupNote", "SignupTag"]);
    expect(result.subscribed).toBe(false);
  });

  it("still subscribes someone who never had emails, for that same form", async () => {
    const admin = fakeAdmin({
      SignupFind: onFile(null, "NOT_SUBSCRIBED"),
      SignupConsent: () => ({ customerEmailMarketingConsentUpdate: fine }),
      SignupNote: () => ({ customerUpdate: fine }),
      SignupTag: tagged,
    });
    const result = await recordSignup(
      admin.client,
      { ...signup, keepUnsubscribed: true },
      NOW,
    );
    expect(admin.ops()).toEqual([
      "SignupFind",
      "SignupConsent",
      "SignupNote",
      "SignupTag",
    ]);
    expect(result.subscribed).toBe(true);
  });

  it("leaves the note alone for a sign-up without one", async () => {
    const admin = fakeAdmin({
      SignupFind: existing("SUBSCRIBED"),
      SignupTag: tagged,
    });
    await recordSignup(
      admin.client,
      { email: "ana@gmail.com", source: "footer" },
      NOW,
    );
    expect(admin.ops()).toEqual(["SignupFind", "SignupTag"]);
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
      earned: { answers: 0, phone: false },
      repeated: false,
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

  it("subscribes a number already on file that never had texts, under either name of that state", async () => {
    for (const state of ["NEVER_SUBSCRIBED", "NOT_SUBSCRIBED"]) {
      const admin = fakeAdmin({
        SignupFind: existing("SUBSCRIBED", { number: PHONE, state }),
        SignupTexts: () => ({ customerSmsMarketingConsentUpdate: fine }),
        SignupTag: tagged,
      });
      const result = await recordSignup(
        admin.client,
        { email: "ana@gmail.com", source: "gift", phone: PHONE },
        NOW,
      );
      expect(admin.ops(), state).toEqual([
        "SignupFind",
        "SignupTexts",
        "SignupTag",
      ]);
      expect(admin.calls[1].variables).toEqual({
        input: {
          customerId: "gid://shopify/Customer/7",
          smsMarketingConsent: CONSENT,
        },
      });
      expect(result.texting, state).toBe(true);
    }
  });

  it("leaves a number whose texts are pending or erased as Shopify set it", async () => {
    for (const state of ["PENDING", "REDACTED"]) {
      const admin = fakeAdmin({
        SignupFind: existing("SUBSCRIBED", { number: PHONE, state }),
        SignupTag: tagged,
      });
      const result = await recordSignup(
        admin.client,
        { email: "ana@gmail.com", source: "gift", phone: PHONE },
        NOW,
      );
      expect(admin.ops(), state).toEqual(["SignupFind", "SignupTag"]);
      expect(result.texting, state).toBe(false);
    }
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
    const done = await recordPreferences(
      client,
      "ana@example.com",
      { goal: "training", flavour: "lemon" },
      NOW,
    );
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
    const answers = { goal: "training", flavour: "lemon", learn: "offers" };
    await recordPreferences(client, "ana@example.com", answers, NOW);
    expect(calls[1].variables.tags).toContain(step(3, true));
  });

  it("tags the standing offer's step once the campaign has ended", async () => {
    for (const later of [JUST_AFTER, A_DAY_AFTER]) {
      const { client, calls } = fakeAdmin({
        SignupFind: existing("SUBSCRIBED", {
          number: PHONE,
          state: "SUBSCRIBED",
        }),
        SignupTag: tagged,
      });
      const answers = { goal: "training", flavour: "lemon", learn: "offers" };
      await recordPreferences(client, "ana@example.com", answers, later);
      expect(calls[1].variables.tags).toEqual([
        "founder-20",
        "pref-goal-training",
        "pref-flavour-lemon",
        "pref-learn-offers",
      ]);
    }
  });

  it("does not count a number that has left the texts", async () => {
    const { client, calls } = fakeAdmin({
      SignupFind: existing("SUBSCRIBED", {
        number: PHONE,
        state: "UNSUBSCRIBED",
      }),
      SignupTag: tagged,
    });
    await recordPreferences(
      client,
      "ana@example.com",
      { goal: "training" },
      NOW,
    );
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
