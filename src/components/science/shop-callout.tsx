import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PHOTOS } from "@/data/photos";

/** The page ends with one way on: the shop on the home page. */
export function ShopCallout() {
  return (
    <section
      aria-labelledby="shop-callout-title"
      className="wrap py-[clamp(4rem,2.5rem+6vw,7.5rem)]"
    >
      <div className="flex flex-col items-start gap-8 rounded-[var(--radius-panel)] bg-navy p-7 text-white sm:p-12 wide:flex-row wide:items-end wide:justify-between lg:p-16">
        <div>
          <h2 id="shop-callout-title" className="t-display">
            Now taste it.
          </h2>
          <p className="t-lead mt-4 text-white/75">
            Greek sea salt for your water.
          </p>
        </div>
        <Button href="/#shop" tone="white" size="lg" arrow>
          Shop now
        </Button>
      </div>
      <figure className="photo mt-4 aspect-[4/3] wide:mt-5 wide:aspect-[21/9]">
        <Image
          src={PHOTOS.range.src}
          alt={PHOTOS.range.alt}
          placeholder="blur"
          sizes="(min-width: 82rem) 78rem, 92vw"
          style={{ objectPosition: "100% 78%" }}
        />
      </figure>
    </section>
  );
}
