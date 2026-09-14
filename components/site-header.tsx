import Image from "next/image";
import Link from "next/link";

import styles from "./site-header.module.css";

// Nav lists only routes that exist. Pages still to be built (the Ritual,
// about, contact) are deliberately absent rather than stubbed as dead links.
const NAV = [{ href: "/products", label: "Shop" }];

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <a className={styles.skip} href="#main">
        Skip to content
      </a>

      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="ALAS Salt Co. — home">
          {/* Placeholder: extracted from the live site's app icon, the only flat
              logo asset that exists. 133px wide, so it is soft on high-DPI
              screens. Replace with the licensed SVG when it arrives — this is
              the only reference to it. */}
          <Image
            src="/logo-wordmark.png"
            alt="ALAS Salt Co."
            width={133}
            height={76}
            priority
            className={styles.logo}
          />
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          <ul className={styles.navList}>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={styles.navLink}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
