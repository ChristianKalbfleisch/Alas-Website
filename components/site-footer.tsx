import Image from "next/image";
import Link from "next/link";

import styles from "./site-footer.module.css";

// Confirmed 2026-09-09 and recorded in CLAUDE.md. These are the only numbers
// cleared for use — do not add to this list without confirmation.
const OFFER_TERMS = [
  "30-day money back guarantee",
  "Save up to 20% on subscriptions",
  "Free shipping on orders over $100",
];

export function SiteFooter() {
  return (
    <footer className={styles.footer} data-surface="deep">
      <div className={styles.inner}>
        <ul className={styles.terms}>
          {OFFER_TERMS.map((term) => (
            <li key={term} className={styles.term}>
              {term}
            </li>
          ))}
        </ul>

        <div className={styles.main}>
          <div className={styles.brand}>
            <Image
              src="/logo-wordmark.png"
              alt="ALAS Salt Co."
              width={133}
              height={76}
              className={styles.logo}
            />
            <p className={styles.tagline}>Ancient Elements of the Aegean</p>
          </div>

          <nav className={styles.nav} aria-label="Footer">
            <h2 className={styles.navHeading}>Shop</h2>
            <ul className={styles.navList}>
              <li>
                <Link href="/products" className={styles.navLink}>
                  All products
                </Link>
              </li>
            </ul>
          </nav>

          <div className={styles.nav}>
            <h2 className={styles.navHeading}>Follow</h2>
            <ul className={styles.navList}>
              <li>
                <a
                  className={styles.navLink}
                  href="https://www.instagram.com/alassaltco/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.legalBlock}>
          {/* Required by the brief on any page carrying wellness language. */}
          <p className={styles.disclaimer}>
            These statements have not been evaluated by the Food and Drug
            Administration. This product is not intended to diagnose, treat,
            cure, or prevent any disease.
          </p>

          <p className={styles.legal}>
            &copy; {new Date().getFullYear()} ALAS Salt Co. LLC
          </p>
        </div>
      </div>
    </footer>
  );
}
