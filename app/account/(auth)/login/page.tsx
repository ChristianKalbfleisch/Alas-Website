import type { Metadata } from "next";
import Link from "next/link";

import { SignInForm } from "@/components/account/sign-in-form";

import styles from "../auth.module.css";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <>
      <div className={styles.heading}>
        <h1 className={styles.title}>Sign in</h1>
      </div>

      <SignInForm />

      <div className={styles.links}>
        <Link href="/account/register" className={styles.link}>
          Create an account
        </Link>
        <Link href="/account/forgot-password" className={styles.link}>
          Forgot your password?
        </Link>
      </div>
    </>
  );
}
