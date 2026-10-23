"use client";

import { useActionState } from "react";

import { updateProfileAction } from "@/lib/customer/actions";
import { EMPTY_FORM_STATE } from "@/lib/customer/form-state";
import type { Customer } from "@/lib/shopify/types";

import { Check, Field, FormMessage, Submit, useErrorFocus } from "./account-form";
import styles from "./account-form.module.css";

/**
 * Name, phone and marketing consent. Email and password are not here on
 * purpose: both change what the customer signs in with, so both want their
 * own flow with a confirmation step rather than riding along on this form.
 */
export function ProfileForm({ customer }: { customer: Customer }) {
  const [state, formAction] = useActionState(
    updateProfileAction,
    EMPTY_FORM_STATE,
  );
  const form = useErrorFocus(state);

  return (
    <form ref={form} action={formAction} className={styles.form}>
      <div className={styles.fields}>
        <div className={styles.row}>
          <Field
            name="firstName"
            label="First name"
            autoComplete="given-name"
            defaultValue={customer.firstName ?? ""}
            error={state.fields?.firstName}
          />
          <Field
            name="lastName"
            label="Last name"
            autoComplete="family-name"
            defaultValue={customer.lastName ?? ""}
            error={state.fields?.lastName}
          />
        </div>

        <Field
          name="phone"
          label="Phone"
          type="tel"
          autoComplete="tel"
          defaultValue={customer.phone ?? ""}
          hint="With the country code, e.g. +1 307 555 0147."
          error={state.fields?.phone}
        />

        <Check
          name="acceptsMarketing"
          label="Email me about new products and the Ritual."
          defaultChecked={customer.acceptsMarketing}
        />
      </div>

      <Submit label="Save details" busy="Saving…" />
      <FormMessage state={state} />
    </form>
  );
}
