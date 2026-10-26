import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CLOSING_LINE, FRAME_FOCUS, type HowToFrames, STEPS } from "./steps";

/** Reduced motion: the four frames as numbered stills, no pin, nothing moving. */
export function HowToStill({ frames }: { frames: HowToFrames }) {
  return (
    <div className="container-x hidden py-[var(--section-y)] motion-reduce:block">
      <p className="rule-label eyebrow">/ How to use</p>
      <h2 className="font-display mt-10 text-ink [font-size:var(--fs-h1)]">
        Tear, pour, stir, drink.
      </h2>
      <ol className="mt-14 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-6">
        {frames.map((frame, i) => (
          <li key={frame.src}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--r-md)] bg-stone">
              <Image
                src={frame.src}
                alt={frame.alt}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover"
                style={{ objectPosition: FRAME_FOCUS }}
              />
            </div>
            <p className="eyebrow mt-4">
              {STEPS[i].n} / {STEPS[i].label}
            </p>
            <p className="font-display mt-2 text-ink [font-size:var(--fs-h3)] leading-[1.15]">
              {STEPS[i].line}
            </p>
          </li>
        ))}
      </ol>
      <div className="mt-16 flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
        <p className="font-display text-ink [font-size:var(--fs-h2)]">
          {CLOSING_LINE}
        </p>
        <Button href="#shop" size="lg">
          Shop the sticks
        </Button>
      </div>
    </div>
  );
}
