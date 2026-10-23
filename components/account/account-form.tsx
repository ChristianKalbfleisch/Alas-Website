"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import type { AccountFormState } from "@/lib/customer/form-state";

import styles from "./account-form.module.css";

/**
 * The pieces every account form shares. Kept here so the four forms differ
 * only in their fields and their action, and so the error wiring — one
 * aria-describedby per input, one live region per form — is written once.
 */

/**
 * Moves focus to the first field Shopify rejected.
 *
 * The live region announces that something failed; this is what tells someone
 * using a keyboard or a screen reader *where*, without making them walk the
 * form to find it.
 */
export function useErrorFocus(state: AccountFormState) {
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok || !state.fields) return;
    form.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
  }, [state]);

  return form;
}

export function Submit({ label, busy }: { label: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.submit} disabled={pending}>
      {pending ? busy : label}
    </button>
  );
}

export function Field({
  name,
  label,
  type = "text",
  autoComplete,
  required,
  defaultValue,
  hint,
  error,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  defaultValue?: string;
  hint?: string;
  error?: string;
}) {
  // An address, a number or a password has nothing to spell-check, and the
  // red squiggle under a correctly typed email is pure noise.
  const spellCheck = type === "text" ? undefined : false;
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  // Both, where both exist: a screen reader should hear the rule and the
  // failure, not one instead of the other.
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <p className={styles.field}>
      <label className={styles.label} htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        className={styles.input}
        autoComplete={autoComplete}
        required={required}
        defaultValue={defaultValue}
        spellCheck={spellCheck}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {error && (
        <span className={styles.fieldError} id={errorId}>
          {error}
        </span>
      )}
      {hint && (
        <span className={styles.hint} id={hintId}>
          {hint}
        </span>
      )}
    </p>
  );
}

export function Check({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className={styles.check}>
      <input
        type="checkbox"
        name={name}
        className={styles.checkBox}
        defaultChecked={defaultChecked}
      />
      <span className={styles.checkLabel}>{label}</span>
    </label>
  );
}

/**
 * One live region per form, announced as it changes. `polite` rather than
 * `assertive`: these arrive on submit, when the customer is already waiting
 * for them.
 */
export function FormMessage({ state }: { state: AccountFormState }) {
  return (
    <p
      className={`${styles.message} ${state.ok ? styles.messageOk : ""}`}
      role="status"
      aria-live="polite"
    >
      {state.message}
    </p>
  );
}
