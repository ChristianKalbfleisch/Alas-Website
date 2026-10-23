import Image from "next/image";

import { CtaLink } from "@/components/cta-link";

import styles from "./minerals.module.css";

/**
 * Ported health copy.
 *
 * Per the 2026-09-09 decision in CLAUDE.md, the live site's hydration and
 * electrolyte language is reproduced as written. Nothing here is authored,
 * extended or intensified.
 *
 * HELD BACK — three statistics on the live site are NOT reproduced here:
 *   ">68% of americans do not meet daily magnesium intake needs, resulting in
 *    an increased risk of type 2 diabetes"
 *   ">20% Reduction in risk of type 2 diabetes and stroke"
 *   "20% Of The World's Population Is Zinc Deficient And Linked To Weakened
 *    Immunity"
 * plus the phrase "clinically proven".
 *
 * These are disease risk-reduction claims, a different legal category from
 * the hydration language the port decision covered, and none carries a cited
 * source. CLAUDE.md requires a source for every number that is not a
 * confirmed price or offer term. They go in only once Justin supplies
 * citations and confirms he wants them. See the open question in CLAUDE.md.
 */
const BENEFITS = [
  "Sustained hydration",
  "Improved energy production",
  "Sharper performance",
  "Faster recovery",
];

const QUALIFIERS = [
  "Unprocessed",
  "Third party tested",
  "No contaminants",
  "No banned substances",
];

export function Minerals() {
  return (
    <section className={styles.section} aria-labelledby="minerals-heading">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Hydrate . Perform . Recover .</p>
          <h2 id="minerals-heading" className={styles.heading}>
            Real minerals. No artificial blends
          </h2>
          <p className={styles.text}>
            Most hydration products rely on artificial flavours, sugars, and
            lab-made electrolyte blends.
          </p>
          <p className={styles.text}>
            ALAS Aegean Mineral Salt delivers peak performance the natural way,
            with more than 80 essential trace minerals sourced directly from the
            Aegean Sea.
          </p>

          <ul className={styles.benefits}>
            {BENEFITS.map((benefit) => (
              <li key={benefit} className={styles.benefit}>
                {benefit}
              </li>
            ))}
          </ul>

          <ul className={styles.qualifiers}>
            {QUALIFIERS.map((q) => (
              <li key={q} className={styles.qualifier}>
                {q}
              </li>
            ))}
          </ul>
        </div>

        <figure className={styles.figure}>
          <Image
            src="/home/salt-shallows.jpg"
            alt="Sea salt crystallised along the edge of clear shallow water"
            width={1600}
            height={1066}
            sizes="(max-width: 60rem) 92vw, 46vw"
            className={styles.image}
          />
          <figcaption className={styles.caption}>
            <span className={styles.captionLead}>No additives. No fillers</span>
            <span className={styles.captionText}>
              Pure mineral power crafted by the Aegean sea
            </span>
          </figcaption>
        </figure>
      </div>

      <div className={styles.advantage}>
        <div className={styles.advantageInner}>
          <div className={styles.statBlock}>
            <p className={styles.stat}>80+</p>
            <p className={styles.statText}>
              trace minerals and electrolytes, including magnesium, calcium,
              potassium, iron, zinc, and selenium
            </p>
          </div>

          <div className={styles.advantageCopy}>
            <h3 className={styles.advantageHeading}>
              The Natural Advantage Your Body Needs
            </h3>
            <p className={styles.text}>
              Your body does not run on water alone. It runs on minerals. When
              mineral levels drop, hydration, energy, and endurance decline.
            </p>
            <p className={styles.text}>
              ALAS restores what modern diets and processed salts have removed,
              delivering complete mineral support in its most natural form.
            </p>
            <CtaLink href="/products" variant="ghost">
              Shop Now
            </CtaLink>
          </div>
        </div>
      </div>
    </section>
  );
}
