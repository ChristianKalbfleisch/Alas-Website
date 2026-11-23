import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Bag, Bottle, Gift } from "@/components/ui/icons";
import { PHOTOS } from "@/data/photos";
import { WholesaleForm } from "./wholesale-form";

export const metadata: Metadata = {
  title: "Wholesale · ÁLAS Salt Co.",
  description:
    "Carry ÁLAS in your shop, studio or spa, or send it as a gift. Apply for wholesale.",
};

const WHO = [
  {
    icon: Bag,
    title: "Shops and markets",
    line: "Pouches for the shelf beside the olive oil and the honey.",
  },
  {
    icon: Bottle,
    title: "Gyms, studios and spas",
    line: "Classic Sticks for the front desk, the bag and the locker room.",
  },
  {
    icon: Gift,
    title: "Gifts for clients and teams",
    line: "Pouches and sticks for closings, thank-yous and the holidays.",
  },
];

/** Wholesale: who it is for on one side, the application on the other. */
export default function WholesalePage() {
  return (
    <main>
      <div className="wrap grid gap-x-20 gap-y-12 pt-[clamp(2.5rem,1.5rem+4vw,5rem)] pb-[clamp(4rem,2.5rem+6vw,7.5rem)] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div>
          <h1 className="t-display text-navy">Carry ÁLAS.</h1>
          <p className="t-lead mt-6 max-w-[28rem] text-ink-2">
            Greek sea salt for your shelves, your studio and your clients.
          </p>
          <Button href="#apply" size="lg" arrow className="mt-8 lg:hidden">
            Apply for wholesale
          </Button>
          <figure className="photo mt-10 aspect-[4/3]">
            <Image
              src={PHOTOS.stillSun.src}
              alt={PHOTOS.stillSun.alt}
              placeholder="blur"
              priority
              sizes="(min-width: 64rem) 34rem, 92vw"
              style={{ objectPosition: "50% 78%" }}
            />
          </figure>
          <ul className="mt-10 lg:mt-14">
            {WHO.map((item) => (
              <li
                key={item.title}
                className="flex items-start gap-5 border-line border-t py-6 last:border-b"
              >
                <span className="grid size-14 shrink-0 place-items-center rounded-full bg-mist text-navy">
                  <item.icon size={28} />
                </span>
                <div>
                  <h2 className="t-h3">{item.title}</h2>
                  <p className="t-body mt-1 text-ink-2">{item.line}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <section
          id="apply"
          aria-labelledby="apply-title"
          className="rounded-[var(--radius-panel)] bg-mist p-6 sm:p-10 lg:self-start"
        >
          <h2 id="apply-title" className="t-h2">
            Tell us about your business.
          </h2>
          <p className="t-body mt-3 max-w-[34rem] text-ink-2">
            We read every application and write back by email with wholesale
            terms.
          </p>
          <WholesaleForm />
        </section>
      </div>
    </main>
  );
}
