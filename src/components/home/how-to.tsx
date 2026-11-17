import Image from "next/image";
import { PHOTOS, type Photo } from "@/data/photos";

const WAYS: { photo: Photo; title: string; line: string; at?: string }[] = [
  {
    photo: PHOTOS.glassPinch,
    title: "In your glass",
    line: "A pinch in your first glass of water of the day.",
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

/** How to use it: three everyday moments, each one a photograph. */
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
            Three ways to use it.
          </h2>
          <p className="t-lead max-w-[30rem] text-ink-2">
            No scoop, no shaker, nothing to mix. A quick stir and it is gone.
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
                <p className="t-body mt-1 text-white/85">{way.line}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
