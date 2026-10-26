import { RevealText } from "@/components/motion/reveal-text";
import { Button } from "@/components/ui/button";
import { Accordion } from "./accordion";
import { CONTACT_EMAIL, FAQS } from "./content";
import { StickyExit } from "./sticky-exit";

/** 11 / FAQ. A sticky statement on the left, plain answers on the right. */
export default function FaqSection() {
  return (
    <section
      id="faq"
      data-section="faq"
      className="relative bg-chalk py-[var(--section-y)] text-ink"
    >
      <div className="container-x">
        <div className="rule-label justify-between">
          <p className="eyebrow">/ Questions</p>
          <p className="eyebrow hidden sm:block">/ Plain answers</p>
        </div>

        <div className="mt-12 grid gap-14 lg:mt-16 lg:grid-cols-12 lg:gap-x-6">
          <div className="lg:col-span-5">
            <StickyExit className="lg:sticky lg:top-[18vh]">
              <RevealText
                as="h2"
                className="font-display max-w-[11ch] text-[length:clamp(2.6rem,1.4rem+3.6vw,5.25rem)] text-ink"
                stagger={0.1}
              >
                Fair questions, <em>plain</em> answers.
              </RevealText>
              <p className="mt-8 max-w-[34ch] text-[1.02rem] leading-relaxed text-ink-2">
                Anything we have missed? Write to us at{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-ink underline decoration-[var(--c-line-strong)] underline-offset-4 transition-colors hover:decoration-ink"
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
              <div className="mt-10">
                <Button href="#shop" variant="solid">
                  Shop ALAS
                </Button>
              </div>
            </StickyExit>
          </div>
          <div className="lg:col-span-7 lg:col-start-6 xl:col-span-6 xl:col-start-7">
            <Accordion items={FAQS} />
          </div>
        </div>
      </div>
    </section>
  );
}
