import styles from "./announcement-bar.module.css";

/**
 * The live site runs this strip above the header. The wording is one of the
 * three confirmed offer terms — see CLAUDE.md. Do not add a term to it.
 */
export function AnnouncementBar() {
  return (
    <div className={styles.bar} data-surface="black">
      <p className={styles.text}>Free shipping on orders over $100</p>
    </div>
  );
}
