import type { Metadata } from "next";
import Image from "next/image";
import { ChapterNav } from "@/components/science/chapter-nav";
import { Myth } from "@/components/science/myth";
import { Origin } from "@/components/science/origin";
import { Rituals } from "@/components/science/rituals";
import { ShopCallout } from "@/components/science/shop-callout";
import { SourceList } from "@/components/science/source-list";
import { Why } from "@/components/science/why";
import { Word } from "@/components/science/word";
import { PHOTOS } from "@/data/photos";

export const metadata: Metadata = {
  title: "History & Science · ÁLAS Salt Co.",
  description:
    "What ἅλας means, why people have kept salt close for thousands of years, and how Greek fleur de sel is made. Every fact links to its source.",
};

/** The long read: a header, the chapter list, the chapters, the sources, the shop. */
export default function SciencePage() {
  return (
    <main>
      <header className="wrap pt-[clamp(2.5rem,1.5rem+4vw,5rem)]">
        <h1 className="t-display max-w-[14ch] text-navy">
          From ancient wellness to modern day.
        </h1>
        <p className="t-lead mt-6 max-w-[34rem] text-ink-2">
          What our name means, why people have kept salt close for thousands of
          years, and how ours is made. Every fact links to its source.
        </p>
        <figure className="photo mt-10 aspect-[4/3] wide:mt-14 wide:aspect-[21/9]">
          <Image
            src={PHOTOS.pans.src}
            alt={PHOTOS.pans.alt}
            placeholder="blur"
            priority
            sizes="(min-width: 82rem) 78rem, 92vw"
          />
        </figure>
      </header>

      <div className="wrap grid gap-x-20 gap-y-12 pt-[clamp(3rem,2rem+4vw,5.5rem)] lg:grid-cols-[13rem_minmax(0,1fr)]">
        <ChapterNav />
        <div className="text-pretty">
          <Word />
          <Myth />
          <Origin />
          <Why />
          <Rituals />
          <SourceList />
        </div>
      </div>

      <ShopCallout />
    </main>
  );
}
