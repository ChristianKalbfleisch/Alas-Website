import Link from "next/link";

import styles from "./cta-link.module.css";

type Props = {
  href: string;
  children: React.ReactNode;
  /** "solid" reverses out of the ground; "ghost" is an outline. */
  variant?: "solid" | "ghost";
};

export function CtaLink({ href, children, variant = "solid" }: Props) {
  return (
    <Link href={href} className={styles.cta} data-variant={variant}>
      {children}
    </Link>
  );
}
