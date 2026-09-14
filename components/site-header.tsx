import Image from "next/image";
import Link from "next/link";

import styles from "./site-header.module.css";

// Nav lists only routes that exist. Pages still to be built (the Ritual,
// about, contact) are deliberately absent rather than stubbed as dead links.
//
// The cart link carries no item count on purpose: reading the cart cookie here
// would make every page dynamic and cost the whole site its static rendering.
// A count belongs in a client component that fetches it, or behind PPR.
const NAV = [
  { href: "/products", label: "Shop" },
  { href: "/cart", label: "Cart" },
];

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="ALAS Salt Co. — home">
          {/* Placeholder: the wordmark lifted from the live site's Open Graph
              image, the largest flat logo asset that exists, with its 1-bit
              alpha re-anti-aliased. 196px wide. Replace with the licensed SVG
              when it arrives — the header and footer are its only users. */}
          <Image
            src="/logo-wordmark.png"
            alt="ALAS Salt Co."
            width={196}
            height={113}
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
