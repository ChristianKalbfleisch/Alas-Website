import Link from "next/link";

import styles from "./site-header.module.css";

// Nav lists only routes that exist. Pages still to be built (the Ritual,
// about, contact) are deliberately absent rather than stubbed as dead links.
//
// The cart link carries no item count, and the account link does not say
// whether anyone is signed in. Both would mean reading a cookie here, which
// would make every page dynamic and cost the whole site its static rendering.
// Either belongs in a client component that fetches it, or behind PPR. In the
// meantime /account redirects to sign-in when there is no session.
const NAV = [
  { href: "/products", label: "Shop" },
  { href: "/account", label: "Account" },
  { href: "/cart", label: "Cart" },
];

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="ALAS Salt Co. — home">
          {/* The brand lockup, supplied as SVG. Served as a plain <img>: next/image
              does not optimise SVG, and a vector needs no responsive variants.
              It is a stacked square-ish lockup, so it is sized by height to keep
              the header row shallow. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-lockup.svg"
            alt="ALAS Salt Co."
            width={760}
            height={578}
            fetchPriority="high"
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
