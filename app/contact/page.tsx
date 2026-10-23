import type { Metadata } from "next";
import Link from "next/link";

import styles from "./page.module.css";

/**
 * A mailto, not a form.
 *
 * A form needs somewhere to post. Until there is a form service, a mailto
 * cannot silently swallow a customer's message the way a form with no
 * backend would — the mail either sends from their own client or it
 * visibly does not.
 *
 * TODO(Justin): confirm the address. He gave `info@alassalt.com`, but the
 * site and the store are on `alassaltco.com` — note the missing "co". If
 * the address is on the other domain this is a one-line change; if it is a
 * typo, mail sent here goes nowhere.
 */
const EMAIL = "info@alassalt.com";

const INSTAGRAM = "https://www.instagram.com/alassaltco/";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with ALAS Salt Co.",
};

export default function ContactPage() {
  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1 className={styles.title}>Contact</h1>
        <p className={styles.intro}>
          Questions about an order, wholesale, or the salt itself — write to us
          and we will get back to you.
        </p>
      </div>

      <dl className={styles.channels}>
        <div className={styles.channel}>
          <dt className={styles.channelKey}>Email</dt>
          <dd className={styles.channelValue}>
            <a className={styles.email} href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
          </dd>
        </div>

        <div className={styles.channel}>
          <dt className={styles.channelKey}>Your orders</dt>
          <dd className={styles.channelValue}>
            {/* Cheaper for everyone than an email asking where a parcel is. */}
            <p className={styles.note}>
              Order history and status live in your account.
            </p>
            <Link href="/account" className={styles.link}>
              Go to your account
            </Link>
          </dd>
        </div>

        <div className={styles.channel}>
          <dt className={styles.channelKey}>Instagram</dt>
          <dd className={styles.channelValue}>
            <a
              className={styles.link}
              href={INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
            >
              @alassaltco
            </a>
          </dd>
        </div>
      </dl>
    </div>
  );
}
