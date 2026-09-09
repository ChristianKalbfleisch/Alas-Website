import Link from "next/link";
import styles from "./page.module.css";

// Placeholder. The homepage is build-order step 4; this stands in so the app
// runs, and points at the token reference that step 1 produced.
export default function Home() {
  return (
    <main className={styles.main}>
      <p className={styles.eyebrow}>ALAS Salt Co.</p>
      <h1>Ancient Elements of the Aegean</h1>
      <p className={styles.lede}>
        The storefront is under construction. Design tokens are in place; the
        homepage is not yet built.
      </p>
      <Link className={styles.link} href="/design-tokens">
        View design tokens
      </Link>
    </main>
  );
}
