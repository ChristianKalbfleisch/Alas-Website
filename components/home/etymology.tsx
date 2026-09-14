import Image from "next/image";

import styles from "./etymology.module.css";

/**
 * Copy verbatim from the live site.
 *
 * Note for review: "harvested by hand from the shores of Greece" sits against
 * packaging that reads "harvested and packaged in the USA". That contradiction
 * is on the live site today and is listed unresolved in CLAUDE.md — it is
 * reproduced here, not resolved here.
 */
export function Etymology() {
  return (
    <section className={styles.section} aria-labelledby="etymology-heading">
      <div className={styles.inner}>
        <div className={styles.word}>
          <h2 id="etymology-heading" className={styles.greek} lang="el">
            ἅλας
          </h2>
          <p className={styles.phonetic}>/əˈlas/</p>
          <dl className={styles.meta}>
            <dt className={styles.metaKey}>Meaning</dt>
            <dd className={styles.metaValue}>Greek origin of salt</dd>
          </dl>

          <Image
            src="/home/salt-mound.png"
            alt=""
            width={573}
            height={224}
            sizes="(max-width: 60rem) 80vw, 30rem"
            className={styles.mound}
          />
        </div>

        <div className={styles.body}>
          <p className={styles.lede}>
            Pronounced &ldquo;a-las,&rdquo; this ancient Greek word represents
            purity, preservation, and life itself.
          </p>
          <p className={styles.text}>
            At ALAS Salt Co., we honour this legacy with our Aegean Mineral Salt
            &mdash; harvested by hand from the shores of Greece, sun-dried by
            the sea, and crafted for those who pursue performance with
            intention.
          </p>
        </div>
      </div>
    </section>
  );
}
