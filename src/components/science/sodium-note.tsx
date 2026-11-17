import { MEASURE } from "./chapter";

/** How much sodium: the label's own figures beside the government guidance. */
export function SodiumNote() {
  return (
    <aside
      aria-labelledby="sodium-title"
      className={`mt-10 rounded-[var(--radius-card)] border border-line p-6 sm:p-8 ${MEASURE}`}
    >
      <h3 id="sodium-title" className="t-h3">
        How much sodium
      </h3>
      <p className="t-body mt-3 text-ink-2">
        A quarter-teaspoon serving of ALAS Classic has 580 mg of sodium, 25% of
        the Daily Value. US guidelines suggest that people 14 and older keep
        sodium under 2,300 mg a day. If you watch your sodium or have a medical
        condition, ask your doctor first.
      </p>
    </aside>
  );
}
