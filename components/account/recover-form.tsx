"use client";

import { useActionState } from "react";

import { recoverAction } from "@/lib/customer/actions";
import { EMPTY_FORM_STATE } from "@/lib/customer/form-state";

import { Field, FormMessage, Submit, useErrorFocus } from "./account-form";
import styles from "./account-form.module.css";

export function RecoverForm() {
  const [state, formAction] = useActionState(recoverAction, EMPTY_FORM_STATE);
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
      </div>

      <Submit label="Send reset link" busy="Sending…" />
      <FormMessage state={state} />
    </form>
  );
}
