import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PHOTOS } from "@/data/photos";

const STEPS = [
  {
    title: "The sea fills the pans",
    line: "Shallow salt pans in Greece take in water from the Mediterranean.",
  },
  {
    title: "The sun draws out the salt",
    line: "As the water evaporates, a thin layer of crystals forms on the surface.",
  },
  {
    title: "It is gathered by hand",
    line: "That layer is fleur de sel. It is lifted off by hand and left as it is.",
  },
];

/** Where it comes from: the harvest in one photograph, the three steps beside it. */
export function Origin() {
  return (
    <section aria-labelledby="origin-title" className="section">
      <div className="wrap grid gap-10 wide:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] wide:items-center wide:gap-16">
        <div className="relative wide:order-2">
          <figure className="photo rise aspect-[3/2] wide:aspect-[4/5]">
            <Image
              src={PHOTOS.harvest.src}
              alt={PHOTOS.harvest.alt}
              placeholder="blur"
              sizes="(min-width: 50rem) 42vw, 92vw"
              style={{ objectPosition: "68% 50%" }}
            />
          </figure>
          <figure className="photo absolute bottom-[-1.5rem] left-[-0.5rem] aspect-[16/10] w-[52%] rounded-[var(--radius-card)]! shadow-[var(--shadow-pop)] ring-4 ring-paper wide:left-[-2.5rem]">
            <Image
              src={PHOTOS.pans.src}
              alt={PHOTOS.pans.alt}
              placeholder="blur"
              sizes="(min-width: 50rem) 22vw, 48vw"
            />
          </figure>
        </div>
        <div className="max-wide:mt-6">
          <h2 id="origin-title" className="t-h2 max-w-[13ch]">
            Made by the sea and the sun.
          </h2>
          <ol className="mt-8">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="grid grid-cols-[2.75rem_1fr] gap-x-4 border-line border-t py-6 last:border-b"
              >
                <span
                  aria-hidden
                  className="t-price text-[1.375rem] leading-[1.3] text-sea"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="t-h3">{step.title}</h3>
                  <p className="t-body mt-1.5 text-ink-2">{step.line}</p>
                </div>
              </li>
            ))}
          </ol>
          <Button
            href="/history-and-science"
            tone="outline"
            arrow
            className="mt-9"
          >
            History &amp; Science
          </Button>
        </div>
      </div>
    </section>
  );
}
