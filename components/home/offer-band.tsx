import styles from "./offer-band.module.css";

/**
 * The three confirmed offer terms, verbatim from CLAUDE.md. The live site
 * renders them in mixed case ("30 dAY", "fREE SHIPPING") — that is a Framer
 * text-transform artifact, not brand styling, so the confirmed wording is
 * used and the casing is done in CSS.
 *
 * Do not add a fourth term here without confirmation.
 */
const TERMS = [
  "30-day money back guarantee",
  "Save up to 20% on subscriptions",
  "Free shipping on orders over $100",
];

export function OfferBand() {
  return (
    <section
      className={styles.section}
      data-surface="deep"
      aria-labelledby="offers-heading"
    >
      <div className={styles.inner}>
        <h2 id="offers-heading" className={styles.heading}>
          Benefits to explore
        </h2>
        <ul className={styles.list}>
          {TERMS.map((term) => (
            <li key={term} className={styles.term}>
              {term}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
