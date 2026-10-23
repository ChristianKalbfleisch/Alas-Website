"use client";

import { useFormStatus } from "react-dom";

import { signOutAction } from "@/lib/customer/actions";

import styles from "./sign-out-button.module.css";

/**
 * A form, not a link: signing out clears a cookie and revokes a token at
 * Shopify, which is a write and must not happen on a GET a browser might
 * prefetch.
 */
function Button() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.button} disabled={pending}>
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button />
    </form>
  );
}
