export default function TypeSpecimen() {
  return (
    <main className="container-x py-32">
      <p className="rule-label eyebrow">01 / The word</p>
      <h1
        className="font-display mt-10 text-ink"
        style={{ fontSize: "var(--fs-display)" }}
      >
        Crafted by the Aegean.
        <br />
        Perfected over <em>centuries.</em>
      </h1>
      <p
        className="font-display mt-10 text-ink"
        style={{ fontSize: "clamp(6rem, 20vw, 18rem)", lineHeight: 1 }}
      >
        ἅλας
      </p>
      <p
        className="font-display text-ink-2"
        style={{ fontSize: "var(--fs-h3)" }}
      >
        «Ὑμεῖς ἐστε τὸ ἅλας τῆς γῆς» · You are the salt of the earth.
      </p>
      <p className="mt-8 max-w-xl text-[15px] text-ink-2">
        Hand-harvested Greek sea salt for your daily water. Sun-dried,
        unrefined, nothing added.
      </p>
      <p className="eyebrow mt-6">/ Origin · Kalloni, Lesvos · 39.21° N</p>
    </main>
  );
}
