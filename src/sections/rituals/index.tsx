import { RevealText } from "@/components/motion/reveal-text";
import { Exits } from "./exits";
import { RitualCard } from "./ritual-card";
import { RITUALS } from "./rituals";

/** 06 · Rituals: a day in three named rituals, two of them one tap from the cart. */
export default function RitualsSection() {
  return (
    <section
      id="rituals"
      data-section="rituals"
      className="relative bg-chalk py-[var(--section-y)]"
    >
      <Exits className="container-x">
        <p className="rule-label eyebrow">/ Rituals</p>
        <div
          data-exit
          className="mt-10 grid gap-8 md:grid-cols-12 md:items-end md:gap-6"
        >
          <RevealText
            as="h2"
            by="words"
            stagger={0.06}
            className="font-display text-ink [font-size:var(--fs-h1)] md:col-span-7"
          >
            One mineral. Multiple rituals.
          </RevealText>
          <RevealText
            as="p"
            delay={0.2}
            className="max-w-[24rem] text-[15px] text-ink-2 leading-relaxed md:col-span-4 md:col-start-9"
          >
            Water is the one habit everyone shares. Three simple ways to make it
            a ritual, from the first glass of the morning to a slow soak at
            night.
          </RevealText>
        </div>

        <ul className="mt-[10vh] grid grid-cols-1 gap-y-16 md:mt-[12vh] md:grid-cols-12 md:items-start md:gap-x-6 md:gap-y-[10vh]">
          {RITUALS.map((ritual) => (
            <RitualCard key={ritual.n} ritual={ritual} />
          ))}
          <li
            data-exit
            className="md:col-span-4 md:col-start-9 md:self-end md:pb-2"
          >
            <p className="eyebrow">/ At the table</p>
            <RevealText
              as="p"
              className="font-display mt-4 text-ink [font-size:var(--fs-h3)] leading-[1.2]"
            >
              It is also a finishing salt. Over ripe tomatoes, good olive oil,
              warm bread.
            </RevealText>
          </li>
        </ul>
      </Exits>
    </section>
  );
}
