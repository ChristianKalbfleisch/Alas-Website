import Image from "next/image";
import { Hand, Sea, Sun } from "@/components/ui/icons";
import { PHOTOS } from "@/data/photos";

/** Each line is printed on the pack or on the supplier's certificate. */
const FACTS = [
  {
    icon: Hand,
    title: "Gathered by hand",
    line: "Skimmed from the surface of Greek salt pans, a little at a time.",
  },
  {
    icon: Sun,
    title: "Dried by the sun",
    line: "Sun and wind do the drying. The crystals stay as they formed.",
  },
  {
    icon: Sea,
    title: "Nothing added",
    line: "No anti-caking agents. Classic is sea salt and nothing else.",
  },
];

/** What it is: the product in sunlight, the salt up close, three plain facts. */
export function Values() {
  return (
    <section aria-labelledby="values-title" className="section">
      <div className="wrap grid gap-12 wide:grid-cols-2 wide:items-center wide:gap-20">
        <div className="relative mr-[12%]">
          <figure className="photo rise aspect-[4/5]">
            <Image
              src={PHOTOS.stillSun.src}
              alt={PHOTOS.stillSun.alt}
              placeholder="blur"
              sizes="(min-width: 50rem) 38vw, 80vw"
            />
          </figure>
          <figure className="absolute top-6 right-[-13.6%] w-[44%] wide:top-10">
            <div className="photo group aspect-square rounded-[var(--radius-card)]! shadow-[var(--shadow-pop)] ring-4 ring-paper">
              <Image
                src={PHOTOS.crystals.src}
                alt={PHOTOS.crystals.alt}
                placeholder="blur"
                sizes="(min-width: 50rem) 18vw, 38vw"
                style={{ objectPosition: "100% 50%" }}
              />
              {/* The second frame: a scoop lifting the same salt, shown while a pointer rests here. */}
              <Image
                src={PHOTOS.crystalsScoop.src}
                alt=""
                aria-hidden
                placeholder="blur"
                sizes="(min-width: 50rem) 18vw, 38vw"
                className="opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100 motion-reduce:transition-none"
                style={{ objectPosition: "100% 50%" }}
              />
            </div>
            <figcaption className="chip chip-white absolute top-full right-0 mt-3">
              Fine crystals, 0.5 to 2 mm
            </figcaption>
          </figure>
        </div>
        <div>
          <h2 id="values-title" className="t-h2">
            The first salt the sea gives up.
          </h2>
          <p className="t-lead mt-5 max-w-[34rem] text-ink-2">
            When sea water rests in the sun, a thin crust of crystals forms on
            its surface before anything else. That crust is fleur de sel. It is
            lifted off by hand and left exactly as it is.
          </p>
          <ul className="mt-9 grid">
            {FACTS.map((fact) => (
              <li
                key={fact.title}
                className="flex items-start gap-5 border-line border-t py-6 last:border-b"
              >
                <span className="grid size-14 shrink-0 place-items-center rounded-full bg-mist text-navy">
                  <fact.icon size={28} />
                </span>
                <div>
                  <h3 className="t-h3">{fact.title}</h3>
                  <p className="t-body mt-1 text-ink-2">{fact.line}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
