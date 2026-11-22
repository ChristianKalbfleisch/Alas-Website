import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PHOTOS, type Photo } from "@/data/photos";

const MOMENTS: { photo: Photo; when: string; at?: string }[] = [
  { photo: PHOTOS.kitchen, when: "To start your day" },
  { photo: PHOTOS.seawall, when: "After the run", at: "82% 50%" },
  { photo: PHOTOS.gym, when: "Between sets" },
  { photo: PHOTOS.desk, when: "At the desk" },
  { photo: PHOTOS.car, when: "On the road" },
  { photo: PHOTOS.dusk, when: "When the day is done" },
];

/** Who it is for, shown rather than said: one wide landscape, six moments. */
export function People() {
  return (
    <section
      aria-labelledby="people-title"
      className="section navy-lit text-white"
    >
      <div className="wrap">
        <figure className="photo rise aspect-[16/9] max-wide:aspect-[4/5]">
          <Image
            src={PHOTOS.trail.src}
            alt={PHOTOS.trail.alt}
            placeholder="blur"
            sizes="(min-width: 82rem) 78rem, 92vw"
          />
          <figcaption className="photo-caption">
            <h2 id="people-title" className="t-h2 max-w-[18ch]">
              For mornings, miles and meals.
            </h2>
            <p className="t-lead mt-3 max-w-[34rem] text-white/85">
              One salt for the glass by your bed, the bottle in your bag and the
              plate in front of you.
            </p>
          </figcaption>
        </figure>
      </div>
      <ul
        className="strip mx-auto mt-4 max-w-[82rem] wide:mt-5"
        aria-label="Moments in a day"
      >
        {MOMENTS.map((moment) => (
          <li
            key={moment.when}
            className="photo aspect-[4/5] w-[70vw] max-w-[19rem] sm:w-[19rem]"
          >
            <Image
              src={moment.photo.src}
              alt={moment.photo.alt}
              placeholder="blur"
              sizes="19rem"
              style={{ objectPosition: moment.at }}
            />
            <p className="photo-caption text-[1.1875rem] leading-tight font-bold">
              {moment.when}
            </p>
          </li>
        ))}
      </ul>
      <div className="wrap mt-9">
        <Button
          href="/science-and-history#why"
          tone="outline-white"
          size="lg"
          arrow
        >
          Why people salt their water
        </Button>
      </div>
    </section>
  );
}
