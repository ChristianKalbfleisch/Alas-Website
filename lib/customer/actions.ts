"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  createAccessToken,
  createCustomer,
  deleteAccessToken,
  recoverPassword,
  updateCustomer,
  type AccessToken,
  type CustomerResult,
} from "@/lib/shopify/customer";
import type { CustomerError } from "@/lib/shopify";

import {
  clearCustomerToken,
  LOGIN_PATH,
  readCustomerToken,
  requireCustomer,
  writeCustomerToken,
} from "./session";

/**
 * Server actions behind the account forms.
 *
 * Credentials only ever exist inside these functions: the form posts to the
 * server, the password goes straight to Shopify, and what comes back is an
 * access token that is written to an httpOnly cookie. Nothing sensitive is
 * returned to the browser, and no password is ever logged.
 */

export type AccountFormState = {
  ok: boolean;
  message: string | null;
  /** Field name -> message, for errors that belong next to one input. */
  fields?: Record<string, string>;
};

export const EMPTY_FORM_STATE: AccountFormState = { ok: false, message: null };

/**
 * Shopify's floor is 5 characters, confirmed against the live API. 8 is our
 * own, stricter, rule — stated in the form so it is never a surprise.
 */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Shopify's error codes are the stable contract; the messages are not. Map the
 * codes that these flows can actually produce, and fall back to Shopify's own
 * wording for the rest rather than inventing a vague one.
 */
function describe(error: CustomerError): string {
  switch (error.code) {
    case "UNIDENTIFIED_CUSTOMER":
      return "That email and password do not match an account.";
    case "TAKEN":
      return "There is already an account with that email address.";
    case "CUSTOMER_DISABLED":
      return "This account is not active yet. Check your email for the activation link.";
    case "PASSWORD_STARTS_OR_ENDS_WITH_WHITESPACE":
      return "Your password cannot start or end with a space.";
    case "BLANK":
      return "This cannot be empty.";
    case "INVALID":
      return "That does not look right.";
    default:
      return error.message;
  }
}

/** Puts each error on its input where Shopify named one, and the rest at the top. */
function toState(errors: CustomerError[]): AccountFormState {
  const fields: Record<string, string> = {};
  const general: string[] = [];

  for (const error of errors) {
    // `field` arrives as a path, e.g. ["input", "password"]. The input name is
    // the last segment.
    const name = error.field?.[error.field.length - 1];
    if (name && name !== "input") {
      fields[name] = describe(error);
    } else {
      general.push(describe(error));
    }
  }

  return {
    ok: false,
    message: general.join(" ") || "Please check the details above.",
    ...(Object.keys(fields).length ? { fields } : {}),
  };
}

function read(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Anything other than a user error — network, schema, Shopify throttling a
 * burst of sign-in attempts — is logged server-side and reduced to something
 * the customer can act on.
 */
function unexpected(operation: string, error: unknown): AccountFormState {
  console.error(`${operation} failed`, error);
  return {
    ok: false,
    message: "Something went wrong on our side. Please try again.",
  };
}

/* Sign in ---------------------------------------------------------------- */

export async function signInAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const email = read(formData, "email");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, message: "Enter your email and your password." };
  }

  let result: CustomerResult<AccessToken>;
  try {
    result = await createAccessToken(email, password);
  } catch (error) {
    return unexpected("signInAction", error);
  }

  if (!result.ok) return toState(result.errors);

  await writeCustomerToken(result.data);

  // Outside the try: redirect works by throwing.
  redirect("/account");
}

/* Sign up ---------------------------------------------------------------- */

export async function registerAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const email = read(formData, "email");
  const password = String(formData.get("password") ?? "");
  const firstName = read(formData, "firstName");
  const lastName = read(formData, "lastName");
  const acceptsMarketing = formData.get("acceptsMarketing") === "on";

  if (!email) {
    return { ok: false, message: null, fields: { email: "Enter your email address." } };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      message: null,
      fields: {
        password: `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
      },
    };
  }

  try {
    const created = await createCustomer({
      email,
      password,
      acceptsMarketing,
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
    });
    if (!created.ok) return toState(created.errors);

    // Sign them straight in. Classic accounts created with a password are
    // active immediately, so making them type the same credentials again
    // would be friction for nothing.
    const token = await createAccessToken(email, password);
    if (!token.ok) {
      // The account exists; only the automatic sign-in fell over. Say exactly
      // that rather than implying the sign-up failed.
      return {
        ok: true,
        message: "Your account is created. Please sign in.",
      };
    }

    await writeCustomerToken(token.data);
  } catch (error) {
    return unexpected("registerAction", error);
  }

  redirect("/account");
}

/* Sign out -------------------------------------------------------------- */

export async function signOutAction(): Promise<void> {
  const token = await readCustomerToken();

  // Clear ours first, so the visitor is signed out of this browser even if
  // revoking at Shopify's end fails.
  await clearCustomerToken();
  if (token) await deleteAccessToken(token);

  revalidatePath("/account");
  redirect("/");
}

/* Password reset -------------------------------------------------------- */

export async function recoverAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const email = read(formData, "email");

  if (!email) {
    return { ok: false, message: "Enter your email address." };
  }

  // The same answer either way, on purpose. Shopify returns
  // UNIDENTIFIED_CUSTOMER for an address with no account, and passing that
  // through would turn this form into a way to test whether someone is a
  // customer.
  const neutral: AccountFormState = {
    ok: true,
    message: `If there is an account for ${email}, a reset link is on its way.`,
  };

  try {
    const result = await recoverPassword(email);
    if (!result.ok) {
      const leaks = result.errors.every(
        (error) =>
          error.code === "UNIDENTIFIED_CUSTOMER" || error.code === "NOT_FOUND",
      );
      if (!leaks) return toState(result.errors);
    }
  } catch (error) {
    return unexpected("recoverAction", error);
  }

  return neutral;
}

/* Profile --------------------------------------------------------------- */

export async function updateProfileAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  // Verifies the session before writing. `customerUpdate` rejects a dead token
  // with a top-level ACCESS_DENIED rather than a user error, so checking first
  // is what keeps an expired cookie from surfacing as a crash.
  const { token } = await requireCustomer();

  const firstName = read(formData, "firstName");
  const lastName = read(formData, "lastName");
  const phone = read(formData, "phone");
  const acceptsMarketing = formData.get("acceptsMarketing") === "on";

  try {
    const result = await updateCustomer(token, {
      // `|| null` rather than the empty string: null is how Shopify clears a
      // field, and "" comes back as INVALID.
      firstName: firstName || null,
      lastName: lastName || null,
      // Shopify wants E.164 here and rejects anything else, which surfaces as
      // a field error on the input.
      phone: phone || null,
      acceptsMarketing,
    });

    if (!result.ok) return toState(result.errors);

    // Changing details can retire the old token. Store the replacement, or the
    // next read signs them out.
    if (result.data.token) await writeCustomerToken(result.data.token);
  } catch (error) {
    // Most likely the token expired between the check above and the write.
    await clearCustomerToken();
    console.error("updateProfileAction failed", error);
    redirect(LOGIN_PATH);
  }

  revalidatePath("/account");
  return { ok: true, message: "Saved." };
}
