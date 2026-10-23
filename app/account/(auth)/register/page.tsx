import type { Metadata } from "next";
import Link from "next/link";

import { RegisterForm } from "@/components/account/register-form";

import styles from "../auth.module.css";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <>
      <div className={styles.heading}>
        <h1 className={styles.title}>Create an account</h1>
        {/* Only what an account actually does today. No rewards, no points
            and no welcome discount: none of those exist yet, and the page
            will say so when they do. */}
        <p className={styles.intro}>
          Keep your order history in one place and check out faster next time.
        </p>
      </div>

      <RegisterForm />

      <div className={styles.links}>
        <Link href="/account/login" className={styles.link}>
          Already have an account? Sign in
        </Link>
      </div>
    </>
  );
}
