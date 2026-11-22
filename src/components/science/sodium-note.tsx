import { SODIUM_NOTE } from "@/data/why-salt";
import { MEASURE } from "./chapter";

/** How much sodium: the label's own figures beside the government guidance. */
export function SodiumNote() {
  return (
    <aside
      aria-labelledby="sodium-title"
      className={`mt-10 rounded-[var(--radius-card)] border border-line p-6 sm:p-8 ${MEASURE}`}
    >
      <h3 id="sodium-title" className="t-h3">
        {SODIUM_NOTE.title}
      </h3>
      <p className="t-body mt-3 text-ink-2">{SODIUM_NOTE.text}</p>
    </aside>
  );
}
