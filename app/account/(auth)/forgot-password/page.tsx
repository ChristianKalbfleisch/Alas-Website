import type { Metadata } from "next";
import Link from "next/link";

import { RecoverForm } from "@/components/account/recover-form";

import styles from "../auth.module.css";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <div className={styles.heading}>
        <h1 className={styles.title}>Reset your password</h1>
        <p className={styles.intro}>
          Enter the email address on your account and we will send a link to
          set a new password.
        </p>
      </div>

      <RecoverForm />

      <div className={styles.links}>
        <Link href="/account/login" className={styles.link}>
          Back to sign in
        </Link>
      </div>
    </>
  );
}
