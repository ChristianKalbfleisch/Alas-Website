import Image from "next/image";
import { MORE_USES, MORE_USES_TITLE } from "@/data/faq";
import { PHOTOS, type Photo } from "@/data/photos";

const WAYS: { photo: Photo; title: string; line: string; at?: string }[] = [
  {
    photo: PHOTOS.glassPinch,
    title: "In your glass",
    line: "Start your morning with a pinch of sea salt in your water.",
    at: "64% 50%",
  },
  {
    photo: PHOTOS.toteSticks,
    title: "In your bottle",
    line: "Tear a stick into your bottle. Shake and drink.",
    at: "60% 70%",
  },
  {
    photo: PHOTOS.plate,
    title: "On your plate",
    line: "A pinch over your food, just before you eat.",
  },
];

/**
 * How to use it: three everyday moments, each one a photograph, then a fourth
 * box that leaves the rest to the reader and names more uses.
 */
export function HowTo() {
  return (
    <section
      id="how-to-use"
      aria-labelledby="how-title"
      className="section bg-mist"
    >
      <div className="wrap">
        <div className="grid gap-4 wide:grid-cols-2 wide:items-end wide:gap-16">
          <h2 id="how-title" className="t-h2">
            Make it your ritual.
          </h2>
          <p className="t-lead max-w-[30rem] text-ink-2">
            No scoop, no shaker, nothing to mix. A quick stir and you’re ready
            to go.
          </p>
        </div>
        <ul className="mt-10 grid gap-4 wide:mt-12 wide:grid-cols-3 wide:gap-5">
          {WAYS.map((way) => (
            <li
              key={way.title}
              className="photo rise aspect-[4/5] max-wide:aspect-[5/4]"
            >
              <Image
                src={way.photo.src}
                alt={way.photo.alt}
                placeholder="blur"
                sizes="(min-width: 50rem) 30vw, 92vw"
                style={{ objectPosition: way.at }}
              />
              <div className="photo-caption">
                <h3 className="t-h3">{way.title}</h3>
                {/* Room for the longest line, so the three titles stay level. */}
                <p className="t-body mt-1 text-balance text-white/85 wide:min-h-[4.65em] lg:min-h-[3.1em]">
                  {way.line}
                </p>
              </div>
            </li>
          ))}
        </ul>
        {/* Each column is inset like the captions above, so the box's words
            start under the three cards' words. */}
        <div className="rise mt-4 grid gap-y-6 rounded-[var(--radius-panel)] bg-paper py-6 wide:mt-5 wide:grid-cols-3 wide:gap-x-5 wide:py-7">
          <div className="px-6 wide:px-7">
            <h3 className="t-h3 text-balance">
              There’s no one way to enjoy ALAS.
            </h3>
            <p className="t-body mt-1 text-ink-2">
              Find what feels right for you.
            </p>
          </div>
          <div className="px-6 wide:col-span-2 wide:px-7">
            <h4 className="t-body font-bold">{MORE_USES_TITLE}</h4>
            <ul className="t-body mt-2 grid gap-1.5 text-ink-2">
              {MORE_USES.map((line) => (
                <li key={line.label}>
                  <span className="font-bold text-ink">{line.label}:</span>{" "}
                  {line.uses}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
