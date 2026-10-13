import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Design tokens",
  description:
    "The colour, type, space and radius tokens the ALAS storefront is built from.",
};

const palette = [
  { name: "Navy", token: "--alas-navy", hex: "#12314D", use: "Page ground" },
  {
    name: "Deep navy",
    token: "--alas-navy-deep",
    hex: "#192436",
    use: "Footer, contrast bands",
  },
  { name: "Black", token: "--alas-black", hex: "#000000", use: "Hero over imagery" },
  { name: "White", token: "--alas-white", hex: "#FFFFFF", use: "Type on dark" },
  { name: "Grey", token: "--alas-grey", hex: "#686868", use: "Muted text on light" },
  { name: "Grey dark", token: "--alas-grey-dark", hex: "#353535", use: "Secondary muted" },
  { name: "Red", token: "--alas-red", hex: "#E5163E", use: "Sale and badges only" },
];

const typeScale = [
  { token: "--text-5xl", label: "Hero", sample: "Ancient Elements" },
  { token: "--text-4xl", label: "h1", sample: "Ancient Elements" },
  { token: "--text-3xl", label: "h2", sample: "Hydration Element" },
  { token: "--text-2xl", label: "h3", sample: "The Ritual" },
  { token: "--text-xl", label: "h4", sample: "Aegean Mineral Salt" },
  { token: "--text-md", label: "Lead", sample: "Hand-harvested from the Aegean." },
  { token: "--text-sm", label: "Body", sample: "Hand-harvested from the Aegean." },
  { token: "--text-xs", label: "Caption", sample: "Hand-harvested from the Aegean." },
];

const spacing = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

export default function DesignTokensPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>ALAS Salt Co.</p>
        <h1>Design tokens</h1>
        <p className={styles.lede}>
          Every colour, size and space the storefront is allowed to use. Values
          are read from the brand&rsquo;s own design tokens and confirmed
          against the packaging. Components reference these — never raw hex or
          pixel values.
        </p>
      </header>

      <section className={styles.section} aria-labelledby="colour">
        <h2 id="colour">Colour</h2>
        <ul className={styles.swatches}>
          {palette.map((c) => (
            <li key={c.token} className={styles.swatch}>
              <span
                className={styles.chip}
                style={{ background: `var(${c.token})` }}
              />
              <span className={styles.swatchName}>{c.name}</span>
              <code className={styles.code}>{c.hex}</code>
              <span className={styles.swatchUse}>{c.use}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="type">
        <h2 id="type">Type</h2>
        <p className={styles.note}>
          Headings run tight and light; body text is set at weight 500, which is
          the current site&rsquo;s default. The display face is a placeholder
          serif until the licensed files arrive.
        </p>
        <ul className={styles.typeList}>
          {typeScale.map((t) => (
            <li key={t.token} className={styles.typeRow}>
              <span className={styles.typeMeta}>
                <code className={styles.code}>{t.token}</code>
                <span className={styles.typeLabel}>{t.label}</span>
              </span>
              <span
                className={styles.typeSample}
                style={{ fontSize: `var(${t.token})` }}
              >
                {t.sample}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="space">
        <h2 id="space">Space</h2>
        <ul className={styles.spaceList}>
          {spacing.map((s) => (
            <li key={s} className={styles.spaceRow}>
              <code className={styles.code}>--space-{s}</code>
              <span
                className={styles.spaceBar}
                style={{ width: `var(--space-${s})` }}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="surfaces">
        <h2 id="surfaces">Surfaces</h2>
        <p className={styles.note}>
          A band sets <code className={styles.code}>data-surface</code> and its
          contents inherit the right foreground colours automatically.
        </p>
        <div className={styles.surfaces}>
          <div className={styles.band} data-surface="deep">
            <h3>Deep</h3>
            <p>Footer and contrast bands.</p>
          </div>
          <div className={styles.band} data-surface="black">
            <h3>Black</h3>
            <p>Hero over imagery.</p>
          </div>
          <div className={styles.band} data-surface="light">
            <h3>Light</h3>
            <p>Editorial bands and product detail.</p>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="radius">
        <h2 id="radius">Radius</h2>
        <div className={styles.radii}>
          <span className={styles.radiusBox} style={{ borderRadius: "var(--radius-sm)" }}>
            8px
          </span>
          <span className={styles.radiusBox} style={{ borderRadius: "var(--radius-md)" }}>
            10px
          </span>
          <span className={styles.radiusBox} style={{ borderRadius: "var(--radius-pill)" }}>
            pill
          </span>
        </div>
      </section>
    </main>
  );
}
