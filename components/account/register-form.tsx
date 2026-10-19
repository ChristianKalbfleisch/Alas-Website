"use client";

import { useActionState } from "react";

import { registerAction } from "@/lib/customer/actions";
import { EMPTY_FORM_STATE } from "@/lib/customer/form-state";

import { Check, Field, FormMessage, Submit, useErrorFocus } from "./account-form";
import styles from "./account-form.module.css";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, EMPTY_FORM_STATE);
  const form = useErrorFocus(state);

  return (
    <form ref={form} action={formAction} className={styles.form}>
      <div className={styles.fields}>
        <div className={styles.row}>
          <Field
            name="firstName"
            label="First name"
            autoComplete="given-name"
            error={state.fields?.firstName}
          />
          <Field
            name="lastName"
            label="Last name"
            autoComplete="family-name"
            error={state.fields?.lastName}
          />
        </div>

        <Field
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          error={state.fields?.email}
        />
        <Field
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          hint="At least 8 characters."
          error={state.fields?.password}
        />

        <Check
          name="acceptsMarketing"
          label="Email me about new products and the Ritual."
        />
      </div>

      <Submit label="Create account" busy="Creating…" />
      <FormMessage state={state} />
    </form>
  );
}
