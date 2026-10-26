import Image from "next/image";
import { art } from "@/data/art";

/**
 * The chapter without motion (prefers-reduced-motion): a quiet lexicon entry.
 * Rendered always, shown only by the reduced-motion media query, so there is no
 * flash and no JavaScript decision.
 */
export function AlasStill() {
  return (
    <div className="alas-still">
      <div className="container-x">
        <p className="rule-label eyebrow">/ The word</p>

        <div className="alas-still-head">
          <p aria-hidden lang="grc" className="font-display alas-still-word">
            ἅλας
          </p>
          <h2 className="font-display alas-statement">
            <span className="sr-only">
              <span lang="grc">ἅλας</span>.{" "}
            </span>
            Greek for salt.
          </h2>
          <p className="eyebrow">/ Say it: AH-las</p>
        </div>

        <div className="alas-still-sea">
          <div className="alas-still-arch">
            <Image
              src={art.photo.horizon.src}
              alt={art.photo.horizon.alt}
              fill
              sizes="(min-width: 768px) 24vw, 70vw"
              quality={75}
              className="alas-arch-photo"
            />
          </div>
          <div className="alas-still-text">
            <p lang="grc" className="font-display alas-still-greek">
              ἅλς
            </p>
            <p className="font-display alas-statement">
              Salt and sea, one word.
            </p>
            <p className="alas-small">
              In the oldest Greek, <span lang="grc">ἅλς</span> meant both.
              <br />
              Sea salt still does.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
