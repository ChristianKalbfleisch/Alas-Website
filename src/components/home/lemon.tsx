import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PHOTOS } from "@/data/photos";

/** The second flavour, given its own moment. */
export function Lemon() {
  return (
    <section aria-labelledby="lemon-title" className="section bg-lemon-tint">
      <div className="wrap grid gap-10 wide:grid-cols-2 wide:items-center wide:gap-20">
        <figure className="photo rise aspect-[4/5] wide:aspect-[5/6]">
          <Image
            src={PHOTOS.lemon.src}
            alt={PHOTOS.lemon.alt}
            placeholder="blur"
            sizes="(min-width: 50rem) 42vw, 92vw"
          />
        </figure>
        <div>
          <h2 id="lemon-title" className="t-h2">
            Lemon Zest, coming soon.
          </h2>
          <p className="t-lead mt-5 max-w-[32rem] text-ink-2">
            The same Greek fleur de sel with lemon: a bright citrus note over a
            clean, briny finish. In a pouch for home and in sticks for the road.
          </p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-start">
            <Button href="/products/lemon-pouch" size="lg" arrow>
              Pre-order the Lemon pouch
            </Button>
            <Button href="/products/lemon-sticks-15" tone="outline" size="lg">
              Pre-order the Lemon sticks
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
