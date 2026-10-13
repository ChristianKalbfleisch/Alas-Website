import Image from "next/image";

import { CtaLink } from "@/components/cta-link";

import styles from "./hero.module.css";

/**
 * Copy is the live site's own, verbatim.
 *
 * The image is the live site's hero — a dark Aegean sea surface, one of the
 * few photographs on the current site that reads as premium rather than
 * stock. Provenance is unconfirmed; see the licensing question in CLAUDE.md.
 */
export function Hero() {
  return (
    <section className={styles.hero} data-surface="black">
      <Image
        src="/home/aegean-sea.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className={styles.image}
      />
      {/* Scrim: the photograph alone does not guarantee contrast for the
          heading, and the type has to pass AA over every part of it. */}
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.content}>
        <p className={styles.eyebrow}>Ancient Elements of the Aegean</p>
        <h1 className={styles.heading}>
          Crafted by the Aegean.
          <br />
          Perfected Over Centuries
        </h1>
        <p className={styles.lede}>
          Our mineral salt is hand harvested from the pristine Aegean Sea, where
          natural elements create a mineral structure unmatched in modern
          hydration products.
        </p>
        <CtaLink href="/products">Buy Now</CtaLink>
      </div>
    </section>
  );
}
