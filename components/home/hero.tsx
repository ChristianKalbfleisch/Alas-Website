import Image from "next/image";

import { CtaLink } from "@/components/cta-link";

import styles from "./hero.module.css";

/**
 * Copy is the live site's own, verbatim.
 *
 * The image is the live site's hero — a dark Aegean sea surface, one of the
 * few photographs on the current site that reads as premium rather than
 * stock. Provenance is unconfirmed; see the licensing question in CLAUDE.md.
 *
 * The water moves, just. Two compositor-only animations: a very slow scale
 * breath on the photograph, and a light sheen drifting across it. What the eye
 * reads as water is the moving highlight, not the push — a pan alone reads as
 * a camera move. Both run on transform and opacity only, so neither touches
 * layout or repaints the image, and the hero stays the LCP element it was.
 *
 * Deliberately slow enough to be almost subliminal. The brand direction is
 * restraint; a crashing-wave hero would read as a screensaver. It stops dead
 * under prefers-reduced-motion.
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
      {/* The drifting highlight. Purely decorative, so it is hidden from
          assistive tech and sits under the scrim. */}
      <div className={styles.sheen} aria-hidden="true" />

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
