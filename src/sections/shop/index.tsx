import { RevealText } from "@/components/motion/reveal-text";
import { BoxPlates } from "./box-plates";
import { Rise } from "./rise";
import { SaltCounter } from "./salt-counter";
import { SticksCounter } from "./sticks-counter";

/** Shop: three sizes of one salt, the sticks, the boxes. Begins and ends on chalk. */
export default function ShopSection() {
  return (
    <section
      id="shop"
      data-section="shop"
      data-gift-avoid
      className="relative bg-chalk py-[var(--section-y)] text-ink"
    >
      <div className="container-x">
        <Rise>
          <p className="rule-label eyebrow justify-between">
            <span>/ Shop</span>
            <span className="hidden text-ink-3! sm:inline">
              Harvested in Greece, packaged in the USA
            </span>
          </p>
        </Rise>

        <div className="mt-10 lg:mt-14">
          <RevealText
            as="h2"
            by="words"
            stagger={0.07}
            className="font-display text-[length:var(--fs-h1)]"
          >
            Mikró, Mésos, <em>Megálo.</em>
          </RevealText>
          <RevealText
            as="p"
            by="words"
            delay={0.25}
            stagger={0.05}
            className="font-display mt-4 text-[length:var(--fs-h3)] text-ink-2"
          >
            Small, middle, large. Same salt.
          </RevealText>
        </div>

        <div className="mt-14 lg:mt-20">
          <SaltCounter />
        </div>
        <div className="mt-[clamp(6rem,4rem+8vw,11rem)]">
          <SticksCounter />
        </div>
        <div className="mt-[clamp(6rem,4rem+8vw,11rem)]">
          <BoxPlates />
        </div>
      </div>
    </section>
  );
}
