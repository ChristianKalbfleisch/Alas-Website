import { RevealText } from "@/components/motion/reveal-text";
import { Quiz } from "./quiz";

/**
 * 08 / Quiz. One window onto the shallow water of a white-rock cove; one liquid
 * glass card, one question at a time; a ritual of your own and a gift at the end.
 * `data-gift-avoid` keeps the floating gift launcher out of the way here.
 */
export default function QuizSection() {
  return (
    <section
      id="quiz"
      data-section="quiz"
      data-gift-avoid
      className="relative bg-chalk py-[var(--section-y)] text-ink"
    >
      <div className="container-x">
        <div className="rule-label">
          <p className="eyebrow">/ Quiz</p>
          <p className="eyebrow ml-auto hidden !text-ink-3 sm:block">
            Your ritual · A word or two · A gift
          </p>
        </div>
        <div
          data-exit
          className="mt-10 grid gap-5 md:mt-14 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:items-end md:gap-12"
        >
          <RevealText
            as="h2"
            className="font-display text-[length:var(--fs-h2)] text-ink [text-wrap:balance]"
          >
            How well do you know your salt?
          </RevealText>
          <RevealText className="max-w-[36ch] text-[15px] text-ink-2 md:justify-self-end md:pb-2">
            One question about you, four about the sea. Your ritual and a gift
            from the Aegean at the end.
          </RevealText>
        </div>
        <Quiz />
      </div>
    </section>
  );
}
