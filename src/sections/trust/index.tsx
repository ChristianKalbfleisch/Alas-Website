import { MANIFESTO } from "./content";
import { Exit } from "./exit";
import { Manifesto } from "./manifesto";
import { Voices } from "./voices";

/**
 * 10 / Trust. What we believe, in one Garamond breath, then the voices
 * (sample copy, tagged "Preview"). About two screens. Starts and ends on chalk.
 */
export default function TrustSection() {
  return (
    <section
      id="trust"
      data-section="trust"
      className="relative bg-chalk py-[var(--section-y)] text-ink"
    >
      <div className="container-x">
        <div className="rule-label justify-between">
          <p className="eyebrow">/ Real salt, real hands</p>
          <p className="eyebrow hidden sm:block">/ What we believe</p>
        </div>

        <Exit className="mt-12 lg:mt-16">
          <Manifesto lead={MANIFESTO.lead} rest={MANIFESTO.rest} />
        </Exit>

        <Exit enter className="mt-24 lg:mt-36">
          <Voices />
        </Exit>
      </div>
    </section>
  );
}
