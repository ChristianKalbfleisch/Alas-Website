"use client";

import { useActionState } from "react";

import { signInAction } from "@/lib/customer/actions";
import { EMPTY_FORM_STATE } from "@/lib/customer/form-state";

import { Field, FormMessage, Submit, useErrorFocus } from "./account-form";
import styles from "./account-form.module.css";

export function SignInForm() {
  const [state, formAction] = useActionState(signInAction, EMPTY_FORM_STATE);
  const form = useErrorFocus(state);

  return (
    <form ref={form} action={formAction} className={styles.form}>
      <div className={styles.fields}>
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
          autoComplete="current-password"
          required
          error={state.fields?.password}
        />
      </div>

      <Submit label="Sign in" busy="Signing in…" />
      <FormMessage state={state} />
    </form>
  );
}
